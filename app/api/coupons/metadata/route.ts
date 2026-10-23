import { NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const meta = CouponService.getAvailableMetadata();

    // Dynamically retrieve registered vendors from database
    try {
      const realVendors = await prisma.user.findMany({
        where: { role: 'VENDOR' },
        select: { id: true, name: true, email: true },
      });
      if (realVendors && realVendors.length > 0) {
        meta.sellers = realVendors.map((v) => ({
          id: v.id,
          name: v.name || v.email,
          status: 'ACTIVE',
        }));
      }
    } catch (e) {
      // Prisma fallback
    }

    return NextResponse.json(meta);
  } catch (error: any) {
    console.error('Error fetching coupon metadata:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados complementares.' }, { status: 500 });
  }
}
