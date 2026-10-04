'use client';

import React, { useEffect, useState } from 'react';
import { ProductForm } from '@/components/admin/ProductForm';
import Link from 'next/link';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Unwrap params in Next 15+ if needed, but since it's client component we might have to use React.use()
    // For now we assume params.id is available directly or we unwrap it
    const resolveParams = async () => {
      const { id } = await params;
      fetch(`/api/admin/products/${id}`)
        .then(res => res.json())
        .then(data => {
          setProduct(data);
          setLoading(false);
        });
    };
    resolveParams();
  }, [params]);

  if (loading) return <div className="p-8">Carregando produto...</div>;
  if (!product || product.error) return <div className="p-8">Produto não encontrado.</div>;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <Link href="/admin/products" className="text-[10px] text-text-secondary uppercase tracking-widest font-bold hover:text-primary transition-colors">
          &larr; Voltar para Produtos
        </Link>
        <h1 className="font-display uppercase tracking-widest text-2xl font-bold mt-4">Editar Produto: {product.name}</h1>
      </div>
      
      <ProductForm initialData={product} />
    </div>
  );
}
