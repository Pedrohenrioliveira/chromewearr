import React from 'react';
import Image from 'next/image';
import { CartItem } from '@/types';
import { formatCurrency, buildWhatsAppLink } from '@/lib/utils';
import { WHATSAPP_NUMBER } from '@/lib/data';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  if (!isOpen) return null;

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckoutWhatsApp = () => {
    if (items.length === 0) {
      alert('Sua sacola está vazia.');
      return;
    }
    
    const url = buildWhatsAppLink(WHATSAPP_NUMBER, items, total);
    
    // Create an anchor and click it to bypass pop-up blockers nicely
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="relative h-full w-full max-w-[380px] bg-white flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border-hairline flex-shrink-0">
          <span className="font-display text-sm uppercase tracking-widest font-bold text-text-primary">
            Sua Sacola
          </span>
          <button
            onClick={onClose}
            className="text-xl leading-none text-text-secondary hover:text-primary transition-colors"
            aria-label="Fechar Sacola"
          >
            &times;
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-sm font-medium">Sua sacola está vazia.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 pb-3 border-b border-border-hairline"
              >
                <div className="relative w-14 h-14 bg-surface-off border border-border-hairline flex-shrink-0 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Tam. {item.size} — Qtd {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold">
                    R$ {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-text-secondary hover:text-primary text-lg leading-none transition-colors"
                    title="Remover item"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-border-hairline p-4 flex-shrink-0">
          <div className="flex items-center justify-between text-sm font-semibold mb-3">
            <span>Total</span>
            <span id="cart-total" className="text-base font-bold text-primary">
              R$ {formatCurrency(total)}
            </span>
          </div>

          <button
            onClick={handleCheckoutWhatsApp}
            disabled={items.length === 0}
            className="w-full h-12 bg-secondary hover:bg-primary text-on-primary text-xs md:text-sm uppercase tracking-wider font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Finalizar pedido pelo WhatsApp
          </button>
          <p className="text-[11px] text-text-secondary text-center mt-2">
            O vendedor recebe seu pedido pronto e combina com você pagamento e
            entrega.
          </p>
        </div>
      </div>
    </div>
  );
};
