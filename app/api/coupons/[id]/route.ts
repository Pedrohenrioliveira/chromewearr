import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const coupon = CouponService.getCouponById(id);
    if (!coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado.' }, { status: 404 });
    }

    const redemptions = CouponService.getAllRedemptions().filter((r) => r.couponId === id);
    const auditLogs = CouponService.getAllAuditLogs().filter((l) => l.couponId === id);

    return NextResponse.json({
      coupon,
      redemptions,
      auditLogs,
    });
  } catch (error: any) {
    console.error('Error fetching coupon details:', error);
    return NextResponse.json({ error: 'Erro ao buscar detalhes do cupom.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const adminName = body.adminName || 'Administrador';

    const result = CouponService.updateCoupon(id, body, adminName);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.coupon);
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cupom.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');

    if (mode === 'archive') {
      const result = CouponService.archiveCoupon(id);
      if (!result.success) {
        return NextResponse.json({ error: result.error || 'Erro ao arquivar cupom.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Cupom arquivado com sucesso.' });
    }

    // 100% Hard Delete - Permanently removes the coupon and cleans up all its history
    const result = CouponService.deleteCouponPermanently(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Erro ao excluir cupom.' }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: 'Cupom excluído 100% com sucesso.' });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: 'Erro ao excluir cupom.' }, { status: 500 });
  }
}
