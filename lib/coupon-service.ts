import fs from 'fs';
import path from 'path';
import {
  Coupon,
  CouponStatus,
  CouponRedemption,
  CouponAuditLog,
  CouponDashboardStats,
  CouponValidationResult,
  CartValidationItem,
} from '@/types/coupon';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/data';

// Persistent fallback directory
const DATA_DIR = path.join(process.cwd(), 'data');
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const REDEMPTIONS_FILE = path.join(DATA_DIR, 'coupon_redemptions.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'coupon_audit_logs.json');

// Ensure directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initial realistic seed sellers for multi-vendor marketplace
export const INITIAL_SELLERS = [
  { id: 'seller-cw-official', name: 'ChromeWear Official (Flagship)', status: 'ACTIVE' },
  { id: 'seller-sanctum-lab', name: 'Sanctum Atelier & Lab', status: 'ACTIVE' },
  { id: 'seller-urban-dist', name: 'Urban Techwear Brasil', status: 'ACTIVE' },
  { id: 'seller-nordic-cuts', name: 'Nordic Minimalist Wear', status: 'ACTIVE' },
];

// Initial realistic seed coupons
const SEED_COUPONS: Coupon[] = [
  {
    id: 'coup-welcome-10',
    code: 'BEMVINDO10',
    name: 'Boas-Vindas ChromeWear 10%',
    description: '10% de desconto para novos clientes em todos os produtos da loja.',
    internalId: 'CAMP-2026-001',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: 50.00,
    minOrderValue: 100.00,
    subtotalEligible: true,
    canStack: false,
    roundingMode: 'CENT_2',
    startDate: new Date(Date.now() - 15 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 60 * 86400000).toISOString(),
    timezone: 'America/Sao_Paulo',
    status: 'ACTIVE',
    sellerScope: 'ALL',
    selectedSellerIds: [],
    productScope: 'ALL',
    selectedProductIds: [],
    excludedProductIds: [],
    selectedCategoryIds: [],
    excludedCategoryIds: [],
    totalUsageLimit: 500,
    usagePerCustomerLimit: 1,
    usagePerOrderLimit: 1,
    financialBudget: 5000.00,
    financingType: 'MARKETPLACE_100',
    marketplaceSharePercent: 100,
    sellerSharePercent: 0,
    usedCount: 38,
    totalDiscountGiven: 494.00,
    totalMarketplaceCost: 494.00,
    totalSellerCost: 0.00,
    version: 1,
    createdByAdmin: 'Administrador (admin@chromewear.com)',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'coup-cw50-fixed',
    code: 'CHROME50',
    name: 'Desconto Fixo R$ 50 Acima de R$ 200',
    description: 'R$ 50 de desconto em compras acima de R$ 200 em peças selecionadas.',
    internalId: 'CAMP-2026-002',
    discountType: 'FIXED',
    discountValue: 50.00,
    maxDiscountAmount: null,
    minOrderValue: 200.00,
    subtotalEligible: true,
    canStack: true,
    roundingMode: 'CENT_2',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 4 * 86400000).toISOString(), // Expiring in 4 days!
    timezone: 'America/Sao_Paulo',
    status: 'ACTIVE',
    sellerScope: 'ALL',
    selectedSellerIds: [],
    productScope: 'ALL',
    selectedProductIds: [],
    excludedProductIds: [],
    selectedCategoryIds: [],
    excludedCategoryIds: [],
    totalUsageLimit: 100,
    usagePerCustomerLimit: 2,
    usagePerOrderLimit: 1,
    financialBudget: 3000.00,
    financingType: 'SHARED',
    marketplaceSharePercent: 60,
    sellerSharePercent: 40,
    usedCount: 82, // Near limit (82%)!
    totalDiscountGiven: 4100.00,
    totalMarketplaceCost: 2460.00,
    totalSellerCost: 1640.00,
    version: 1,
    createdByAdmin: 'Administrador (admin@chromewear.com)',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'coup-frete-gratis',
    code: 'FRETEOFF',
    name: 'Frete Grátis Coleção Sanctum',
    description: 'Frete grátis em toda a linha de camisetas Sanctum.',
    internalId: 'CAMP-2026-003',
    discountType: 'FREE_SHIPPING',
    discountValue: 0,
    maxDiscountAmount: null,
    minOrderValue: 120.00,
    subtotalEligible: true,
    canStack: true,
    roundingMode: 'CENT_2',
    startDate: new Date(Date.now() - 20 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    timezone: 'America/Sao_Paulo',
    status: 'ACTIVE',
    sellerScope: 'ALL',
    selectedSellerIds: [],
    productScope: 'SELECTED_CATEGORIES',
    selectedProductIds: [],
    excludedProductIds: [],
    selectedCategoryIds: ['cat-1'],
    excludedCategoryIds: [],
    totalUsageLimit: 200,
    usagePerCustomerLimit: 3,
    usagePerOrderLimit: 1,
    financialBudget: 2000.00,
    financingType: 'SELLER_100',
    marketplaceSharePercent: 0,
    sellerSharePercent: 100,
    usedCount: 45,
    totalDiscountGiven: 900.00,
    totalMarketplaceCost: 0.00,
    totalSellerCost: 900.00,
    version: 1,
    createdByAdmin: 'Administrador (admin@chromewear.com)',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'coup-vip-black',
    code: 'VIPBLACK',
    name: 'Campanha VIP Pausada',
    description: 'Cupom especial de teste em estado pausado.',
    internalId: 'CAMP-2026-004',
    discountType: 'PERCENTAGE',
    discountValue: 25,
    maxDiscountAmount: 150.00,
    minOrderValue: 250.00,
    subtotalEligible: true,
    canStack: false,
    roundingMode: 'CENT_2',
    startDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    timezone: 'America/Sao_Paulo',
    status: 'PAUSED',
    sellerScope: 'ALL',
    selectedSellerIds: [],
    productScope: 'ALL',
    selectedProductIds: [],
    excludedProductIds: [],
    selectedCategoryIds: [],
    excludedCategoryIds: [],
    totalUsageLimit: 50,
    usagePerCustomerLimit: 1,
    usagePerOrderLimit: 1,
    financialBudget: 1250.00,
    financingType: 'MARKETPLACE_100',
    marketplaceSharePercent: 100,
    sellerSharePercent: 0,
    usedCount: 12,
    totalDiscountGiven: 390.00,
    totalMarketplaceCost: 390.00,
    totalSellerCost: 0.00,
    version: 1,
    createdByAdmin: 'Administrador (admin@chromewear.com)',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const SEED_REDEMPTIONS: CouponRedemption[] = [
  {
    id: 'red-01',
    couponId: 'coup-welcome-10',
    couponCode: 'BEMVINDO10',
    orderId: 'ORD-1001',
    customerName: 'Lucas Ferreira',
    customerEmail: 'lucas.ferreira@example.com',
    customerPhone: '11988887777',
    subtotal: 130.00,
    discountAmount: 13.00,
    finalTotal: 117.00,
    marketplaceCost: 13.00,
    sellerCost: 0.00,
    itemsCount: 1,
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'red-02',
    couponId: 'coup-cw50-fixed',
    couponCode: 'CHROME50',
    orderId: 'ORD-1002',
    customerName: 'Mariana Costa',
    customerEmail: 'mariana.costa@example.com',
    customerPhone: '11977776666',
    subtotal: 260.00,
    discountAmount: 50.00,
    finalTotal: 210.00,
    marketplaceCost: 30.00,
    sellerCost: 20.00,
    itemsCount: 2,
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'red-03',
    couponId: 'coup-welcome-10',
    couponCode: 'BEMVINDO10',
    orderId: 'ORD-1003',
    customerName: 'Gabriel Souza',
    customerEmail: 'gabriel.souza@example.com',
    customerPhone: '21999998888',
    subtotal: 130.00,
    discountAmount: 13.00,
    finalTotal: 117.00,
    marketplaceCost: 13.00,
    sellerCost: 0.00,
    itemsCount: 1,
    status: 'CONFIRMED',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const SEED_LOGS: CouponAuditLog[] = [
  {
    id: 'log-01',
    couponId: 'coup-welcome-10',
    action: 'CREATE',
    details: 'Cupom BEMVINDO10 criado com 10% de desconto.',
    changedBy: 'Administrador (admin@chromewear.com)',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'log-02',
    couponId: 'coup-cw50-fixed',
    action: 'CREATE',
    details: 'Cupom CHROME50 criado com R$ 50 de desconto fixo.',
    changedBy: 'Administrador (admin@chromewear.com)',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'log-03',
    couponId: 'coup-vip-black',
    action: 'STATUS_CHANGE',
    details: 'Status alterado de ATIVO para PAUSADO para reavaliação de estoque.',
    changedBy: 'Administrador (admin@chromewear.com)',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

// Helper: read JSON safely
function readJsonFile<T>(filePath: string, fallback: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return fallback;
  }
}

// Helper: write JSON safely
function writeJsonFile<T>(filePath: string, data: T) {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Compute dynamic effective status considering limits, dates, and administrative status
export function getEffectiveStatus(coupon: Coupon): CouponStatus {
  if (coupon.status === 'ARCHIVED') return 'ARCHIVED';
  if (coupon.status === 'DRAFT') return 'DRAFT';
  if (coupon.status === 'PAUSED') return 'PAUSED';

  const now = new Date();
  const start = new Date(coupon.startDate);
  if (now < start) return 'SCHEDULED';

  if (coupon.endDate) {
    const end = new Date(coupon.endDate);
    if (now > end) return 'EXPIRED';
  }

  if (coupon.totalUsageLimit !== null && coupon.totalUsageLimit !== undefined) {
    if (coupon.usedCount >= coupon.totalUsageLimit) return 'EXHAUSTED';
  }

  if (coupon.financialBudget !== null && coupon.financialBudget !== undefined) {
    if (coupon.totalDiscountGiven >= coupon.financialBudget) return 'EXHAUSTED';
  }

  return 'ACTIVE';
}

export class CouponService {
  // Get all coupons with effective statuses updated
  static getAllCoupons(): Coupon[] {
    const coupons = readJsonFile<Coupon[]>(COUPONS_FILE, SEED_COUPONS);
    return coupons.map((c) => ({
      ...c,
      status: getEffectiveStatus(c),
    }));
  }

  static getCouponById(id: string): Coupon | null {
    const coupons = this.getAllCoupons();
    return coupons.find((c) => c.id === id) || null;
  }

  static getCouponByCode(code: string): Coupon | null {
    const normalized = code.trim().toUpperCase();
    const coupons = this.getAllCoupons();
    return coupons.find((c) => c.code.toUpperCase() === normalized) || null;
  }

  static createCoupon(data: Partial<Coupon>, adminName: string = 'Administrador'): { coupon: Coupon; error?: string } {
    const normalizedCode = (data.code || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!normalizedCode) {
      return { coupon: {} as any, error: 'O código do cupom é obrigatório e deve conter apenas letras, números e traços.' };
    }
    if (!data.name?.trim()) {
      return { coupon: {} as any, error: 'O nome interno da campanha é obrigatório.' };
    }
    if (!data.discountType || !data.discountValue || data.discountValue <= 0) {
      if (data.discountType !== 'FREE_SHIPPING') {
        return { coupon: {} as any, error: 'O valor do desconto deve ser maior que zero.' };
      }
    }

    const coupons = this.getAllCoupons();
    if (coupons.some((c) => c.code.toUpperCase() === normalizedCode && c.status !== 'ARCHIVED')) {
      return { coupon: {} as any, error: `Já existe um cupom cadastrado com o código ${normalizedCode}.` };
    }

    const nowIso = new Date().toISOString();
    const newCoupon: Coupon = {
      id: `coup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: normalizedCode,
      name: data.name.trim(),
      description: data.description || '',
      internalId: data.internalId || `CAMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      discountType: data.discountType || 'PERCENTAGE',
      discountValue: Number(data.discountValue) || 0,
      maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
      minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : null,
      subtotalEligible: data.subtotalEligible !== false,
      canStack: !!data.canStack,
      roundingMode: 'CENT_2',
      startDate: data.startDate || nowIso,
      endDate: data.endDate || null,
      timezone: data.timezone || 'America/Sao_Paulo',
      status: (data.status as CouponStatus) || 'ACTIVE',
      sellerScope: data.sellerScope || 'ALL',
      selectedSellerIds: data.selectedSellerIds || [],
      productScope: data.productScope || 'ALL',
      selectedProductIds: data.selectedProductIds || [],
      excludedProductIds: data.excludedProductIds || [],
      selectedCategoryIds: data.selectedCategoryIds || [],
      excludedCategoryIds: data.excludedCategoryIds || [],
      totalUsageLimit: data.totalUsageLimit !== undefined && data.totalUsageLimit !== null ? Number(data.totalUsageLimit) : null,
      usagePerCustomerLimit: Number(data.usagePerCustomerLimit) || 1,
      usagePerOrderLimit: Number(data.usagePerOrderLimit) || 1,
      financialBudget: data.financialBudget ? Number(data.financialBudget) : null,
      financingType: data.financingType || 'MARKETPLACE_100',
      marketplaceSharePercent: Number(data.marketplaceSharePercent ?? 100),
      sellerSharePercent: Number(data.sellerSharePercent ?? 0),
      usedCount: 0,
      totalDiscountGiven: 0,
      totalMarketplaceCost: 0,
      totalSellerCost: 0,
      version: 1,
      createdByAdmin: adminName,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    coupons.unshift(newCoupon);
    writeJsonFile(COUPONS_FILE, coupons);

    // Audit log
    this.addAuditLog({
      couponId: newCoupon.id,
      action: 'CREATE',
      details: `Campanha "${newCoupon.name}" (${newCoupon.code}) criada com status ${newCoupon.status}.`,
      changedBy: adminName,
    });

    return { coupon: newCoupon };
  }

  static updateCoupon(id: string, data: Partial<Coupon>, adminName: string = 'Administrador'): { coupon?: Coupon; error?: string } {
    const coupons = this.getAllCoupons();
    const idx = coupons.findIndex((c) => c.id === id);
    if (idx === -1) {
      return { error: 'Cupom não encontrado.' };
    }

    const current = coupons[idx];
    const hasBeenUsed = current.usedCount > 0;

    // Rule versioning: if rules change, increment version
    let newVersion = current.version;
    const rulesChanged =
      (data.discountValue !== undefined && data.discountValue !== current.discountValue) ||
      (data.discountType !== undefined && data.discountType !== current.discountType) ||
      (data.minOrderValue !== undefined && data.minOrderValue !== current.minOrderValue) ||
      (data.financingType !== undefined && data.financingType !== current.financingType);

    if (rulesChanged) {
      newVersion += 1;
    }

    // Code & discountType locking if coupon was already used
    let updatedCode = current.code;
    if (data.code && data.code.toUpperCase() !== current.code.toUpperCase()) {
      if (hasBeenUsed) {
        return { error: 'Não é permitido alterar o código de um cupom que já possui utilizações.' };
      }
      updatedCode = data.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    }

    const updated: Coupon = {
      ...current,
      ...data,
      id: current.id,
      code: updatedCode,
      usedCount: current.usedCount,
      totalDiscountGiven: current.totalDiscountGiven,
      totalMarketplaceCost: current.totalMarketplaceCost,
      totalSellerCost: current.totalSellerCost,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    };

    coupons[idx] = updated;
    writeJsonFile(COUPONS_FILE, coupons);

    this.addAuditLog({
      couponId: current.id,
      action: 'UPDATE',
      details: `Cupom ${current.code} atualizado (versão v${newVersion}).`,
      changedBy: adminName,
    });

    return { coupon: updated };
  }

  static toggleStatus(id: string, adminName: string = 'Administrador'): { coupon?: Coupon; error?: string } {
    const coupons = this.getAllCoupons();
    const c = coupons.find((item) => item.id === id);
    if (!c) return { error: 'Cupom não encontrado.' };

    const currentStatus = getEffectiveStatus(c);
    let newStatus: CouponStatus = 'ACTIVE';

    if (currentStatus === 'ACTIVE') {
      newStatus = 'PAUSED';
    } else if (currentStatus === 'PAUSED') {
      newStatus = 'ACTIVE';
    } else {
      newStatus = 'ACTIVE';
    }

    return this.updateCoupon(id, { status: newStatus }, adminName);
  }

  static duplicateCoupon(id: string, adminName: string = 'Administrador'): { coupon?: Coupon; error?: string } {
    const original = this.getCouponById(id);
    if (!original) return { error: 'Cupom de origem não encontrado.' };

    const newCode = `${original.code}_COPIA_${Math.floor(10 + Math.random() * 90)}`;
    const duplicateData: Partial<Coupon> = {
      ...original,
      name: `${original.name} (Cópia)`,
      code: newCode,
      internalId: `CAMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'DRAFT',
      startDate: new Date().toISOString(),
    };

    return this.createCoupon(duplicateData, adminName);
  }

  static archiveCoupon(id: string, adminName: string = 'Administrador'): { success: boolean; error?: string } {
    const res = this.updateCoupon(id, { status: 'ARCHIVED' }, adminName);
    if (res.error) return { success: false, error: res.error };
    return { success: true };
  }

  // Cart Validation Engine
  static validateCouponForCart(params: {
    code: string;
    items: CartValidationItem[];
    customerIdentifier?: string; // email or phone
    appliedCoupons?: string[]; // codes of already applied coupons
  }): CouponValidationResult {
    const { code, items, customerIdentifier, appliedCoupons = [] } = params;
    const normalizedCode = (code || '').trim().toUpperCase();

    const coupon = this.getCouponByCode(normalizedCode);
    if (!coupon) {
      return {
        valid: false,
        errorCode: 'NOT_FOUND',
        message: 'Cupom não encontrado. Verifique o código e tente novamente.',
        discountAmount: 0,
        eligibleSubtotal: 0,
        finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
        marketplaceCost: 0,
        sellerCost: 0,
        isFreeShipping: false,
      };
    }

    const currentStatus = getEffectiveStatus(coupon);
    if (currentStatus === 'ARCHIVED' || currentStatus === 'DRAFT') {
      return {
        valid: false,
        errorCode: 'INACTIVE',
        message: 'Este cupom não está disponível.',
        discountAmount: 0,
        eligibleSubtotal: 0,
        finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
        marketplaceCost: 0,
        sellerCost: 0,
        isFreeShipping: false,
      };
    }

    if (currentStatus === 'PAUSED') {
      return {
        valid: false,
        errorCode: 'PAUSED',
        message: 'Este cupom está temporariamente pausado pela administração.',
        discountAmount: 0,
        eligibleSubtotal: 0,
        finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
        marketplaceCost: 0,
        sellerCost: 0,
        isFreeShipping: false,
      };
    }

    if (currentStatus === 'SCHEDULED') {
      const formattedDate = new Date(coupon.startDate).toLocaleDateString('pt-BR');
      return {
        valid: false,
        errorCode: 'SCHEDULED',
        message: `Esta promoção terá início em ${formattedDate}.`,
        discountAmount: 0,
        eligibleSubtotal: 0,
        finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
        marketplaceCost: 0,
        sellerCost: 0,
        isFreeShipping: false,
      };
    }

    if (currentStatus === 'EXPIRED') {
      return {
        valid: false,
        errorCode: 'EXPIRED',
        message: 'Este cupom expirou.',
        discountAmount: 0,
        eligibleSubtotal: 0,
        finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
        marketplaceCost: 0,
        sellerCost: 0,
        isFreeShipping: false,
      };
    }

    if (currentStatus === 'EXHAUSTED') {
      return {
        valid: false,
        errorCode: 'EXHAUSTED',
        message: 'O limite de utilizações deste cupom foi atingido.',
        discountAmount: 0,
        eligibleSubtotal: 0,
        finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
        marketplaceCost: 0,
        sellerCost: 0,
        isFreeShipping: false,
      };
    }

    // Accumulation / Stacking Check
    if (appliedCoupons.length > 0) {
      if (!coupon.canStack) {
        return {
          valid: false,
          errorCode: 'CANNOT_STACK',
          message: `O cupom ${coupon.code} não pode ser acumulado com outros cupons.`,
          discountAmount: 0,
          eligibleSubtotal: 0,
          finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
          marketplaceCost: 0,
          sellerCost: 0,
          isFreeShipping: false,
        };
      }
      // Check existing coupons stacking permission
      for (const existingCode of appliedCoupons) {
        const existing = this.getCouponByCode(existingCode);
        if (existing && !existing.canStack) {
          return {
            valid: false,
            errorCode: 'CANNOT_STACK',
            message: `O cupom ${existing.code} já aplicado não permite acúmulo de descontos.`,
            discountAmount: 0,
            eligibleSubtotal: 0,
            finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
            marketplaceCost: 0,
            sellerCost: 0,
            isFreeShipping: false,
          };
        }
      }
    }

    // Customer Limit Check
    if (customerIdentifier && coupon.usagePerCustomerLimit > 0) {
      const redemptions = this.getAllRedemptions();
      const userRedemptions = redemptions.filter(
        (r) =>
          r.couponId === coupon.id &&
          (r.customerEmail?.toLowerCase() === customerIdentifier.toLowerCase() ||
            r.customerPhone === customerIdentifier)
      );
      if (userRedemptions.length >= coupon.usagePerCustomerLimit) {
        return {
          valid: false,
          errorCode: 'CUSTOMER_LIMIT_REACHED',
          message: `Você já atingiu o limite de utilização deste cupom (${coupon.usagePerCustomerLimit}x por cliente).`,
          discountAmount: 0,
          eligibleSubtotal: 0,
          finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
          marketplaceCost: 0,
          sellerCost: 0,
          isFreeShipping: false,
        };
      }
    }

    // Filter Eligible Items based on Sellers, Products, and Categories
    const eligibleItems = items.filter((item) => {
      // Seller check
      if (coupon.sellerScope === 'SELECTED') {
        if (item.sellerId && !coupon.selectedSellerIds.includes(item.sellerId)) {
          return false;
        }
      }

      // Product check
      if (coupon.productScope === 'SELECTED_PRODUCTS') {
        if (!coupon.selectedProductIds.includes(item.productId)) {
          return false;
        }
      }
      if (coupon.excludedProductIds.includes(item.productId)) {
        return false;
      }

      // Category check
      if (coupon.productScope === 'SELECTED_CATEGORIES') {
        if (item.categoryId && !coupon.selectedCategoryIds.includes(item.categoryId)) {
          return false;
        }
      }
      if (item.categoryId && coupon.excludedCategoryIds.includes(item.categoryId)) {
        return false;
      }

      return true;
    });

    if (eligibleItems.length === 0) {
      return {
        valid: false,
        errorCode: 'NO_ELIGIBLE_ITEMS',
        message: 'Nenhum item do seu carrinho é elegível para este cupom.',
        discountAmount: 0,
        eligibleSubtotal: 0,
        finalTotal: items.reduce((acc, i) => acc + i.price * i.quantity, 0),
        marketplaceCost: 0,
        sellerCost: 0,
        isFreeShipping: false,
      };
    }

    const eligibleSubtotal = eligibleItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Minimum Order Value check
    if (coupon.minOrderValue && eligibleSubtotal < coupon.minOrderValue) {
      const minFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coupon.minOrderValue);
      return {
        valid: false,
        errorCode: 'MIN_ORDER_NOT_MET',
        message: `O valor mínimo em produtos elegíveis para este cupom é de ${minFmt}.`,
        discountAmount: 0,
        eligibleSubtotal,
        finalTotal: cartTotal,
        marketplaceCost: 0,
        sellerCost: 0,
        isFreeShipping: false,
      };
    }

    // Calculate Discount
    let calculatedDiscount = 0;
    let isFreeShipping = false;

    if (coupon.discountType === 'PERCENTAGE') {
      calculatedDiscount = (eligibleSubtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && calculatedDiscount > coupon.maxDiscountAmount) {
        calculatedDiscount = coupon.maxDiscountAmount;
      }
    } else if (coupon.discountType === 'FIXED') {
      calculatedDiscount = Math.min(coupon.discountValue, eligibleSubtotal);
    } else if (coupon.discountType === 'FREE_SHIPPING') {
      isFreeShipping = true;
      calculatedDiscount = 0; // Handled in shipping breakdown
    }

    // Rounding to 2 decimal places
    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    // Financial Budget Check
    if (coupon.financialBudget) {
      const remainingBudget = coupon.financialBudget - coupon.totalDiscountGiven;
      if (remainingBudget <= 0) {
        return {
          valid: false,
          errorCode: 'BUDGET_EXCEEDED',
          message: 'O orçamento financeiro desta campanha foi atingido.',
          discountAmount: 0,
          eligibleSubtotal,
          finalTotal: cartTotal,
          marketplaceCost: 0,
          sellerCost: 0,
          isFreeShipping: false,
        };
      }
      if (calculatedDiscount > remainingBudget) {
        calculatedDiscount = Math.round(remainingBudget * 100) / 100;
      }
    }

    // Split Cost Calculation
    const marketplaceCost = Math.round((calculatedDiscount * (coupon.marketplaceSharePercent / 100)) * 100) / 100;
    const sellerCost = Math.round((calculatedDiscount - marketplaceCost) * 100) / 100;
    const finalTotal = Math.max(0, Math.round((cartTotal - calculatedDiscount) * 100) / 100);

    return {
      valid: true,
      coupon,
      message: `Cupom ${coupon.code} aplicado com sucesso!`,
      discountAmount: calculatedDiscount,
      eligibleSubtotal,
      finalTotal,
      marketplaceCost,
      sellerCost,
      isFreeShipping,
    };
  }

  // Redeem / Confirm usage of coupon
  static redeemCoupon(params: {
    couponCode: string;
    orderId?: string;
    customerName: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    items: CartValidationItem[];
  }): { success: boolean; redemption?: CouponRedemption; error?: string } {
    const val = this.validateCouponForCart({
      code: params.couponCode,
      items: params.items,
      customerIdentifier: params.customerEmail || params.customerPhone || undefined,
    });

    if (!val.valid || !val.coupon) {
      return { success: false, error: val.message || 'Cupom inválido.' };
    }

    const coupon = val.coupon;
    const redemptions = this.getAllRedemptions();
    const newRedemption: CouponRedemption = {
      id: `red-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      couponId: coupon.id,
      couponCode: coupon.code,
      orderId: params.orderId || `ORD-${Date.now()}`,
      customerName: params.customerName || 'Cliente Anônimo',
      customerEmail: params.customerEmail || null,
      customerPhone: params.customerPhone || null,
      subtotal: val.eligibleSubtotal,
      discountAmount: val.discountAmount,
      finalTotal: val.finalTotal,
      marketplaceCost: val.marketplaceCost,
      sellerCost: val.sellerCost,
      itemsCount: params.items.reduce((acc, i) => acc + i.quantity, 0),
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
    };

    redemptions.unshift(newRedemption);
    writeJsonFile(REDEMPTIONS_FILE, redemptions);

    // Update coupon stats
    const coupons = this.getAllCoupons();
    const cIdx = coupons.findIndex((c) => c.id === coupon.id);
    if (cIdx !== -1) {
      coupons[cIdx].usedCount += 1;
      coupons[cIdx].totalDiscountGiven = Math.round((coupons[cIdx].totalDiscountGiven + val.discountAmount) * 100) / 100;
      coupons[cIdx].totalMarketplaceCost = Math.round((coupons[cIdx].totalMarketplaceCost + val.marketplaceCost) * 100) / 100;
      coupons[cIdx].totalSellerCost = Math.round((coupons[cIdx].totalSellerCost + val.sellerCost) * 100) / 100;
      coupons[cIdx].updatedAt = new Date().toISOString();
      writeJsonFile(COUPONS_FILE, coupons);
    }

    // Audit log
    this.addAuditLog({
      couponId: coupon.id,
      action: 'REDEMPTION',
      details: `Resgate realizado no pedido ${newRedemption.orderId} por ${newRedemption.customerName}. Desconto: R$ ${val.discountAmount.toFixed(2)}.`,
      changedBy: 'Checkout Cliente',
    });

    return { success: true, redemption: newRedemption };
  }

  static getAllRedemptions(): CouponRedemption[] {
    return readJsonFile<CouponRedemption[]>(REDEMPTIONS_FILE, SEED_REDEMPTIONS);
  }

  static getAllAuditLogs(): CouponAuditLog[] {
    return readJsonFile<CouponAuditLog[]>(AUDIT_LOGS_FILE, SEED_LOGS);
  }

  static addAuditLog(data: Omit<CouponAuditLog, 'id' | 'createdAt'>) {
    const logs = this.getAllAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      couponId: data.couponId,
      action: data.action,
      details: data.details,
      changedBy: data.changedBy,
      createdAt: new Date().toISOString(),
    });
    writeJsonFile(AUDIT_LOGS_FILE, logs);
  }

  // Dashboard Statistics
  static getDashboardStats(): CouponDashboardStats {
    const coupons = this.getAllCoupons();
    const redemptions = this.getAllRedemptions();

    let totalDiscountGiven = 0;
    let marketplaceCost = 0;
    let sellerCost = 0;
    let expiringSoonCount = 0;
    let nearLimitCount = 0;

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 86400000);

    const counts = {
      DRAFT: 0,
      SCHEDULED: 0,
      ACTIVE: 0,
      PAUSED: 0,
      EXPIRED: 0,
      EXHAUSTED: 0,
      ARCHIVED: 0,
    };

    coupons.forEach((c) => {
      const status = c.status;
      if (counts[status] !== undefined) {
        counts[status] += 1;
      }

      totalDiscountGiven += c.totalDiscountGiven || 0;
      marketplaceCost += c.totalMarketplaceCost || 0;
      sellerCost += c.totalSellerCost || 0;

      // Expiring soon: has end date within 7 days and is currently active
      if (status === 'ACTIVE' && c.endDate) {
        const end = new Date(c.endDate);
        if (end > now && end <= in7Days) {
          expiringSoonCount += 1;
        }
      }

      // Near limit: used >= 80% of totalUsageLimit or budget >= 80%
      if (status === 'ACTIVE') {
        const usageRatio = c.totalUsageLimit ? c.usedCount / c.totalUsageLimit : 0;
        const budgetRatio = c.financialBudget ? c.totalDiscountGiven / c.financialBudget : 0;
        if (usageRatio >= 0.8 || budgetRatio >= 0.8) {
          nearLimitCount += 1;
        }
      }
    });

    const uniqueCustomers = new Set(
      redemptions.map((r) => r.customerEmail || r.customerPhone || r.customerName)
    ).size;

    const topCampaigns = [...coupons]
      .sort((a, b) => b.usedCount - a.usedCount)
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        usedCount: c.usedCount,
        totalDiscount: c.totalDiscountGiven,
        status: c.status,
      }));

    return {
      totalCoupons: coupons.length,
      activeCoupons: counts.ACTIVE,
      scheduledCoupons: counts.SCHEDULED,
      pausedCoupons: counts.PAUSED,
      expiredCoupons: counts.EXPIRED,
      exhaustedCoupons: counts.EXHAUSTED,
      archivedCoupons: counts.ARCHIVED,
      totalRedemptions: redemptions.length,
      uniqueCustomers,
      totalDiscountGiven: Math.round(totalDiscountGiven * 100) / 100,
      marketplaceCost: Math.round(marketplaceCost * 100) / 100,
      sellerCost: Math.round(sellerCost * 100) / 100,
      averageDiscount:
        redemptions.length > 0
          ? Math.round((totalDiscountGiven / redemptions.length) * 100) / 100
          : 0,
      expiringSoonCount,
      nearLimitCount,
      topCampaigns,
    };
  }

  // Available metadata for selectors
  static getAvailableMetadata() {
    return {
      sellers: INITIAL_SELLERS,
      products: INITIAL_PRODUCTS.map((p) => ({
        id: p.id,
        name: p.name,
        ref: p.ref,
        price: p.price,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        categoryName: p.categoryName || p.cat,
      })),
      categories: INITIAL_CATEGORIES,
    };
  }

  // CSV Report Generator
  static generateReportsCsv(): string {
    const coupons = this.getAllCoupons();
    const redemptions = this.getAllRedemptions();

    const headers = [
      'Código',
      'Campanha',
      'Tipo Desconto',
      'Valor',
      'Status',
      'Vigência Início',
      'Vigência Fim',
      'Utilizações',
      'Limite Total',
      'Desconto Total Concedido (R$)',
      'Custo Marketplace (R$)',
      'Custo Vendedores (R$)',
      'Financiador',
      'Versão',
      'Data de Criação',
    ];

    const rows = coupons.map((c) => {
      const typeStr =
        c.discountType === 'PERCENTAGE'
          ? `${c.discountValue}%`
          : c.discountType === 'FIXED'
          ? `R$ ${c.discountValue.toFixed(2)}`
          : 'Frete Grátis';

      const finStr =
        c.financingType === 'MARKETPLACE_100'
          ? '100% Marketplace'
          : c.financingType === 'SELLER_100'
          ? '100% Vendedor'
          : `${c.marketplaceSharePercent}% Mkt / ${c.sellerSharePercent}% Vend`;

      return [
        `"${c.code}"`,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${typeStr}"`,
        c.discountValue,
        `"${c.status}"`,
        `"${new Date(c.startDate).toLocaleDateString('pt-BR')}"`,
        c.endDate ? `"${new Date(c.endDate).toLocaleDateString('pt-BR')}"` : '"Indeterminado"',
        c.usedCount,
        c.totalUsageLimit ?? '"Ilimitado"',
        c.totalDiscountGiven.toFixed(2),
        c.totalMarketplaceCost.toFixed(2),
        c.totalSellerCost.toFixed(2),
        `"${finStr}"`,
        c.version,
        `"${new Date(c.createdAt).toLocaleDateString('pt-BR')}"`,
      ].join(';');
    });

    return [headers.join(';'), ...rows].join('\r\n');
  }
}
