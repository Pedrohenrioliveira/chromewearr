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
  const [isHovered, setIsHovered] = React.useState(false);
  const [isTouching, setIsTouching] = React.useState(false);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || products.length === 0) return;

    let animationId: number;
    const scrollSpeed = 1;

    const handleScroll = () => {
      const segmentWidth = el.scrollWidth / 3;
      if (el.scrollLeft >= segmentWidth * 2) {
        el.scrollLeft -= segmentWidth;
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft += segmentWidth;
      }
    };

    const loop = () => {
      if (!isHovered && !isTouching) {
        el.scrollLeft += scrollSpeed;
      }
      animationId = requestAnimationFrame(loop);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    animationId = requestAnimationFrame(loop);

    return () => {
      el.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationId);
    };
  }, [isHovered, isTouching, products.length]);

  // Mouse drag
  const isDown = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeftRef = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    setIsTouching(true);
    if (scrollRef.current) {
      startX.current = e.pageX - scrollRef.current.offsetLeft;
      scrollLeftRef.current = scrollRef.current.scrollLeft;
    }
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    setIsHovered(false);
    setIsTouching(false);
  };

  const handleMouseUp = () => {
    isDown.current = false;
    setIsTouching(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  return (
    <>
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
          className="flex overflow-x-auto no-scrollbar border-t border-b border-border-hairline cursor-grab active:cursor-grabbing"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsTouching(true)}
          onTouchEnd={() => setIsTouching(false)}
          style={{ WebkitOverflowScrolling: 'touch' }}
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
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
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
