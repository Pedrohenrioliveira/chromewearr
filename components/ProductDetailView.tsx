import React, { useState } from 'react';
import Image from 'next/image';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductDetailViewProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, quantity: number) => void;
  onOpenTab?: (tab: string) => void;
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'sobre' | 'composicao' | 'medidas' | 'lavagem'>('sobre');
  const [shippingResult, setShippingResult] = useState<boolean>(false);

  const handleQtyChange = (delta: number) => {
    const next = quantity + delta;
    if (next >= 1) {
      setQuantity(next);
    }
  };

  const handleAdd = () => {
    if (!selectedSize) {
      alert('Selecione um tamanho primeiro.');
      return;
    }
    onAddToCart(product, selectedSize, quantity);
  };

  const calculateShipping = () => {
    setShippingResult(true);
  };

  // Find the selected size stock
  const sizeStock = product.sizeMatrix?.find((s) => s.s === selectedSize);
  const stockInfo = sizeStock ? sizeStock.q : 0;
  let stockMessage = 'Selecione um tamanho';
  if (selectedSize) {
    if (stockInfo === 0) stockMessage = 'Esgotado';
    else if (stockInfo < 3) stockMessage = `Últimas ${stockInfo} unidades disponíveis`;
    else stockMessage = 'Disponível';
  }

  return (
    <div className="w-full">
      <div className="w-full px-4 md:px-8 lg:px-12 py-3">
        <nav className="flex items-center gap-2 text-[11px] text-text-secondary uppercase">
          <button onClick={onClose} className="hover:text-primary transition-colors">Home</button>
          <span className="text-text-disabled">/</span>
          <span>{product.categoryName || product.cat}</span>
          <span className="text-text-disabled">/</span>
          <span className="text-text-primary">{product.name}</span>
        </nav>
      </div>

      <div className="w-full px-4 md:px-8 lg:px-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row-reverse gap-3 items-center md:items-start">
            <div className="relative w-full aspect-[4/5] bg-surface-off flex items-center justify-center overflow-hidden border border-border-hairline group">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 text-[10px] uppercase text-text-secondary bg-surface-pure/90 px-2 py-1 tracking-widest border border-border-hairline">
                SÉRIE EXP. 024 // BR
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col pt-1">
            <div className="space-y-1 pb-6">
              <h1 className="font-display text-2xl md:text-4xl uppercase font-bold tracking-tight text-primary">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-xl font-medium text-text-primary">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-[11px] text-text-secondary uppercase">
                  ou {formatCurrency(product.price * 0.95)} no PIX <br />
                  ou 6x de {formatCurrency(product.price / 6)} s/ juros
                </span>
              </div>
            </div>

            <div className="space-y-3 pb-6 border-t border-border-hairline pt-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wide text-text-secondary">Selecione o Tamanho</span>
                <button
                  onClick={() => setActiveTab('medidas')}
                  className="text-[11px] underline text-text-secondary hover:text-primary transition-colors uppercase"
                >
                  Tabela de Medidas
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {product.sizeMatrix?.map((sz) => {
                  const outOfStock = sz.q === 0;
                  const isSelected = selectedSize === sz.s;
                  return (
                    <button
                      key={sz.s}
                      disabled={outOfStock}
                      onClick={() => setSelectedSize(sz.s)}
                      className={`relative h-11 border text-sm font-semibold transition-colors flex items-center justify-center
                        ${
                          outOfStock
                            ? 'border-border-hairline text-text-disabled cursor-not-allowed overflow-hidden'
                            : isSelected
                            ? 'bg-secondary text-on-primary border-secondary'
                            : 'border-border-hairline text-text-primary hover:border-primary'
                        }
                      `}
                    >
                      {sz.s}
                      {outOfStock && (
                        <div className="absolute inset-0 w-full h-full">
                          <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1"></line>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] uppercase text-text-secondary flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${stockInfo > 0 ? 'bg-status-active animate-pulse' : 'bg-status-soldout'}`}></span>
                  <span>{stockMessage}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 pb-8">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-between w-28 h-12 border border-border-hairline bg-surface-off px-2 select-none flex-shrink-0">
                  <button className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-primary text-lg font-bold" onClick={() => handleQtyChange(-1)}>
                    −
                  </button>
                  <span className="font-semibold text-primary">{quantity}</span>
                  <button className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-primary text-lg font-bold" onClick={() => handleQtyChange(1)}>
                    +
                  </button>
                </div>
                <button
                  className="flex-1 h-12 bg-secondary hover:bg-primary text-on-primary text-sm uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-2"
                  onClick={handleAdd}
                >
                  <span>Adicionar à Sacola</span>
                  <span>→</span>
                </button>
              </div>
              <p className="text-[11px] text-text-secondary text-center">
                Sem burocracia ou login: atendimento personalizado direto via WhatsApp.
              </p>
            </div>

            <div className="border-t border-border-hairline py-6 space-y-2">
              <label className="text-[11px] uppercase tracking-wide text-text-secondary block" htmlFor="cep-input">Calcular Frete e Prazos</label>
              <div className="flex w-full">
                <input
                  className="w-full h-12 px-3 bg-surface-off border border-border-hairline text-text-primary placeholder:text-text-disabled text-sm focus:outline-none focus:border-primary"
                  id="cep-input"
                  maxLength={9}
                  placeholder="Digite seu CEP"
                  type="text"
                />
                <button
                  className="h-12 px-4 bg-surface-container hover:bg-surface-variant text-text-primary border border-l-0 border-border-hairline text-[11px] uppercase font-bold tracking-wider transition-colors flex-shrink-0"
                  onClick={calculateShipping}
                >
                  Calcular
                </button>
              </div>
              {shippingResult && (
                <div className="pt-1 text-[11px] text-text-secondary space-y-1">
                  <div className="flex justify-between py-1 border-b border-border-hairline">
                    <span>Sedex Express (até 2 dias úteis)</span>
                    <span className="font-semibold text-text-primary">R$ 24,90</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>PAC Convencional (até 5 dias úteis)</span>
                    <span className="font-semibold text-text-primary">R$ 14,50</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border-hairline pt-6">
              <div className="flex items-center gap-4 border-b border-border-hairline pb-2 overflow-x-auto no-scrollbar">
                {(['sobre', 'composicao', 'medidas', 'lavagem'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[11px] uppercase tracking-wider whitespace-nowrap pb-2 ${
                      activeTab === tab
                        ? 'text-primary border-b-2 border-primary -mb-[9px] font-bold'
                        : 'text-text-secondary hover:text-primary font-medium'
                    }`}
                  >
                    {tab === 'composicao' ? 'Composição' : tab}
                  </button>
                ))}
              </div>
              <div className="pt-4">
                {activeTab === 'sobre' && (
                  <div className="tab-pane">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {product.about}
                    </p>
                  </div>
                )}
                {activeTab === 'composicao' && (
                  <div className="tab-pane">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {product.composition}
                    </p>
                  </div>
                )}
                {activeTab === 'medidas' && (
                  <div className="tab-pane">
                    <table className="w-full text-sm text-text-secondary">
                      <thead>
                        <tr className="text-left border-b border-border-hairline">
                          <th className="py-2">Tam.</th>
                          <th className="py-2">Largura (busto)</th>
                          <th className="py-2">Comprimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border-hairline">
                          <td className="py-2">M</td>
                          <td>60 cm</td>
                          <td>74 cm</td>
                        </tr>
                        <tr className="border-b border-border-hairline">
                          <td className="py-2">G</td>
                          <td>64 cm</td>
                          <td>76 cm</td>
                        </tr>
                        <tr>
                          <td className="py-2">GG</td>
                          <td>68 cm</td>
                          <td>78 cm</td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="text-[11px] text-text-secondary mt-2">
                      Medidas aproximadas, tiradas com a peça deitada. Modelagem oversized.
                    </p>
                  </div>
                )}
                {activeTab === 'lavagem' && (
                  <div className="tab-pane">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      Lavar à máquina em água fria, ciclo delicado. Não usar alvejante. Secar à sombra. Passar a ferro em temperatura baixa, sem vapor direto sobre estampas.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
