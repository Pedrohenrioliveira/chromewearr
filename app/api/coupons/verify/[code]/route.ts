import { NextRequest, NextResponse } from 'next/server';
import { CouponService, getEffectiveStatus } from '@/lib/coupon-service';

// GET /api/coupons/verify/[code] - Fetch verification details and live coupon status
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const verification = CouponService.getVerificationByCode(code);

    if (!verification) {
      return NextResponse.json({ error: 'Código de verificação não encontrado.' }, { status: 404 });
    }

    const coupon = CouponService.getCouponByCode(verification.couponCode);
    const couponStatus = coupon ? getEffectiveStatus(coupon) : 'EXPIRED';

    return NextResponse.json({
      verification,
      coupon,
      couponStatus,
      isCouponActive: couponStatus === 'ACTIVE',
    });
  } catch (error: any) {
    console.error('Error fetching verification details:', error);
    return NextResponse.json({ error: 'Erro ao consultar código de verificação.' }, { status: 500 });
  }
}

// POST /api/coupons/verify/[code] - Confirm or Cancel verification
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await context.params;
    const body = await request.json();
    const action = body.action || 'confirm';
    const adminName = body.adminName || 'Administrador';

    if (action === 'confirm') {
      const result = CouponService.confirmVerification(code, adminName);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Erro ao confirmar uso do cupom.' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Uso do cupom confirmado com sucesso!',
        verification: result.verification,
      });
    } else if (action === 'cancel') {
      const result = CouponService.cancelVerification(code, adminName);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Erro ao cancelar código de verificação.' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        message: 'Código de verificação cancelado e cupom liberado.',
        verification: result.verification,
      });
    } else {
      return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error processing verification action:', error);
    return NextResponse.json({ error: 'Erro ao processar verificação.' }, { status: 500 });
  }
}
