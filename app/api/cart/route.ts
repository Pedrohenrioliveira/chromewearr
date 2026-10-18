import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { cartData: true, updatedAt: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    let cart: any[] = [];
    if (user.cartData) {
      if (typeof user.cartData === 'string') {
        try {
          const parsed = JSON.parse(user.cartData);
          cart = Array.isArray(parsed) ? parsed : (parsed.items || []);
        } catch {
          cart = [];
        }
      } else if (Array.isArray(user.cartData)) {
        cart = user.cartData as any[];
      } else if (typeof user.cartData === 'object' && user.cartData !== null) {
        cart = (user.cartData as any).items || [];
      }
    }

    return NextResponse.json({ cart, updatedAt: user.updatedAt });
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

    // Ensure all items have addedAt
    let normalizedCart = cartData;
    if (Array.isArray(cartData)) {
      const nowIso = new Date().toISOString();
      normalizedCart = cartData.map(item => ({
        ...item,
        addedAt: item.addedAt || nowIso
      }));
    }

    await prisma.user.update({
      where: { email },
      data: {
        cartData: normalizedCart
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update cart error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar carrinho' }, { status: 500 });
  }
}

