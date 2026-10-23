import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, orderId, customerName, customerEmail, customerPhone, items } = body;

    if (!couponCode) {
      return NextResponse.json({ error: 'Código de cupom obrigatório.' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Itens do pedido obrigatórios.' }, { status: 400 });
    }

    const result = CouponService.redeemCoupon({
      couponCode,
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      items,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Não foi possível resgatar o cupom.' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error redeeming coupon:', error);
    return NextResponse.json({ error: 'Erro ao resgatar cupom.' }, { status: 500 });
  }
}
