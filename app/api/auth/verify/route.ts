import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'E-mail e código são obrigatórios.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: 'Conta já verificada!', user: { id: user.id, name: user.name, email: user.email } });
    }

    // Find token
    const token = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        code: code,
        expiresAt: {
          gt: new Date() // Token must not be expired
        }
      }
    });

    if (!token) {
      return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 400 });
    }

    // Verify user
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true }
    });

    // Delete token
    await prisma.verificationToken.delete({
      where: { id: token.id }
    });

    return NextResponse.json({
      message: 'Conta verificada com sucesso!',
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: `Erro ao verificar conta: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
