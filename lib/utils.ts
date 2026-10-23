import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    currencyDisplay: 'symbol',
  }).format(value).replace('R$', '').trim();
}

export interface CouponDiscountSummary {
  code: string;
  name?: string;
  discountType?: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | string;
  discountValue?: number;
  discountAmount: number;
}

export function buildWhatsAppLink(
  phone: string,
  items: Array<any>,
  total: number,
  couponDetails?: CouponDiscountSummary | CouponDiscountSummary[] | null,
  subtotalOverride?: number
): string {
  const itemLines = items.map((item, idx) => {
    const itemSubtotal = item.price * item.quantity;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/#produto-${item.productId || item.id}`;
    const ref = item.ref || '01/25';
    return `${idx + 1}. ${item.name} (Ref. ${ref})\n   🔗 Link: ${link}\n   Tamanho: ${item.size}\n   Quantidade: ${item.quantity}\n   Preço unitário: R$ ${formatCurrency(item.price)}\n   Subtotal: R$ ${formatCurrency(itemSubtotal)}`;
  }).join('\n\n');

  const rawSubtotal = subtotalOverride !== undefined 
    ? subtotalOverride 
    : items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const couponsList: CouponDiscountSummary[] = Array.isArray(couponDetails)
    ? couponDetails
    : couponDetails
    ? [couponDetails]
    : [];

  const totalDiscount = couponsList.reduce((acc, c) => acc + (c.discountAmount || 0), 0);

  let msg = `🛍️ NOVO PEDIDO - CHROMEWEAR\n\n`;
  msg += `📦 PEDIDO\n\n${itemLines}\n\n`;

  if (couponsList.length > 0 && totalDiscount > 0) {
    msg += `----------------------------------------\n`;
    msg += `Subtotal dos produtos: R$ ${formatCurrency(rawSubtotal)}\n`;
    
    couponsList.forEach((c) => {
      const typeLabel = c.discountType === 'PERCENTAGE' ? ` (${c.discountValue}% OFF)` : '';
      msg += `🎟️ Cupom: ${c.code}${typeLabel}\n`;
      msg += `📉 Desconto: - R$ ${formatCurrency(c.discountAmount)}\n`;
    });

    msg += `----------------------------------------\n`;
    msg += `💰 TOTAL FINAL COM DESCONTO: R$ ${formatCurrency(total)}\n\n`;
    msg += `Gostaria de finalizar este pedido com o desconto aplicado!`;
  } else {
    msg += `💰 TOTAL: R$ ${formatCurrency(total)}\n\n`;
    msg += `Gostaria de finalizar este pedido.`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
