import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { verificationTokens: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário ou código inválido' }, { status: 400 });
    }

    // Find a valid token for this user
    const validToken = await prisma.verificationToken.findFirst({
      where: {
        userId: user.id,
        code: code,
        expiresAt: {
          gt: new Date(), // must be strictly in the future
        },
      },
    });

    if (!validToken) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and delete the token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { id: validToken.id },
      }),
    ]);

    return NextResponse.json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Erro ao redefinir a senha' },
      { status: 500 }
    );
  }
}
