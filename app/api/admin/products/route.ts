import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Convert status bools
    const inStock = data.inStock ?? true;
    const isFeatured = data.isFeatured ?? false;
    
    const product = await prisma.product.create({
      data: {
        numId: Date.now() % 2000000000,
        name: data.name,
        slug: data.slug,
        ref: data.ref,
        collectionId: data.collectionId || null,
        sub: data.sub,
        description: data.description || '',
        about: data.about || '',
        composition: data.composition || '',
        price: parseFloat(data.price),
        imageUrl: data.imageUrl || '',
        images: data.images || undefined,
        sizes: data.sizes || 'P,M,G,GG',
        sizeMatrix: data.sizeMatrix || undefined,
        inStock,
        isFeatured,
        status: data.status || 'ACTIVE',
        categoryId: data.categoryId,
      }
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}
