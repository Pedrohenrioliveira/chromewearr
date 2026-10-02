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

export function buildWhatsAppLink(
  phone: string,
  items: Array<any>,
  total: number
): string {
  const itemLines = items.map((item, idx) => {
    const subtotal = item.price * item.quantity;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/#produto-${item.productId || item.id}`;
    // Use ref if available, or fallback
    const ref = item.ref || '01/25';
    return `${idx+1}. ${item.name} (Ref. ${ref})\n   🔗 Link: ${link}\n   Tamanho: ${item.size}\n   Quantidade: ${item.quantity}\n   Preço unitário: R$ ${formatCurrency(item.price)}\n   Subtotal: R$ ${formatCurrency(subtotal)}`;
  }).join('\n\n');

  let msg = `🛍️ NOVO PEDIDO - CHROMEWEAR\n\n`;
  msg += `📦 PEDIDO\n\n${itemLines}\n\n`;
  msg += `💰 TOTAL: R$ ${formatCurrency(total)}\n\n`;
  msg += `Gostaria de finalizar este pedido.`;

  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
