import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { id: 'global' }
    });
    return NextResponse.json(settings || { isLocked: false, accessCode: '' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { isLocked, accessCode } = await req.json();
    const settings = await prisma.siteSetting.upsert({
      where: { id: 'global' },
      update: { isLocked, accessCode },
      create: { id: 'global', isLocked, accessCode }
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
