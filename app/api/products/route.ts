import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INITIAL_PRODUCTS } from '@/lib/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase();
  const featured = searchParams.get('featured') === 'true';

  try {
    const where: any = { status: 'ACTIVE' }; // Only fetch active products

    if (categoryParam && categoryParam !== 'Todos') {
      where.OR = [
        { category: { slug: categoryParam } },
        { category: { name: categoryParam } },
      ];
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
        collection: {
          select: { name: true, slug: true },
        }
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' }
      ],
    });

    const formatted = dbProducts.map((p) => {
      let sizeMatrixParsed = [];
      try {
        sizeMatrixParsed = p.sizeMatrix ? JSON.parse(p.sizeMatrix as string) : [];
      } catch (e) {}

      return {
        ...p,
        cat: p.category?.name || '',
        img: p.imageUrl,
        sizes: p.sizes ? p.sizes.split(',') : ['M', 'G', 'GG'],
        sizeMatrix: sizeMatrixParsed,
        categoryName: p.category?.name || '',
        collection: p.collection?.name || null,
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
