import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (format === 'csv') {
      const csvData = CouponService.generateReportsCsv();
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="relatorio-cupons-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const coupons = CouponService.getAllCoupons();
    const redemptions = CouponService.getAllRedemptions();
    const stats = CouponService.getDashboardStats();

    // Grouping by seller share
    let totalGrossEligible = 0;
    redemptions.forEach((r) => {
      totalGrossEligible += r.subtotal;
    });

    return NextResponse.json({
      stats,
      coupons,
      redemptions,
      summary: {
        totalRedemptions: redemptions.length,
        totalGrossEligible: Math.round(totalGrossEligible * 100) / 100,
        totalDiscountsGiven: stats.totalDiscountGiven,
        marketplaceCost: stats.marketplaceCost,
        sellerCost: stats.sellerCost,
        netSales: Math.round((totalGrossEligible - stats.totalDiscountGiven) * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Error fetching coupon reports:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatórios.' }, { status: 500 });
  }
}
