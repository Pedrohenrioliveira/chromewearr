import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!product) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
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
        images: data.images ? JSON.stringify(data.images) : null,
        sizes: data.sizes || 'P,M,G,GG',
        sizeMatrix: data.sizeMatrix ? JSON.stringify(data.sizeMatrix) : null,
        inStock: data.inStock,
        isFeatured: data.isFeatured,
        status: data.status || 'ACTIVE',
        categoryId: data.categoryId,
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 });
  }
}
