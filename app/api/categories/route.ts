import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '@/lib/data';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });

    if (categories && categories.length > 0) {
      const formatted = categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c._count.products,
      }));
      return NextResponse.json(formatted);
    }
  } catch (error) {
    // fallback
  }

  const withCounts = INITIAL_CATEGORIES.map((cat) => ({
    ...cat,
    productCount: INITIAL_PRODUCTS.filter((p) => p.cat === cat.name).length,
  }));

  return NextResponse.json(withCounts);
}
