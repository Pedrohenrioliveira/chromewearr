import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAbandonedCartEmail, CartEmailItem } from '@/lib/email';

export async function GET(req: Request) {
  return handleTestSend(req);
}

export async function POST(req: Request) {
  return handleTestSend(req);
}

async function handleTestSend(req: Request) {
  try {
    const url = new URL(req.url);
    const targetEmailParam = url.searchParams.get('email');
    const sendToAllParam = url.searchParams.get('all') === 'true';

    let bodyData: any = {};
    if (req.method === 'POST') {
      try {
        bodyData = await req.json();
      } catch {
        bodyData = {};
      }
    }

    const targetEmail = bodyData.email || targetEmailParam;
    const sendToAll = bodyData.all || sendToAllParam;

    // Sample fallback items if user doesn't have cart items
    const sampleItems: CartEmailItem[] = [
      {
        name: 'Camiseta CW Heavyweight 240g Oversized',
        price: 249.0,
        size: 'G',
        quantity: 1,
        ref: '01/25',
        imageUrl: '/images/products/camiseta-preta.webp',
      },
      {
        name: 'Calça Cargo Streetwear Utilitária',
        price: 389.0,
        size: '42',
        quantity: 1,
        ref: '02/25',
        imageUrl: '/images/products/calca-cargo.webp',
      },
    ];

    // Helper to get items from user cart or sample
    const getItemsForUser = (user: any): CartEmailItem[] => {
      if (user.cartData) {
        let parsed: any[] = [];
        if (typeof user.cartData === 'string') {
          try {
            const p = JSON.parse(user.cartData);
            parsed = Array.isArray(p) ? p : (p.items || []);
          } catch {
            parsed = [];
          }
        } else if (Array.isArray(user.cartData)) {
          parsed = user.cartData;
        } else if (typeof user.cartData === 'object') {
          parsed = user.cartData.items || [];
        }

        if (parsed.length > 0) {
          return parsed.map((i: any) => ({
            name: i.name,
            price: Number(i.price) || 0,
            size: i.size || 'M',
            quantity: Number(i.quantity) || 1,
            ref: i.ref || '01/25',
            imageUrl: i.imageUrl,
          }));
        }
      }
      return sampleItems;
    };

    const results: Array<{ email: string; name: string; status: 'sent' | 'error'; error?: string; messageId?: string }> = [];

    // Case 1: Send to a specific single email
    if (targetEmail && !sendToAll) {
      const cleanEmail = targetEmail.trim().toLowerCase();
      const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
      const customerName = existingUser?.name || 'Cliente de Teste';
      const items = existingUser ? getItemsForUser(existingUser) : sampleItems;

      const result = await sendAbandonedCartEmail({
        to: cleanEmail,
        customerName,
        items,
        daysAgo: 30,
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `E-mail de teste enviado com sucesso para ${cleanEmail}!`,
          details: [{ email: cleanEmail, name: customerName, status: 'sent', messageId: result.messageId }],
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Erro ao enviar e-mail de teste.',
          },
          { status: 500 }
        );
      }
    }

    // Case 2: Send to all registered users (or default if no email provided)
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        cartData: true,
      },
    });

    if (allUsers.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum usuário cadastrado encontrado no banco de dados.' },
        { status: 404 }
      );
    }

    for (const u of allUsers) {
      const items = getItemsForUser(u);

      try {
        const sendResult = await sendAbandonedCartEmail({
          to: u.email,
          customerName: u.name,
          items,
          daysAgo: 30,
        });

        if (sendResult.success) {
          results.push({ email: u.email, name: u.name, status: 'sent', messageId: sendResult.messageId });
        } else {
          results.push({ email: u.email, name: u.name, status: 'error', error: sendResult.error });
        }
      } catch (err: any) {
        results.push({ email: u.email, name: u.name, status: 'error', error: err.message || String(err) });
      }
    }

    const sentCount = results.filter((r) => r.status === 'sent').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    return NextResponse.json({
      success: true,
      message: `Disparo de teste concluído! ${sentCount} e-mails enviados, ${errorCount} erros.`,
      summary: {
        total: allUsers.length,
        sent: sentCount,
        errors: errorCount,
      },
      details: results,
    });
  } catch (error: any) {
    console.error('Erro no disparo de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao processar disparo de teste', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
