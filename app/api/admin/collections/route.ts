import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } }
    });
    return NextResponse.json(collections);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar coleções' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    if (!data.name || !data.slug) {
      return NextResponse.json({ error: 'Nome e slug são obrigatórios' }, { status: 400 });
    }
    
    const exists = await prisma.collection.findUnique({ where: { slug: data.slug } });
    if (exists) {
      return NextResponse.json({ error: 'Slug já existe' }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        name: data.name,
        slug: data.slug,
      }
    });
    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar coleção' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    if (!data.id || !data.name || !data.slug) {
      return NextResponse.json({ error: 'ID, nome e slug são obrigatórios' }, { status: 400 });
    }

    const collection = await prisma.collection.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
      }
    });
    return NextResponse.json(collection);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar coleção' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    const col = await prisma.collection.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } }
    });

    if (col?._count?.products && col._count.products > 0) {
      return NextResponse.json({ error: 'Não é possível excluir uma coleção que possui produtos.' }, { status: 400 });
    }

    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao deletar coleção' }, { status: 500 });
  }
}
