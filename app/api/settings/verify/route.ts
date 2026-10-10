import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const settings = await prisma.siteSetting.findUnique({
      where: { id: 'global' }
    });

    if (settings?.isLocked && settings.accessCode === code) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Código inválido' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro no servidor' }, { status: 500 });
  }
}
