export type CouponDiscountType = 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';

export type CouponStatus = 
  | 'DRAFT' 
  | 'SCHEDULED' 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'EXPIRED' 
  | 'EXHAUSTED' 
  | 'ARCHIVED';

export type SellerScope = 'ALL' | 'SELECTED';

export type ProductScope = 'ALL' | 'SELECTED_PRODUCTS' | 'SELECTED_CATEGORIES';

export type FinancingType = 'MARKETPLACE_100' | 'SELLER_100' | 'SHARED';

export interface CouponSellerItem {
  id?: string;
  sellerId: string;
  sellerName: string;
}

export interface CouponItemRule {
  id?: string;
  itemId: string;
  name?: string;
  isExcluded?: boolean;
}

export interface Coupon {
  id: string;
  code: string; // Uppercase, normalized, unique e.g. "BEMVINDO10"
  name: string; // Internal campaign name
  description?: string;
  internalId?: string;
  discountType: CouponDiscountType;
  discountValue: number; // e.g. 15 for 15%, or 50 for R$ 50,00
  maxDiscountAmount?: number | null; // Ceiling for percentage discounts in R$
  minOrderValue?: number | null; // Minimum cart eligible subtotal
  subtotalEligible: boolean; // true = apply to eligible items, false = cart-wide
  canStack: boolean; // Can accumulate with other coupons/promotions
  roundingMode?: 'CENT_2';
  startDate: string; // ISO date
  endDate?: string | null; // ISO date or null for indefinite
  timezone: string; // Default 'America/Sao_Paulo'
  status: CouponStatus;
  
  // Sellers
  sellerScope: SellerScope;
  selectedSellerIds: string[];
  selectedSellers?: CouponSellerItem[];

  // Products & Categories
  productScope: ProductScope;
  selectedProductIds: string[];
  excludedProductIds: string[];
  selectedCategoryIds: string[];
  excludedCategoryIds: string[];

  // Limits
  totalUsageLimit?: number | null; // Total uses limit or null for unlimited
  usagePerCustomerLimit: number; // Max uses per customer (default 1)
  usagePerOrderLimit: number; // Max uses per order (default 1)
  financialBudget?: number | null; // Max total discount amount in R$

  // Financing
  financingType: FinancingType;
  marketplaceSharePercent: number; // 0 to 100
  sellerSharePercent: number; // 0 to 100

  // Metrics (dynamically computed and tracked)
  usedCount: number;
  totalDiscountGiven: number;
  totalMarketplaceCost: number;
  totalSellerCost: number;
  uniqueCustomersCount?: number;

  version: number;
  createdByAdmin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  couponCode: string;
  orderId?: string;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  subtotal: number;
  discountAmount: number;
  finalTotal: number;
  marketplaceCost: number;
  sellerCost: number;
  itemsCount: number;
  status: 'CONFIRMED' | 'RESERVED' | 'REFUNDED';
  createdAt: string;
}

export type VerificationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface CouponVerification {
  id: string;
  code: string; // Human-friendly verification code e.g. "CW-VFY-9X82KD"
  couponId: string;
  couponCode: string;
  couponName: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
  subtotal: number;
  finalTotal: number;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    size?: string;
  }>;
  status: VerificationStatus;
  createdAt: string;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  cancelledAt?: string | null;
}

export interface CouponAuditLog {
  id: string;
  couponId: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'DUPLICATE' | 'ARCHIVE' | 'REDEMPTION' | 'VERIFICATION_CONFIRMED';
  details: string;
  changedBy: string;
  createdAt: string;
}

export interface CartValidationItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  categoryId?: string;
  sellerId?: string;
  ref?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  message?: string;
  errorCode?: 
    | 'NOT_FOUND' 
    | 'INACTIVE' 
    | 'SCHEDULED' 
    | 'EXPIRED' 
    | 'EXHAUSTED' 
    | 'PAUSED' 
    | 'MIN_ORDER_NOT_MET' 
    | 'CUSTOMER_LIMIT_REACHED' 
    | 'NO_ELIGIBLE_ITEMS' 
    | 'BUDGET_EXCEEDED' 
    | 'CANNOT_STACK';
  discountAmount: number;
  eligibleSubtotal: number;
  finalTotal: number;
  marketplaceCost: number;
  sellerCost: number;
  isFreeShipping: boolean;
}

export interface CouponDashboardStats {
  totalCoupons: number;
  activeCoupons: number;
  scheduledCoupons: number;
  pausedCoupons: number;
  expiredCoupons: number;
  exhaustedCoupons: number;
  archivedCoupons: number;
  totalRedemptions: number;
  uniqueCustomers: number;
  totalDiscountGiven: number;
  marketplaceCost: number;
  sellerCost: number;
  averageDiscount: number;
  expiringSoonCount: number; // in <= 7 days
  nearLimitCount: number; // >= 80% of limit or budget
  topCampaigns: Array<{
    id: string;
    code: string;
    name: string;
    usedCount: number;
    totalDiscount: number;
    status: CouponStatus;
  }>;
}
