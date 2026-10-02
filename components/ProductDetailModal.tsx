'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  if (!product) return null;

  const activeSize = selectedSize || product.sizes[0] || 'M';

  const handleAdd = () => {
    onAddToCart(product, activeSize, quantity);
    onClose();
    setQuantity(1);
  };

  return (
    <Modal isOpen={Boolean(product)} onClose={onClose} maxWidth="max-w-[700px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Image */}
        <div className="relative aspect-[3/4] w-full bg-surface-off border border-border-hairline overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col justify-between">
          <div>
            {product.categoryName && (
              <span className="text-[10px] uppercase tracking-widest text-text-secondary font-medium block mb-1">
                {product.categoryName}
              </span>
            )}
            <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide text-text-primary mb-2">
              {product.name}
            </h2>
            <p className="text-lg font-extrabold text-primary mb-4">
              {formatCurrency(product.price)}
            </p>

            <p className="text-xs md:text-sm text-text-secondary leading-relaxed mb-6 font-light">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mb-6">
              <span className="text-xs uppercase font-semibold text-text-primary block mb-2">
                Tamanho:
              </span>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-9 px-3 text-xs uppercase font-semibold border transition-colors ${
                      activeSize === size
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-border-hairline bg-surface-pure text-text-primary hover:border-primary'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <span className="text-xs uppercase font-semibold text-text-primary block mb-2">
                Quantidade:
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 border border-border-hairline text-xs font-bold flex items-center justify-center hover:bg-surface-off transition-colors"
                >
                  -
                </button>
                <span className="text-sm font-semibold px-2">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 border border-border-hairline text-xs font-bold flex items-center justify-center hover:bg-surface-off transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Add to Cart Action */}
          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className="w-full h-12 bg-secondary hover:bg-primary text-on-primary text-xs md:text-sm uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Adicionar à Sacola
          </button>
        </div>
      </div>
    </Modal>
  );
};
