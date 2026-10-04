'use client';

import React from 'react';
import { ProductForm } from '@/components/admin/ProductForm';
import Link from 'next/link';

export default function NewProductPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <div className="mb-8">
        <Link href="/admin/products" className="text-[10px] text-text-secondary uppercase tracking-widest font-bold hover:text-primary transition-colors">
          &larr; Voltar para Produtos
        </Link>
        <h1 className="font-display uppercase tracking-widest text-2xl font-bold mt-4">Novo Produto</h1>
      </div>
      
      <ProductForm />
    </div>
  );
}
