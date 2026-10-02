import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase();
  const featured = searchParams.get('featured') === 'true';

  try {
    const where: any = {};
    if (categoryParam) {
      if (categoryParam !== 'Todos') {
        where.OR = [
          { category: { slug: categoryParam } },
          { category: { name: categoryParam } },
        ];
      }
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (featured) {
      where.isFeatured = true;
    }

    const dbProducts = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (dbProducts && dbProducts.length > 0) {
      const formatted = dbProducts.map((p, idx) => ({
        ...p,
        numId: idx,
        ref: `0${idx + 1}/25`,
        cat: p.category.name,
        collection: 'Sanctum',
        sub: 'Algodão 240g/m² Oversized',
        about: p.description,
        composition: '100% Algodão, malha 240g/m².',
        img: p.imageUrl,
        sizes: p.sizes ? p.sizes.split(',') : ['M', 'G', 'GG'],
        sizeMatrix: [
          { s: 'M', q: 5 },
          { s: 'G', q: 5 },
          { s: 'GG', q: 5 },
        ],
        categoryName: p.category.name,
      }));
      return NextResponse.json(formatted);
    }
  } catch (error) {
    // Fallback to static products from archive-lab.html
  }

  let filtered = [...INITIAL_PRODUCTS];

  if (categoryParam && categoryParam !== 'Todos') {
    filtered = filtered.filter(
      (p) =>
        p.cat.toLowerCase() === categoryParam.toLowerCase() ||
        p.categoryName?.toLowerCase() === categoryParam.toLowerCase()
    );
  }
  if (search) {
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sub.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
    );
  }
  if (featured) {
    filtered = filtered.filter((p) => p.isFeatured);
  }

  return NextResponse.json(filtered);
}
