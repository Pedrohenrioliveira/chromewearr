import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { cartData: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    let cart: any = [];
    if (user.cartData) {
      if (typeof user.cartData === 'string') {
         try {
           cart = JSON.parse(user.cartData);
         } catch(e) {
           cart = [];
         }
      } else {
         cart = user.cartData as any;
      }
    }

    return NextResponse.json({ cart });
  } catch (error: any) {
    console.error('Fetch cart error:', error);
    return NextResponse.json({ error: 'Erro ao buscar carrinho' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { email, cartData } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        cartData: cartData // Prisma converts JSON automatically
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update cart error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar carrinho' }, { status: 500 });
  }
}
