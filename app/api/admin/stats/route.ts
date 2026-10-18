import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();
    const totalUsersCount = await prisma.user.count();
    const staffCount = await prisma.user.count({
      where: { role: { in: ['ADMIN', 'VENDOR'] } }
    });
    const customersCount = await prisma.user.count({
      where: { role: 'USER' }
    });

    return NextResponse.json({
      products: productsCount,
      categories: categoriesCount,
      users: staffCount,
      totalUsers: totalUsersCount,
      customers: customersCount,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
}

