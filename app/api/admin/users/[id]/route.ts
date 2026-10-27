import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin(req, ['ADMIN']);
    if (error) return error;
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        cartData: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            totalPrice: true,
            status: true,
            items: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ error: 'Erro ao buscar dados do usuário' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error } = await requireAdmin(req, ['ADMIN']);
    if (error) return error;
    const { id } = await params;
    const data = await req.json();
    const { name, email, phone, role, isVerified, password } = data;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Nome não pode ser vazio' }, { status: 400 });
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) return NextResponse.json({ error: 'E-mail não pode ser vazio' }, { status: 400 });

      if (cleanEmail !== targetUser.email) {
        const existing = await prisma.user.findFirst({
          where: { email: cleanEmail, NOT: { id } },
        });
        if (existing) {
          return NextResponse.json({ error: 'Este e-mail já está em uso por outro usuário' }, { status: 400 });
        }
        updateData.email = cleanEmail;
      }
    }

    if (phone !== undefined) {
      updateData.phone = phone ? phone.trim() : null;
    }

    if (role !== undefined) {
      if (targetUser.email === 'admin@chromewear.com' && role !== 'ADMIN') {
        return NextResponse.json({ error: 'O cargo do administrador principal não pode ser alterado' }, { status: 400 });
      }
      updateData.role = role;
    }

    if (isVerified !== undefined) {
      updateData.isVerified = Boolean(isVerified);
    }

    // Se uma nova senha foi preenchida, criptografa com bcrypt
    if (password && password.trim()) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'A nova senha deve ter no mínimo 6 caracteres' }, { status: 400 });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Dados do usuário atualizados com sucesso!',
      user: updatedUser,
      passwordChanged: Boolean(password && password.trim()),
    });
  } catch (error: any) {
    console.error('Error updating user [id]:', error);
    return NextResponse.json({ error: 'Erro ao atualizar dados do usuário' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (targetUser.email === 'admin@chromewear.com') {
      return NextResponse.json({ error: 'O admin principal não pode ser excluído' }, { status: 400 });
    }

    await prisma.order.updateMany({ where: { userId: id }, data: { userId: null } });
    await prisma.verificationToken.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (error: any) {
    console.error('Error deleting user [id]:', error);
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
  }
}
