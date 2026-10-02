import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildWhatsAppLink } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, total, customerName, customerEmail, customerPhone, userId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'A sacola está vazia.' },
        { status: 400 }
      );
    }

    const whatsappNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5511999999999';

    const whatsappUrl = buildWhatsAppLink(whatsappNumber, items, total);

    try {
      const order = await prisma.order.create({
        data: {
          customerName: customerName || 'Cliente Anônimo',
          customerEmail: customerEmail || null,
          customerPhone: customerPhone || null,
          totalPrice: total,
          status: 'PENDING',
          items: JSON.stringify(items),
          userId: userId || null,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        whatsappUrl,
      });
    } catch (dbError) {
      // Fallback if DB is disconnected
      return NextResponse.json({
        orderId: `order-${Date.now()}`,
        whatsappUrl,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno ao processar pedido.' },
      { status: 500 }
    );
  }
}
