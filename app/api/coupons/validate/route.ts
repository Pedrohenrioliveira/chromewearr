import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, items, customerIdentifier, appliedCoupons } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, message: 'Informe o código do cupom.' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { valid: false, message: 'A sacola está vazia.' },
        { status: 400 }
      );
    }

    const result = CouponService.validateCouponForCart({
      code,
      items,
      customerIdentifier,
      appliedCoupons,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { valid: false, message: 'Erro ao validar cupom.' },
      { status: 500 }
    );
  }
}
