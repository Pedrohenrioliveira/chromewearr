import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.toLowerCase();
    const status = searchParams.get('status');
    const discountType = searchParams.get('type');
    const sellerId = searchParams.get('sellerId');

    let coupons = CouponService.getAllCoupons();

    if (search) {
      coupons = coupons.filter(
        (c) =>
          c.code.toLowerCase().includes(search) ||
          c.name.toLowerCase().includes(search) ||
          (c.description && c.description.toLowerCase().includes(search))
      );
    }

    if (status && status !== 'ALL') {
      coupons = coupons.filter((c) => c.status === status);
    }

    if (discountType && discountType !== 'ALL') {
      coupons = coupons.filter((c) => c.discountType === discountType);
    }

    if (sellerId && sellerId !== 'ALL') {
      coupons = coupons.filter(
        (c) => c.sellerScope === 'ALL' || c.selectedSellerIds.includes(sellerId)
      );
    }

    const stats = CouponService.getDashboardStats();

    return NextResponse.json({
      coupons,
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: 'Erro ao listar cupons.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const adminName = body.adminName || 'Administrador';

    const result = CouponService.createCoupon(body, adminName);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.coupon, { status: 201 });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar cupom.' }, { status: 500 });
  }
}
