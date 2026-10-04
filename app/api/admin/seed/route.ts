import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/data';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Create default admin if not exists
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@chromewear.com' } });
    if (!existingAdmin) {
      const hash = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@chromewear.com',
          password: hash,
          role: 'ADMIN',
          isVerified: true
        }
      });
    }

    // 2. Create Categories
    for (const cat of INITIAL_CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: { name: cat.name },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
        }
      });
    }

    // 3. Create Default Collection
    const sanctumCol = await prisma.collection.upsert({
      where: { slug: 'sanctum' },
      update: { name: 'Sanctum' },
      create: { name: 'Sanctum', slug: 'sanctum' }
    });

    // 4. Create Products
    for (const prod of INITIAL_PRODUCTS) {
      await prisma.product.upsert({
        where: { slug: prod.slug },
        update: {
          name: prod.name,
          price: prod.price,
          description: prod.description || '',
          about: prod.about || '',
          composition: prod.composition || '',
          imageUrl: prod.imageUrl,
          categoryId: prod.categoryId || 'cat-1',
          sizes: prod.sizes?.join(',') || 'P,M,G,GG',
          sizeMatrix: prod.sizeMatrix ? JSON.stringify(prod.sizeMatrix) : undefined,
          inStock: prod.inStock !== false,
          isFeatured: prod.isFeatured === true,
          status: 'ACTIVE',
          ref: prod.ref,
          collectionId: prod.collection === 'Sanctum' ? sanctumCol.id : null,
          sub: prod.sub,
        },
        create: {
          numId: prod.numId,
          name: prod.name,
          slug: prod.slug,
          price: prod.price,
          description: prod.description || '',
          about: prod.about || '',
          composition: prod.composition || '',
          imageUrl: prod.imageUrl,
          categoryId: prod.categoryId || 'cat-1',
          sizes: prod.sizes?.join(',') || 'P,M,G,GG',
          sizeMatrix: prod.sizeMatrix ? JSON.stringify(prod.sizeMatrix) : undefined,
          inStock: prod.inStock !== false,
          isFeatured: prod.isFeatured === true,
          status: 'ACTIVE',
          ref: prod.ref,
          collectionId: prod.collection === 'Sanctum' ? sanctumCol.id : null,
          sub: prod.sub,
        }
      });
    }

    // 5. Create initial Banner
    const existingBanner = await prisma.banner.findFirst();
    if (!existingBanner) {
      await prisma.banner.create({
        data: {
          title: 'SANCTUM',
          quote: 'Disseram no seu coração: \'Destruamos tudo!\'\n e incendiaram neste país todos os lugares de culto',
          imageUrl: '/images/hero-main.webp',
          isActive: true
        }
      });
    }

    return NextResponse.json({ message: 'Seed success!' });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
