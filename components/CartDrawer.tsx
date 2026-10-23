import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CartItem } from '@/types';
import { formatCurrency, buildWhatsAppLink, CouponDiscountSummary } from '@/lib/utils';
import { WHATSAPP_NUMBER } from '@/lib/data';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

interface AppliedCoupon {
  code: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  discountValue: number;
  discountAmount: number;
  canStack: boolean;
  isFreeShipping: boolean;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupons, setAppliedCoupons] = useState<AppliedCoupon[]>([]);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Recalculate applied coupons whenever items or subtotal changes
  useEffect(() => {
    if (appliedCoupons.length === 0 || items.length === 0) {
      if (items.length === 0 && appliedCoupons.length > 0) {
        setAppliedCoupons([]);
      }
      return;
    }

    const revalidateCoupons = async () => {
      const updatedCoupons: AppliedCoupon[] = [];
      for (const coup of appliedCoupons) {
        try {
          const res = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: coup.code,
              items: items.map((i) => ({
                id: i.id,
                productId: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                ref: i.ref,
              })),
            }),
          });
          const data = await res.json();
          if (data.valid && data.coupon) {
            updatedCoupons.push({
              code: data.coupon.code,
              name: data.coupon.name,
              discountType: data.coupon.discountType,
              discountValue: data.coupon.discountValue,
              discountAmount: data.discountAmount,
              canStack: data.coupon.canStack,
              isFreeShipping: data.isFreeShipping,
            });
          }
        } catch (e) {
          console.error('Erro ao revalidar cupom:', e);
        }
      }
      setAppliedCoupons(updatedCoupons);
    };

    revalidateCoupons();
  }, [items]);

  if (!isOpen) return null;

  const totalDiscount = appliedCoupons.reduce((sum, c) => sum + c.discountAmount, 0);
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCodeInput.trim().toUpperCase();
    if (!code) {
      setCouponError('Digite um código de cupom.');
      return;
    }

    if (appliedCoupons.some((c) => c.code === code)) {
      setCouponError('Este cupom já foi aplicado.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');
    setCouponSuccess('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          items: items.map((i) => ({
            id: i.id,
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            ref: i.ref,
          })),
          appliedCoupons: appliedCoupons.map((c) => c.code),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.message || 'Cupom inválido ou não elegível.');
        return;
      }

      const newCoupon: AppliedCoupon = {
        code: data.coupon.code,
        name: data.coupon.name,
        discountType: data.coupon.discountType,
        discountValue: data.coupon.discountValue,
        discountAmount: data.discountAmount,
        canStack: data.coupon.canStack,
        isFreeShipping: data.isFreeShipping,
      };

      // If cannot stack, replace or reject
      if (!newCoupon.canStack || appliedCoupons.some((c) => !c.canStack)) {
        setAppliedCoupons([newCoupon]);
        setCouponSuccess(`Cupom ${newCoupon.code} aplicado! (Não cumulativo com outros)`);
      } else {
        setAppliedCoupons([...appliedCoupons, newCoupon]);
        setCouponSuccess(`Cupom ${newCoupon.code} adicionado com sucesso!`);
      }

      setCouponCodeInput('');
      setTimeout(() => setCouponSuccess(''), 4000);
    } catch (err) {
      setCouponError('Erro de conexão ao validar cupom.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = (codeToRemove: string) => {
    setAppliedCoupons(appliedCoupons.filter((c) => c.code !== codeToRemove));
    setCouponError('');
  };

  const handleCheckoutWhatsApp = async () => {
    if (items.length === 0) {
      alert('Sua sacola está vazia.');
      return;
    }

    let verificationCode: string | null = null;

    // Generate anti-fraud verification code if coupons are applied (does NOT burn coupon yet)
    if (appliedCoupons.length > 0) {
      try {
        let customerName = 'Cliente Loja WhatsApp';
        let customerPhone: string | null = null;
        let customerEmail: string | null = null;
        try {
          const stored = localStorage.getItem('chromewear_user');
          if (stored) {
            const u = JSON.parse(stored);
            if (u.name) customerName = u.name;
            if (u.phone) customerPhone = u.phone;
            if (u.email) customerEmail = u.email;
          }
        } catch (e) {}

        const res = await fetch('/api/coupons/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            couponCode: appliedCoupons[0].code,
            items: items.map((i) => ({
              id: i.id,
              productId: i.productId,
              name: i.name,
              price: i.price,
              quantity: i.quantity,
              ref: i.ref,
            })),
            customerName,
            customerPhone,
            customerEmail,
            subtotal,
            finalTotal,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.verification?.code) {
            verificationCode = data.verification.code;
          }
        }
      } catch (e) {
        console.error('Error generating verification code:', e);
      }
    }

    const couponSummaries: CouponDiscountSummary[] = appliedCoupons.map((c) => ({
      code: c.code,
      name: c.name,
      discountType: c.discountType,
      discountValue: c.discountValue,
      discountAmount: c.discountAmount,
    }));

    const url = buildWhatsAppLink(
      WHATSAPP_NUMBER,
      items,
      finalTotal,
      couponSummaries.length > 0 ? couponSummaries : null,
      subtotal,
      verificationCode
    );

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
      <div className="relative h-full w-full max-w-[400px] bg-white flex flex-col pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] shadow-2xl z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-border-hairline flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm uppercase tracking-widest font-bold text-text-primary">
              Sua Sacola
            </span>
            {items.length > 0 && (
              <span className="text-[10px] bg-surface-off border border-border-hairline px-2 py-0.5 font-semibold text-text-secondary">
                {items.reduce((s, i) => s + i.quantity, 0)} {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none text-text-secondary hover:text-primary transition-colors p-2"
            aria-label="Fechar Sacola"
          >
            &times;
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-text-secondary">
              <svg
                className="w-12 h-12 mx-auto mb-3 opacity-30"
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
              <p className="text-xs text-text-secondary/70 mt-1">Adicione itens exclusivos para continuar.</p>
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
                  <p className="text-sm font-medium text-text-primary truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    Tam. {item.size} — Qtd {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-text-primary">
                    R$ {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-text-secondary hover:text-primary text-lg leading-none transition-colors p-1"
                    title="Remover item"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer with Coupon Section */}
        {items.length > 0 && (
          <div className="border-t border-border-hairline p-4 flex-shrink-0 bg-surface-off/40">
            {/* Coupon Input Form */}
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-widest font-semibold text-text-secondary mb-1.5">
                Cupom de Desconto
              </label>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCodeInput}
                  onChange={(e) => {
                    setCouponCodeInput(e.target.value.toUpperCase());
                    if (couponError) setCouponError('');
                  }}
                  placeholder="DIGITE SEU CUPOM"
                  className="flex-1 bg-white border border-border-hairline px-3 py-2 text-sm sm:text-xs uppercase tracking-wider font-semibold focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponCodeInput.trim()}
                  className="px-4 py-2 min-h-[38px] bg-primary hover:bg-secondary text-white text-[11px] uppercase tracking-wider font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {couponLoading ? '...' : 'Aplicar'}
                </button>
              </form>

              {couponError && (
                <p className="text-[11px] text-[#ba1a1a] mt-1.5 font-medium leading-tight animate-in fade-in">
                  {couponError}
                </p>
              )}

              {couponSuccess && (
                <p className="text-[11px] text-[#146c2e] mt-1.5 font-medium leading-tight animate-in fade-in">
                  {couponSuccess}
                </p>
              )}

              {/* Applied Coupons Pills */}
              {appliedCoupons.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-1.5">
                  {appliedCoupons.map((c) => (
                    <div
                      key={c.code}
                      className="flex items-center justify-between bg-surface-off border border-border-hairline px-3 py-1.5 text-xs text-text-primary animate-in fade-in"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold tracking-wider">{c.code}</span>
                        <span className="text-[10px] text-text-secondary">
                          ({c.discountType === 'PERCENTAGE'
                            ? `${c.discountValue}% OFF`
                            : c.discountType === 'FIXED'
                            ? `R$ ${formatCurrency(c.discountValue)} OFF`
                            : 'Frete Grátis'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">
                          - R$ {formatCurrency(c.discountAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCoupon(c.code)}
                          className="text-text-secondary hover:text-text-primary font-bold text-sm leading-none ml-1"
                          title="Remover cupom"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-border-hairline mb-3 text-xs">
              <div className="flex items-center justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>R$ {formatCurrency(subtotal)}</span>
              </div>

              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-text-primary font-medium">
                  <span>Desconto de Cupons</span>
                  <span className="font-bold">- R$ {formatCurrency(totalDiscount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm font-bold pt-1 text-text-primary border-t border-border-hairline/60">
                <span>Total com Desconto</span>
                <span id="cart-total" className="text-base text-primary">
                  R$ {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>

            {/* WhatsApp Checkout Button */}
            <button
              onClick={handleCheckoutWhatsApp}
              disabled={items.length === 0}
              className="w-full h-12 bg-primary hover:bg-secondary text-white text-xs md:text-sm uppercase tracking-wider font-bold transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Finalizar pedido pelo WhatsApp</span>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/>
              </svg>
            </button>
            <p className="text-[10px] text-text-secondary text-center mt-2 leading-relaxed">
              O vendedor recebe o seu pedido com o desconto aplicado e combina pagamento e entrega diretamente com você.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
