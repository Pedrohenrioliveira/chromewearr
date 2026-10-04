import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const banner = await prisma.banner.findFirst();
    return NextResponse.json(banner || {});
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar banner' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const banner = await prisma.banner.findFirst();
    
    if (banner) {
      const updated = await prisma.banner.update({
        where: { id: banner.id },
        data: {
          title: data.title,
          subtitle: data.subtitle,
          quote: data.quote,
          buttonText: data.buttonText,
          buttonLink: data.buttonLink,
          imageUrl: data.imageUrl,
          isActive: data.isActive
        }
      });
      return NextResponse.json(updated);
    } else {
      const created = await prisma.banner.create({
        data: {
          title: data.title || '',
          subtitle: data.subtitle,
          quote: data.quote,
          buttonText: data.buttonText,
          buttonLink: data.buttonLink,
          imageUrl: data.imageUrl || '',
          isActive: data.isActive ?? true
        }
      });
      return NextResponse.json(created);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar banner' }, { status: 500 });
  }
}
