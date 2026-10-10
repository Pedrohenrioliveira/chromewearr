import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { id: 'global' }
    });

    return NextResponse.json({
      isLocked: settings?.isLocked || false,
      lockMessage: settings?.lockMessage || '',
    });
  } catch (error) {
    return NextResponse.json({ isLocked: false, lockMessage: '' });
  }
}
