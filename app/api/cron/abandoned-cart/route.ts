import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAbandonedCartEmail, CartEmailItem } from '@/lib/email';

function parseUserCart(cartData: any): { items: any[]; reminderSentAt?: string } {
  if (!cartData) return { items: [] };

  if (Array.isArray(cartData)) {
    // Check if any item has reminderSentAt
    const reminderSentAt = cartData.find((i: any) => i.reminderSentAt)?.reminderSentAt;
    return { items: cartData, reminderSentAt };
  }

  if (typeof cartData === 'string') {
    try {
      const parsed = JSON.parse(cartData);
      if (Array.isArray(parsed)) {
        return { items: parsed };
      }
      if (parsed && typeof parsed === 'object') {
        return {
          items: Array.isArray(parsed.items) ? parsed.items : [],
          reminderSentAt: parsed.reminderSentAt,
        };
      }
    } catch {
      return { items: [] };
    }
  }

  if (typeof cartData === 'object' && cartData !== null) {
    return {
      items: Array.isArray(cartData.items) ? cartData.items : [],
      reminderSentAt: cartData.reminderSentAt,
    };
  }

  return { items: [] };
}

export async function GET(req: Request) {
  return handleCheckAndSendReminders(req);
}

export async function POST(req: Request) {
  return handleCheckAndSendReminders(req);
}

async function handleCheckAndSendReminders(req: Request) {
  try {
    const now = new Date();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        cartData: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    const results: any[] = [];
    let sentCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      const { items, reminderSentAt } = parseUserCart(user.cartData);

      if (!items || items.length === 0) {
        continue;
      }

      // Check how many days the cart has been inactive
      // Take the oldest item's addedAt, or fallback to user.updatedAt
      const oldestDateStr = items[0]?.addedAt || user.updatedAt || user.createdAt;
      const oldestDate = new Date(oldestDateStr);
      const diffMs = now.getTime() - oldestDate.getTime();
      const daysInactive = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Condition: at least 30 days inactive
      if (daysInactive < 30) {
        skippedCount++;
        results.push({
          userId: user.id,
          email: user.email,
          status: 'skipped',
          reason: `Carrinho inativo há ${daysInactive} dias (necessário 30+ dias)`,
        });
        continue;
      }

      // Check if reminder was already sent in the last 30 days
      if (reminderSentAt) {
        const lastSentDate = new Date(reminderSentAt);
        const daysSinceLastSent = Math.floor((now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastSent < 30) {
          skippedCount++;
          results.push({
            userId: user.id,
            email: user.email,
            status: 'skipped',
            reason: `Lembrete já enviado há ${daysSinceLastSent} dias`,
          });
          continue;
        }
      }

      // Format items for email
      const emailItems: CartEmailItem[] = items.map((i: any) => ({
        name: i.name,
        price: Number(i.price) || 0,
        imageUrl: i.imageUrl,
        size: i.size || 'M',
        quantity: Number(i.quantity) || 1,
        ref: i.ref,
      }));

      // Send the automated email
      try {
        const emailResult = await sendAbandonedCartEmail({
          to: user.email,
          customerName: user.name,
          items: emailItems,
          daysAgo: daysInactive,
        });

        if (emailResult.success) {
          sentCount++;
          const nowIso = now.toISOString();

          // Update user cartData with reminderSentAt
          const updatedItems = items.map((i: any) => ({
            ...i,
            reminderSentAt: nowIso,
          }));

          const newCartData = {
            items: updatedItems,
            reminderSentAt: nowIso,
            lastEmailSentAt: nowIso,
          };

          await prisma.user.update({
            where: { id: user.id },
            data: {
              cartData: newCartData,
            },
          });

          results.push({
            userId: user.id,
            email: user.email,
            status: 'sent',
            daysInactive,
            messageId: emailResult.messageId,
          });
        } else {
          errorCount++;
          results.push({
            userId: user.id,
            email: user.email,
            status: 'error',
            error: emailResult.error,
          });
        }
      } catch (sendErr: any) {
        errorCount++;
        console.error(`Erro ao enviar email para ${user.email}:`, sendErr);
        results.push({
          userId: user.id,
          email: user.email,
          status: 'error',
          error: sendErr.message || String(sendErr),
        });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        totalWithCart: users.length,
        sent: sentCount,
        skipped: skippedCount,
        errors: errorCount,
      },
      details: results,
    });
  } catch (err: any) {
    console.error('Erro na rotina de carrinho abandonado:', err);
    return NextResponse.json(
      { error: 'Erro ao processar rotina de carrinho abandonado', details: err.message },
      { status: 500 }
    );
  }
}
