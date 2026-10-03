import React from 'react';
import Image from 'next/image';
import { Product, Category } from '@/types';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  activeCategory: string | null;
  searchQuery: string;
  onSelectCategory: (slug: string | null) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  activeCategory,
  searchQuery,
  onSelectCategory,
  onSelectProduct,
}) => {
  return (
    <>
      <style>{`
        @keyframes auto-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
        .animate-auto-scroll {
          animation: auto-scroll 30s linear infinite;
        }
        .animate-auto-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Categories nav removed to see how it looks without it */}

      {searchQuery && (
        <div className="w-full px-4 md:px-12 py-4 bg-surface-off border-b border-border-hairline">
          <p className="text-sm text-text-secondary">
            Resultados para a busca "<span className="text-text-primary font-semibold">{searchQuery}</span>"
          </p>
        </div>
      )}

      <section className="w-full bg-surface-pure overflow-hidden">
        <div
          className="flex overflow-visible border-t border-b border-border-hairline animate-auto-scroll w-max"
          id="product-grid"
        >
          {products.length === 0 ? (
            <div className="w-[100vw] py-32 flex flex-col items-center justify-center bg-surface-pure border-r-0">
              <span className="font-display text-2xl uppercase tracking-widest text-primary">Em breve...</span>
            </div>
          ) : (
            [...products, ...products, ...products].map((product, index) => (
              <article
                key={`${product.id}-${index}`}
                className="group relative flex flex-col border-r border-border-hairline bg-surface-pure hover:bg-surface-off transition-colors duration-200 flex-none w-[50vw] sm:w-[40vw] md:w-[33.333vw] lg:w-[25vw]"
                onClick={() => onSelectProduct(product)}
              >
                <div className="block w-full overflow-hidden p-2.5 sm:p-6 lg:p-8 cursor-pointer">
                  <div className="relative aspect-[4/5] w-full flex items-center justify-center">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="w-full px-3 py-3 sm:px-4 sm:py-4 flex-1 flex flex-row items-start justify-between gap-3 border-t border-border-hairline bg-transparent cursor-pointer">
                  <h2 className="text-[10px] sm:text-[12px] uppercase text-text-primary tracking-widest leading-snug font-medium text-left line-clamp-2">
                    {product.name}
                  </h2>
                  <span className="text-[11px] sm:text-[13px] font-bold text-text-primary whitespace-nowrap text-right">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
};
