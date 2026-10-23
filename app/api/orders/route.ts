import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildWhatsAppLink } from '@/lib/utils';
import { WHATSAPP_NUMBER } from '@/lib/data';
import { CouponService } from '@/lib/coupon-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      total,
      subtotal,
      couponDetails,
      customerName,
      customerEmail,
      customerPhone,
      userId,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'A sacola está vazia.' },
        { status: 400 }
      );
    }

    const whatsappNumber =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || WHATSAPP_NUMBER;

    const whatsappUrl = buildWhatsAppLink(
      whatsappNumber,
      items,
      total,
      couponDetails || null,
      subtotal
    );

    let orderId = `order-${Date.now()}`;

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
      orderId = order.id;
    } catch (dbError) {
      // Fallback if DB is disconnected
    }

    // Process coupon redemption if coupon details were supplied
    if (couponDetails) {
      const list = Array.isArray(couponDetails) ? couponDetails : [couponDetails];
      for (const coup of list) {
        if (coup.code) {
          try {
            CouponService.redeemCoupon({
              couponCode: coup.code,
              orderId,
              customerName: customerName || 'Cliente Anônimo',
              customerEmail,
              customerPhone,
              items,
            });
          } catch (e) {
            console.error('Redemption error in orders route:', e);
          }
        }
      }
    }

    return NextResponse.json({
      orderId,
      whatsappUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno ao processar pedido.' },
      { status: 500 }
    );
  }
}
