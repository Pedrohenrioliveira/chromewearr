export interface SizeStock {
  s: string; // Size label: "M", "G", "GG"
  q: number; // Available quantity
  w?: string; // Width measurement
  l?: string; // Length measurement
}

export interface Product {
  id: string; // numeric string or id
  numId: number; // numeric id matching archive-lab (0, 1, 2, 3)
  ref: string; // e.g. "01/25"
  name: string;
  slug: string;
  cat: string; // Category name e.g. "Camisetas CW"
  collection: string; // Collection name e.g. "Sanctum"
  sub: string; // Subtitle e.g. "Algodão 240g/m² Oversized"
  description: string;
  price: number;
  imageUrl: string;
  img: string; // Image path or base64
  about: string; // Product story / description
  composition: string; // Fabric composition
  sizes: string[]; // List of size strings e.g. ["M", "G", "GG"]
  sizeMatrix: SizeStock[]; // Detailed stock matrix e.g. [{s:"M",q:5}]
  inStock: boolean;
  isFeatured: boolean;
  categoryId: string;
  categoryName?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface CartItem {
  id: string; // unique item id: `${productId}-${size}`
  productId: string;
  numId: number;
  ref: string;
  name: string;
  price: number;
  imageUrl: string;
  size: string;
  quantity: number;
  addedAt?: string;
  reminderSentAt?: string;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: 'USER' | 'VENDOR' | 'ADMIN';
  isVerified?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  ordersCount?: number;
  orders?: Array<{
    id: string;
    totalPrice: number;
    status: string;
    createdAt: string | Date;
  }>;
  cartData?: any;
}

export type ModalType = 'sobre' | 'contato' | null;
export type ViewMode = 'home' | 'product' | 'collection';

export * from './coupon';

