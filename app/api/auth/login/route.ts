import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Preencha e-mail e senha' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 400 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ 
        error: 'Sua conta ainda não foi verificada. Re-registre-se para receber um novo código ou digite o código recebido.',
        requiresVerification: true,
        email: user.email
      }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Login efetuado com sucesso!',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao realizar login' },
      { status: 500 }
    );
  }
}
