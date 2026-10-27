import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { error } = await requireAdmin(req, ['ADMIN']);
    if (error) return error;
    const url = new URL(req.url);
    const roleParam = url.searchParams.get('role');
    const searchParam = url.searchParams.get('search')?.trim();

    const where: any = {};
    if (roleParam && roleParam !== 'ALL') {
      where.role = roleParam;
    }

    if (searchParam) {
      where.OR = [
        { name: { contains: searchParam } },
        { email: { contains: searchParam } },
        { phone: { contains: searchParam } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
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
            totalPrice: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const safeUsers = users.map((u) => ({
      ...u,
      ordersCount: u._count.orders,
    }));

    return NextResponse.json(safeUsers);
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { error } = await requireAdmin(req, ['ADMIN']);
    if (error) return error;
    const data = await req.json();
    const { name, email, phone, password, role, isVerified } = data;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return NextResponse.json({ error: 'Este e-mail já está em uso' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        password: hash,
        role: role || 'USER',
        isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
      },
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

    return NextResponse.json({ message: 'Usuário cadastrado com sucesso!', user });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { error } = await requireAdmin(req, ['ADMIN']);
    if (error) return error;
    const data = await req.json();
    const { id, name, email, phone, role, isVerified, password } = data;

    if (!id) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: 'O nome não pode ficar vazio' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        return NextResponse.json({ error: 'O e-mail não pode ficar vazio' }, { status: 400 });
      }

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

    // Se uma nova senha foi enviada, criptografa com bcrypt antes de salvar
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
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: 'Erro ao atualizar dados do usuário' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { error } = await requireAdmin(req, ['ADMIN']);
    if (error) return error;
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (targetUser.email === 'admin@chromewear.com') {
      return NextResponse.json({ error: 'O admin principal não pode ser excluído' }, { status: 400 });
    }

    // Desvincula pedidos e remove tokens antes de deletar o usuário para evitar violação de integridade referencial
    await prisma.order.updateMany({ where: { userId: id }, data: { userId: null } });
    await prisma.verificationToken.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso' });
  } catch (error: any) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ error: 'Erro ao deletar usuário' }, { status: 500 });
  }
}
