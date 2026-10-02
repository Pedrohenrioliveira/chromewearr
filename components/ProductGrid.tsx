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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let animationFrameId: number;
    let scrollPos = el.scrollLeft;
    let isPaused = false;

    const scroll = () => {
      if (!isPaused) {
        scrollPos += 0.5; // adjust speed here
        if (scrollPos >= el.scrollWidth - el.clientWidth) {
          scrollPos = 0; // restart
        }
        el.scrollLeft = scrollPos;
      } else {
        scrollPos = el.scrollLeft; // Sync pos if user scrolls manually
      }
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    const pause = () => { isPaused = true; };
    const resume = () => { isPaused = false; };

    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);
    el.addEventListener('touchstart', pause);
    el.addEventListener('touchend', resume);

    return () => {
      cancelAnimationFrame(animationFrameId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
      el.removeEventListener('touchstart', pause);
      el.removeEventListener('touchend', resume);
    };
  }, [products]);

  return (
    <>
      <nav id="catalogo" className="w-full bg-surface-pure border-b border-border-hairline sticky top-16 z-40">
        <div className="w-full px-4 md:px-12 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar" id="category-filters">
            <button
              onClick={() => onSelectCategory(null)}
              className={`text-[11px] uppercase tracking-wide whitespace-nowrap transition-colors ${
                activeCategory === null
                  ? 'text-primary'
                  : 'text-text-secondary hover:text-primary'
              }`}
            >
              TODOS OS ARTIGOS
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                className={`text-[11px] uppercase tracking-wide whitespace-nowrap transition-colors ${
                  activeCategory === cat.slug
                    ? 'text-primary'
                    : 'text-text-secondary hover:text-primary'
                }`}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-text-secondary uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-status-active"></span>
            <span>Estoque atualizado em tempo real</span>
          </div>
        </div>
      </nav>

      {searchQuery && (
        <div className="w-full px-4 md:px-12 py-4 bg-surface-off border-b border-border-hairline">
          <p className="text-sm text-text-secondary">
            Resultados para a busca "<span className="text-text-primary font-semibold">{searchQuery}</span>"
          </p>
        </div>
      )}

      <section className="w-full bg-surface-pure overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto no-scrollbar border-t border-b border-border-hairline" 
          id="product-grid"
        >
          {products.length === 0 ? (
            <div className="w-full py-16 text-center text-text-secondary text-sm bg-surface-pure">
              Nenhum produto encontrado.
            </div>
          ) : (
            [...products, ...products, ...products].map((product, index) => (
              <article
                key={`${product.id}-${index}`}
                className="group relative flex flex-col border-r border-border-hairline bg-surface-pure hover:bg-surface-off transition-colors duration-200 flex-none w-[80vw] sm:w-[50vw] md:w-[33.333vw] lg:w-[25vw]"
                onClick={() => onSelectProduct(product)}
              >
                <div className="block w-full overflow-hidden p-2.5 sm:p-6 lg:p-8">
                  <div className="relative aspect-[4/5] w-full flex items-center justify-center">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                </div>
                <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-4 pt-0 mt-auto flex flex-col gap-0.5">
                  <h2 className="font-display text-[11px] sm:text-sm uppercase text-text-primary tracking-tight leading-tight">
                    {product.name}
                  </h2>
                  <span className="text-xs sm:text-sm font-semibold text-text-primary tracking-tight">
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
