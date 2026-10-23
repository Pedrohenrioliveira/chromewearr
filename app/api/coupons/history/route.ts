import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupon-service';

export async function GET() {
  try {
    const logs = CouponService.getAllAuditLogs();
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Error fetching coupon history logs:', error);
    return NextResponse.json({ error: 'Erro ao buscar histórico de cupons.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all');

    if (all === 'true') {
      CouponService.clearAllAuditLogs();
      return NextResponse.json({ success: true, message: 'Histórico limpo com sucesso.' });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do log é obrigatório.' }, { status: 400 });
    }

    CouponService.deleteAuditLog(id);
    return NextResponse.json({ success: true, message: 'Item do histórico excluído com sucesso.' });
  } catch (error: any) {
    console.error('Error deleting audit log:', error);
    return NextResponse.json({ error: 'Erro ao excluir log.' }, { status: 500 });
  }
}
