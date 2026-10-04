import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: { where: { status: 'ACTIVE' } } } } },
      orderBy: { name: 'asc' },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
