import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.name || !data.slug) {
      return NextResponse.json({ error: 'Nome e slug são obrigatórios' }, { status: 400 });
    }
    
    const exists = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (exists) {
      return NextResponse.json({ error: 'Slug já existe' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
      }
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    if (!data.id || !data.name || !data.slug) {
      return NextResponse.json({ error: 'ID, nome e slug são obrigatórios' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
      }
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    // Check if there are products
    const cat = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } }
    });

    if (cat?._count?.products && cat._count.products > 0) {
      return NextResponse.json({ error: 'Não é possível excluir uma categoria que possui produtos.' }, { status: 400 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar categoria' }, { status: 500 });
  }
}
