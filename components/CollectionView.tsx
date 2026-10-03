import React from 'react';
import { Product } from '@/types';
import { ProductCard } from '@/components/ProductCard';
import { ProductGrid } from '@/components/ProductGrid';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface CollectionViewProps {
  collectionName: string;
  products: Product[];
  searchQuery?: string;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, size: string) => void;
}

export const CollectionView: React.FC<CollectionViewProps> = ({
  collectionName,
  products,
  searchQuery = '',
  onClose,
  onSelectProduct,
  onAddToCart,
}) => {
  const [activeCategory, setActiveCategory] = React.useState<string>('Todos');
  const [sortOption, setSortOption] = React.useState<string>('relevancia');

  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.categoryName || p.cat)))];

  let filteredProducts = products;
  if (activeCategory !== 'Todos') {
    filteredProducts = filteredProducts.filter((p) => (p.categoryName || p.cat) === activeCategory);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredProducts = filteredProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sub && p.sub.toLowerCase().includes(q)) ||
        (p.categoryName || p.cat || '').toLowerCase().includes(q)
    );
  }

  if (sortOption === 'menor-preco') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortOption === 'maior-preco') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  }

  return (
    <div className="w-full">
      <div className="w-full px-4 md:px-8 lg:px-12 py-3">
        <nav className="flex items-center gap-2 text-[11px] text-text-secondary uppercase">
          <button onClick={onClose} className="hover:text-primary transition-colors">Home</button>
          <span className="text-text-disabled">/</span>
          <span className="text-text-primary">Coleções</span>
          <span className="text-text-disabled">/</span>
          <span className="text-text-primary">{collectionName}</span>
        </nav>
      </div>

      <div className="w-full px-4 md:px-12 pt-2 pb-6 border-b border-border-hairline">
        <h1 className="font-display text-2xl md:text-4xl uppercase font-bold tracking-tight text-primary">
          {collectionName}
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {products.length} {products.length === 1 ? 'peça' : 'peças'} nesta coleção
        </p>
      </div>

      <div className="w-full px-4 md:px-12 py-4 flex flex-wrap items-center gap-3 border-b border-border-hairline">
        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="h-10 px-3 border border-border-hairline bg-surface-off text-[11px] uppercase tracking-wide text-text-primary focus:outline-none focus:border-primary"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'Todos' ? 'Filtrar: Todos' : cat}
            </option>
          ))}
        </select>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="h-10 px-3 border border-border-hairline bg-surface-off text-[11px] uppercase tracking-wide text-text-primary focus:outline-none focus:border-primary"
        >
          <option value="relevancia">Ordenar por: Relevância</option>
          <option value="menor-preco">Menor preço</option>
          <option value="maior-preco">Maior preço</option>
        </select>
        <span className="ml-auto text-[11px] text-text-secondary uppercase">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 border-l border-t border-border-hairline">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-text-secondary text-sm">
            Nenhum produto encontrado.
          </div>
        ) : (
          filteredProducts.map((p) => (
            <article
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="group relative flex flex-col border-r border-b border-border-hairline bg-surface-pure hover:bg-surface-off transition-colors duration-200 cursor-pointer"
            >
              <div className="block w-full overflow-hidden p-2.5 sm:p-6 lg:p-8">
                <div className="relative aspect-[4/5] w-full flex items-center justify-center">
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-contain object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
              </div>
              <div className="w-full px-3 py-3 sm:px-4 sm:py-4 mt-auto flex flex-row items-start justify-between gap-3 border-t border-border-hairline bg-transparent">
                <h2 className="text-[10px] sm:text-[12px] uppercase text-text-primary tracking-widest leading-snug font-medium text-left line-clamp-2">
                  {p.name}
                </h2>
                <span className="text-[11px] sm:text-[13px] font-bold text-text-primary whitespace-nowrap text-right">
                  {formatCurrency(p.price)}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
};
