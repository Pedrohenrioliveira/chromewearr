const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const categoriesData = [
  { name: 'Jaquetas', slug: 'jaquetas' },
  { name: 'Camisetas', slug: 'camisetas' },
  { name: 'Calças', slug: 'calcas' },
  { name: 'Acessórios', slug: 'acessorios' },
  { name: 'Calçados', slug: 'calcados' },
];

const productsData = [
  {
    name: 'Jaqueta Puffer Chrome Black',
    slug: 'jaqueta-puffer-chrome-black',
    description: 'Jaqueta Puffer impermeável de alta qualidade com acabamento acetinado e detalhes em cromo metálico. Isolamento térmico avançado.',
    price: 499.90,
    imageUrl: '/images/hero.webp',
    isFeatured: true,
    inStock: true,
    sizes: 'P,M,G,GG',
    categorySlug: 'jaquetas',
  },
  {
    name: 'Camiseta Oversized Heavy Metal',
    slug: 'camiseta-oversized-heavy-metal',
    description: 'Camiseta modelo oversized confeccionada em algodão fio 20.1 penteado 240g/m². Caimento impecável e estampa frontal em silk de alta densidade.',
    price: 189.90,
    imageUrl: '/images/hero.webp',
    isFeatured: true,
    inStock: true,
    sizes: 'P,M,G,GG',
    categorySlug: 'camisetas',
  },
  {
    name: 'Calça Cargo Tactical Chrome',
    slug: 'calca-cargo-tactical-chrome',
    description: 'Calça cargo tática com bolsos utilitários e fit ajustável nos tornozelos. Tecido ripstop resistente com secagem rápida.',
    price: 329.90,
    imageUrl: '/images/hero.webp',
    isFeatured: true,
    inStock: true,
    sizes: '38,40,42,44,46',
    categorySlug: 'calcas',
  },
  {
    name: 'Jaqueta Bomber Cyberpunk Silver',
    slug: 'jaqueta-bomber-cyberpunk-silver',
    description: 'Jaqueta estilo bomber futurista com forro contrastante em cetim e zíperes metálicos reforçados.',
    price: 549.90,
    imageUrl: '/images/hero.webp',
    isFeatured: true,
    inStock: true,
    sizes: 'P,M,G,GG',
    categorySlug: 'jaquetas',
  },
  {
    name: 'Moletom Heavyweight Dark Wash',
    slug: 'moletom-heavyweight-dark-wash',
    description: 'Moletom com capuz em algodão felpado 400g. Lavagem especial estilo vintage com acabamento desgastado premium.',
    price: 299.90,
    imageUrl: '/images/hero.webp',
    isFeatured: true,
    inStock: true,
    sizes: 'P,M,G,GG',
    categorySlug: 'camisetas',
  },
  {
    name: 'Calça Jeans Baggy Vintage',
    slug: 'calca-jeans-baggy-vintage',
    description: 'Calça jeans 100% algodão com modelagem baggy clássica dos anos 90. Lavagem estonada com detalhes destruídos.',
    price: 279.90,
    imageUrl: '/images/hero.webp',
    isFeatured: false,
    inStock: true,
    sizes: '38,40,42,44',
    categorySlug: 'calcas',
  },
  {
    name: 'Boné Snapback Chrome Logo',
    slug: 'bone-snapback-chrome-logo',
    description: 'Boné snapback aba reta com bordado frontal 3D e fecho regulável de alta resistência.',
    price: 119.90,
    imageUrl: '/images/hero.webp',
    isFeatured: true,
    inStock: true,
    sizes: 'Único',
    categorySlug: 'acessorios',
  },
  {
    name: 'Corrente Chrome Silver Plated',
    slug: 'corrente-chrome-silver-plated',
    description: 'Colar de corrente elo cubano banhado a prata 925 com pingente exclusivo ChromeWear.',
    price: 159.90,
    imageUrl: '/images/hero.webp',
    isFeatured: false,
    inStock: true,
    sizes: 'Único',
    categorySlug: 'acessorios',
  },
  {
    name: 'Tênis Chrome Street High-Top',
    slug: 'tenis-chrome-street-high-top',
    description: 'Tênis cano alto em couro legítimo com solado de borracha vulcanizada e detalhes em metal anodizado.',
    price: 699.90,
    imageUrl: '/images/hero.webp',
    isFeatured: true,
    inStock: true,
    sizes: '38,39,40,41,42,43',
    categorySlug: 'calcados',
  },
];

async function main() {
  console.log('Iniciando seed do banco de dados ChromeWear...');

  // 1. Criar Usuário Admin / Teste
  const hashedPassword = await bcrypt.hash('123456', 10);
  const user = await prisma.user.upsert({
    where: { email: 'cliente@chromewear.com' },
    update: {},
    create: {
      name: 'Cliente ChromeWear',
      email: 'cliente@chromewear.com',
      password: hashedPassword,
    },
  });
  console.log('Usuário criado:', user.email);

  // 2. Criar Categorias
  const categoriesMap = {};
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { name: cat.name, slug: cat.slug },
    });
    categoriesMap[cat.slug] = createdCat.id;
  }
  console.log('Categorias criadas com sucesso.');

  // 3. Criar Produtos
  for (const prod of productsData) {
    const { categorySlug, ...prodData } = prod;
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        ...prodData,
        categoryId: categoriesMap[categorySlug],
      },
      create: {
        ...prodData,
        categoryId: categoriesMap[categorySlug],
      },
    });
  }
  console.log('Produtos criados com sucesso.');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
