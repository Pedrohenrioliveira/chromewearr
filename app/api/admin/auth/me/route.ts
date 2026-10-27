import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = await getAdminFromRequest(req);

    if (!payload) {
      const res = NextResponse.json(
        { authenticated: false, error: 'Sessão inválida ou expirada.' },
        { status: 401 }
      );
      res.cookies.delete('chromewear_admin_token');
      return res;
    }

    // Double check with database to guarantee user wasn't deleted or demoted
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'VENDOR')) {
      const res = NextResponse.json(
        { authenticated: false, error: 'Usuário não possui privilégios administrativos no banco de dados.' },
        { status: 401 }
      );
      res.cookies.delete('chromewear_admin_token');
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Error validating admin session:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Erro ao validar autenticação administrativa.' },
      { status: 500 }
    );
  }
}
