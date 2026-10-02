'use client';

import React from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product, size: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onAddToCart,
}) => {
  const defaultSize = product.sizes[0] || 'M';

  return (
    <div className="group relative bg-surface-pure flex flex-col justify-between border border-border-hairline hover:shadow-lg transition-all duration-200">
      {/* Product Image */}
      <div
        onClick={() => onSelect(product)}
        className="relative w-full aspect-[3/4] bg-surface-off overflow-hidden cursor-pointer"
      >
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Badges */}
        {product.isFeatured && (
          <span className="absolute top-2 left-2 bg-primary text-on-primary text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 z-10">
            Destaque
          </span>
        )}
        {!product.inStock && (
          <span className="absolute top-2 right-2 bg-status-soldout text-text-primary text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 z-10">
            Esgotado
          </span>
        )}
      </div>

      {/* Product Information */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {product.categoryName && (
            <span className="text-[10px] uppercase tracking-widest text-text-secondary font-medium block mb-1">
              {product.categoryName}
            </span>
          )}
          <h3
            onClick={() => onSelect(product)}
            className="text-xs md:text-sm uppercase tracking-wide font-semibold text-text-primary group-hover:text-secondary transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </h3>
          <p className="text-xs text-text-secondary line-clamp-2 mt-1 font-light">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-border-hairline flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          <button
            onClick={() => onAddToCart(product, defaultSize)}
            disabled={!product.inStock}
            className="h-8 px-3 bg-secondary hover:bg-primary text-on-primary text-[11px] uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};
