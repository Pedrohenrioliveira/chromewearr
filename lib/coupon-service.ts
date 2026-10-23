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
  CouponVerification,
} from '@/types/coupon';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES } from '@/lib/data';

// Persistent fallback directory
const DATA_DIR = path.join(process.cwd(), 'data');
const COUPONS_FILE = path.join(DATA_DIR, 'coupons.json');
const REDEMPTIONS_FILE = path.join(DATA_DIR, 'coupon_redemptions.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'coupon_audit_logs.json');
const VERIFICATIONS_FILE = path.join(DATA_DIR, 'coupon_verifications.json');

// Ensure directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Initial collections (starting clean without fictitious data)
export const INITIAL_SELLERS: any[] = [];
const SEED_COUPONS: Coupon[] = [];
const SEED_REDEMPTIONS: CouponRedemption[] = [];
const SEED_LOGS: CouponAuditLog[] = [];


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

  // 100% Hard Delete - Permanently removes the coupon and cleans up all its logs and verifications
  static deleteCouponPermanently(id: string): { success: boolean; error?: string } {
    const coupons = readJsonFile<Coupon[]>(COUPONS_FILE, SEED_COUPONS);
    const idx = coupons.findIndex((c) => c.id === id);
    if (idx === -1) {
      return { success: false, error: 'Cupom não encontrado.' };
    }

    const removed = coupons[idx];
    coupons.splice(idx, 1);
    writeJsonFile(COUPONS_FILE, coupons);

    // 100% cleanup: Remove all audit logs associated with this coupon so no unnecessary history remains
    const logs = readJsonFile<CouponAuditLog[]>(AUDIT_LOGS_FILE, SEED_LOGS);
    const filteredLogs = logs.filter((l) => l.couponId !== id);
    writeJsonFile(AUDIT_LOGS_FILE, filteredLogs);

    // Remove any verifications associated with this coupon
    const verifications = readJsonFile<CouponVerification[]>(VERIFICATIONS_FILE, []);
    const filteredVerifications = verifications.filter((v) => v.couponId !== id && v.couponCode !== removed.code);
    writeJsonFile(VERIFICATIONS_FILE, filteredVerifications);

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
    const list = readJsonFile<CouponRedemption[]>(REDEMPTIONS_FILE, SEED_REDEMPTIONS);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static deleteRedemption(id: string): { success: boolean; error?: string } {
    const redemptions = readJsonFile<CouponRedemption[]>(REDEMPTIONS_FILE, []);
    const idx = redemptions.findIndex((r) => r.id === id);
    if (idx === -1) {
      return { success: false, error: 'Registro de resgate não encontrado.' };
    }

    const removed = redemptions[idx];
    redemptions.splice(idx, 1);
    writeJsonFile(REDEMPTIONS_FILE, redemptions);

    // Revert/decrement metrics on the associated coupon
    const coupons = this.getAllCoupons();
    const couponIdx = coupons.findIndex((c) => c.id === removed.couponId || c.code.toUpperCase() === removed.couponCode.toUpperCase());
    if (couponIdx !== -1) {
      const c = coupons[couponIdx];
      c.usedCount = Math.max(0, (c.usedCount || 0) - 1);
      c.totalDiscountGiven = Math.max(0, Math.round(((c.totalDiscountGiven || 0) - (removed.discountAmount || 0)) * 100) / 100);
      c.totalMarketplaceCost = Math.max(0, Math.round(((c.totalMarketplaceCost || 0) - (removed.marketplaceCost || 0)) * 100) / 100);
      c.totalSellerCost = Math.max(0, Math.round(((c.totalSellerCost || 0) - (removed.sellerCost || 0)) * 100) / 100);
      coupons[couponIdx] = c;
      writeJsonFile(COUPONS_FILE, coupons);
    }

    // Add audit log for deleting the redemption
    this.addAuditLog({
      couponId: removed.couponId || 'system',
      action: 'REDEMPTION_DELETED',
      details: `Registro de resgate do cupom ${removed.couponCode} (Pedido: ${removed.orderId || '-'}, Cliente: ${removed.customerName}) foi excluído pelo Administrador.`,
      changedBy: 'Administrador',
    });

    return { success: true };
  }

  static clearAllRedemptions(): { success: boolean; count: number } {
    const redemptions = readJsonFile<CouponRedemption[]>(REDEMPTIONS_FILE, []);
    const count = redemptions.length;
    writeJsonFile(REDEMPTIONS_FILE, []);

    // Reset metrics on coupons for these redemptions
    const coupons = this.getAllCoupons();
    coupons.forEach((c) => {
      c.usedCount = 0;
      c.totalDiscountGiven = 0;
      c.totalMarketplaceCost = 0;
      c.totalSellerCost = 0;
    });
    writeJsonFile(COUPONS_FILE, coupons);

    this.addAuditLog({
      couponId: 'system',
      action: 'REDEMPTIONS_CLEARED',
      details: `Todos os ${count} registros de resgate do relatório foram excluídos pelo Administrador.`,
      changedBy: 'Administrador',
    });

    return { success: true, count };
  }

  static getAllAuditLogs(): CouponAuditLog[] {
    const logs = readJsonFile<CouponAuditLog[]>(AUDIT_LOGS_FILE, SEED_LOGS);
    return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static deleteAuditLog(id: string): { success: boolean } {
    const logs = readJsonFile<CouponAuditLog[]>(AUDIT_LOGS_FILE, []);
    const filtered = logs.filter((l) => l.id !== id);
    writeJsonFile(AUDIT_LOGS_FILE, filtered);
    return { success: true };
  }

  static clearAllAuditLogs(): { success: boolean } {
    writeJsonFile(AUDIT_LOGS_FILE, []);
    return { success: true };
  }

  static addAuditLog(data: Omit<CouponAuditLog, 'id' | 'createdAt'>) {
    const logs = this.getAllAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      couponId: data.couponId,
      couponCode: data.couponCode,
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

  // ==========================================
  // ANTI-FRAUD VERIFICATION SYSTEM
  // ==========================================
  static getAllVerifications(): CouponVerification[] {
    return readJsonFile<CouponVerification[]>(VERIFICATIONS_FILE, []);
  }

  static getVerificationByCode(code: string): CouponVerification | null {
    const normalized = (code || '').trim().toUpperCase();
    const list = this.getAllVerifications();
    return list.find((v) => v.code.toUpperCase() === normalized) || null;
  }

  static createVerification(params: {
    couponCode: string;
    items: CartValidationItem[];
    customerName?: string;
    customerEmail?: string | null;
    customerPhone?: string | null;
    subtotal: number;
    finalTotal: number;
  }): { success: boolean; verification?: CouponVerification; error?: string } {
    const val = this.validateCouponForCart({
      code: params.couponCode,
      items: params.items,
      customerIdentifier: params.customerEmail || params.customerPhone || undefined,
    });

    if (!val.valid || !val.coupon) {
      return { success: false, error: val.message || 'Cupom inválido para esta compra.' };
    }

    const coupon = val.coupon;
    // Generate secure, unique, human-friendly verification code: CW-VFY-XXXXXX
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const verificationCode = `CW-VFY-${randomHex}`;

    const newVerification: CouponVerification = {
      id: `vfy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: verificationCode,
      couponId: coupon.id,
      couponCode: coupon.code,
      couponName: coupon.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: val.discountAmount,
      subtotal: params.subtotal || val.eligibleSubtotal,
      finalTotal: val.finalTotal,
      customerName: params.customerName || 'Cliente Loja WhatsApp',
      customerEmail: params.customerEmail || null,
      customerPhone: params.customerPhone || null,
      items: params.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const list = this.getAllVerifications();
    list.unshift(newVerification);
    writeJsonFile(VERIFICATIONS_FILE, list);

    return { success: true, verification: newVerification };
  }

  static confirmVerification(code: string, adminName: string = 'Administrador'): { success: boolean; verification?: CouponVerification; error?: string } {
    const normalized = (code || '').trim().toUpperCase();
    const list = this.getAllVerifications();
    const idx = list.findIndex((v) => v.code.toUpperCase() === normalized);
    if (idx === -1) {
      return { success: false, error: 'Código de verificação não encontrado no sistema.' };
    }

    const vfy = list[idx];
    if (vfy.status === 'CONFIRMED') {
      return {
        success: false,
        error: `Este cupom já foi confirmado anteriormente em ${new Date(vfy.confirmedAt || '').toLocaleString('pt-BR')} por ${vfy.confirmedBy || 'Administrador'}.`,
      };
    }
    if (vfy.status === 'CANCELLED') {
      return { success: false, error: 'Este código de verificação foi cancelado e não pode mais ser utilizado.' };
    }

    // Now officially redeem the coupon! This is what increments usedCount and tracks financials!
    const redeemRes = this.redeemCoupon({
      couponCode: vfy.couponCode,
      customerName: vfy.customerName,
      customerEmail: vfy.customerEmail,
      customerPhone: vfy.customerPhone,
      items: vfy.items.map((i, index) => ({
        id: `item-${index}`,
        productId: `prod-${index}`,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });

    if (!redeemRes.success) {
      return { success: false, error: redeemRes.error || 'Erro ao registrar resgate do cupom.' };
    }

    // Update verification record
    vfy.status = 'CONFIRMED';
    vfy.confirmedAt = new Date().toISOString();
    vfy.confirmedBy = adminName;
    list[idx] = vfy;
    writeJsonFile(VERIFICATIONS_FILE, list);

    this.addAuditLog({
      couponId: vfy.couponId,
      action: 'VERIFICATION_CONFIRMED',
      details: `Código ${vfy.code} (Cupom ${vfy.couponCode}) verificado e confirmado via WhatsApp para ${vfy.customerName}. Desconto: R$ ${vfy.discountAmount.toFixed(2)}.`,
      changedBy: adminName,
    });

    return { success: true, verification: vfy };
  }

  static cancelVerification(code: string, adminName: string = 'Administrador'): { success: boolean; verification?: CouponVerification; error?: string } {
    const normalized = (code || '').trim().toUpperCase();
    const list = this.getAllVerifications();
    const idx = list.findIndex((v) => v.code.toUpperCase() === normalized);
    if (idx === -1) {
      return { success: false, error: 'Código de verificação não encontrado.' };
    }

    const vfy = list[idx];
    if (vfy.status === 'CONFIRMED') {
      return { success: false, error: 'Não é possível cancelar um cupom que já foi confirmado e utilizado.' };
    }

    vfy.status = 'CANCELLED';
    vfy.cancelledAt = new Date().toISOString();
    list[idx] = vfy;
    writeJsonFile(VERIFICATIONS_FILE, list);

    this.addAuditLog({
      couponId: vfy.couponId,
      action: 'STATUS_CHANGE',
      details: `Código de verificação ${vfy.code} (Cupom ${vfy.couponCode}) foi cancelado pelo Administrador.`,
      changedBy: adminName,
    });

    return { success: true, verification: vfy };
  }
}
