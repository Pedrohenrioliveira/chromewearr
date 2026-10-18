import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendAbandonedCartEmail, CartEmailItem } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        cartData: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    let items: any[] = [];
    if (user.cartData) {
      if (typeof user.cartData === 'string') {
        try {
          const parsed = JSON.parse(user.cartData);
          items = Array.isArray(parsed) ? parsed : (parsed.items || []);
        } catch {
          items = [];
        }
      } else if (Array.isArray(user.cartData)) {
        items = user.cartData;
      } else if (typeof user.cartData === 'object' && user.cartData !== null) {
        items = (user.cartData as any).items || [];
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ error: 'A sacola deste usuário está vazia.' }, { status: 400 });
    }

    // Calculate days inactive
    const oldestDateStr = items[0]?.addedAt || user.updatedAt || user.createdAt;
    const diffMs = Date.now() - new Date(oldestDateStr).getTime();
    const daysInactive = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    const emailItems: CartEmailItem[] = items.map((i: any) => ({
      name: i.name,
      price: Number(i.price) || 0,
      imageUrl: i.imageUrl,
      size: i.size || 'M',
      quantity: Number(i.quantity) || 1,
      ref: i.ref,
    }));

    const result = await sendAbandonedCartEmail({
      to: user.email,
      customerName: user.name,
      items: emailItems,
      daysAgo: daysInactive,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Falha ao enviar e-mail' }, { status: 500 });
    }

    const nowIso = new Date().toISOString();
    const updatedItems = items.map((i: any) => ({
      ...i,
      reminderSentAt: nowIso,
    }));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        cartData: {
          items: updatedItems,
          reminderSentAt: nowIso,
          lastEmailSentAt: nowIso,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `E-mail de recuperação enviado com sucesso para ${user.email}!`,
      reminderSentAt: nowIso,
    });
  } catch (err: any) {
    console.error('Erro ao enviar lembrete manual de carrinho:', err);
    return NextResponse.json(
      { error: 'Erro ao processar envio de lembrete', details: err.message },
      { status: 500 }
    );
  }
}
