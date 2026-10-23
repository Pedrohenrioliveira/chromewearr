import { NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

export async function GET() {
  try {
    const meta = CouponService.getAvailableMetadata();
    return NextResponse.json(meta);
  } catch (error: any) {
    console.error('Error fetching coupon metadata:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados complementares.' }, { status: 500 });
  }
}
