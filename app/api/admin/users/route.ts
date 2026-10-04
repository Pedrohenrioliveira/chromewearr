import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'VENDOR'] } },
      orderBy: { createdAt: 'desc' }
    });
    // Remove passwords before sending to frontend
    const safeUsers = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });
    return NextResponse.json(safeUsers);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.name || !data.email || !data.password || !data.role) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return NextResponse.json({ error: 'E-mail já está em uso' }, { status: 400 });
    }

    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        role: data.role,
        isVerified: true
      }
    });

    return NextResponse.json({ message: 'Usuário criado' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.email === 'admin@chromewear.com') {
      return NextResponse.json({ error: 'O admin principal não pode ser excluído' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 });
  }
}
