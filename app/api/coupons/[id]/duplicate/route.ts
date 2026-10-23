import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const adminName = body.adminName || 'Administrador';

    const result = CouponService.duplicateCoupon(id, adminName);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.coupon, { status: 201 });
  } catch (error: any) {
    console.error('Error duplicating coupon:', error);
    return NextResponse.json({ error: 'Erro ao duplicar cupom.' }, { status: 500 });
  }
}
