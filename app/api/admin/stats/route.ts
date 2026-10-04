import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const productsCount = await prisma.product.count();
    const categoriesCount = await prisma.category.count();
    const usersCount = await prisma.user.count({
      where: { role: { in: ['ADMIN', 'VENDOR'] } }
    });

    return NextResponse.json({
      products: productsCount,
      categories: categoriesCount,
      users: usersCount,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 });
  }
}
