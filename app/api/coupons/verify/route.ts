import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

// GET /api/coupons/verify - List or search verifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim().toUpperCase() || '';
    const status = searchParams.get('status') || 'ALL';

    let verifications = CouponService.getAllVerifications();

    if (status !== 'ALL') {
      verifications = verifications.filter((v) => v.status === status);
    }

    if (query) {
      verifications = verifications.filter(
        (v) =>
          v.code.toUpperCase().includes(query) ||
          v.couponCode.toUpperCase().includes(query) ||
          v.customerName.toUpperCase().includes(query)
      );
    }

    return NextResponse.json(verifications);
  } catch (error: any) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: 'Erro ao buscar verificações de cupons.' }, { status: 500 });
  }
}

// POST /api/coupons/verify - Create a new pre-redemption verification code for WhatsApp checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { couponCode, items, customerName, customerEmail, customerPhone, subtotal, finalTotal } = body;

    if (!couponCode) {
      return NextResponse.json({ error: 'Código do cupom é obrigatório.' }, { status: 400 });
    }

    const result = CouponService.createVerification({
      couponCode,
      items: items || [],
      customerName,
      customerEmail,
      customerPhone,
      subtotal: Number(subtotal) || 0,
      finalTotal: Number(finalTotal) || 0,
    });

    if (!result.success || !result.verification) {
      return NextResponse.json({ error: result.error || 'Erro ao gerar código de verificação.' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      verification: result.verification,
    });
  } catch (error: any) {
    console.error('Error creating verification code:', error);
    return NextResponse.json({ error: 'Erro interno ao gerar código de verificação.' }, { status: 500 });
  }
}
