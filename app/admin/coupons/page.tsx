'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Coupon,
  CouponStatus,
  CouponDiscountType,
  SellerScope,
  ProductScope,
  FinancingType,
  CouponDashboardStats,
  CouponRedemption,
  CouponAuditLog,
} from '@/types/coupon';
import { formatCurrency } from '@/lib/utils';

function CouponsAdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const [activeTab, setActiveTab] = useState<'overview' | 'manage' | 'create' | 'reports' | 'history'>(
    (initialTab as any) || 'overview'
  );

  // Synchronize activeTab with URL
  const changeTab = (tab: 'overview' | 'manage' | 'create' | 'reports' | 'history') => {
    setActiveTab(tab);
    router.replace(`/admin/coupons?tab=${tab}`);
  };

  // Main Data States
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponDashboardStats | null>(null);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [auditLogs, setAuditLogs] = useState<CouponAuditLog[]>([]);
  const [metadata, setMetadata] = useState<{ sellers: any[]; products: any[]; categories: any[] }>({
    sellers: [],
    products: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters State for Manage Tab
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [financingFilter, setFinancingFilter] = useState<string>('ALL');

  // Modal Detail State
  const [selectedCouponDetails, setSelectedCouponDetails] = useState<Coupon | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form State for Create / Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const initialFormState = {
    code: '',
    name: '',
    description: '',
    internalId: '',
    discountType: 'PERCENTAGE' as CouponDiscountType,
    discountValue: 10,
    maxDiscountAmount: '' as string | number,
    minOrderValue: '' as string | number,
    subtotalEligible: true,
    canStack: false,
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    noEndDate: false,
    status: 'ACTIVE' as CouponStatus,
    sellerScope: 'ALL' as SellerScope,
    selectedSellerIds: [] as string[],
    productScope: 'ALL' as ProductScope,
    selectedProductIds: [] as string[],
    excludedProductIds: [] as string[],
    selectedCategoryIds: [] as string[],
    excludedCategoryIds: [] as string[],
    totalUsageLimit: '' as string | number,
    isUnlimitedUsage: false,
    usagePerCustomerLimit: 1,
    usagePerOrderLimit: 1,
    financialBudget: '' as string | number,
    financingType: 'MARKETPLACE_100' as FinancingType,
    marketplaceSharePercent: 100,
    sellerSharePercent: 0,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Simulation State in Create / Edit Form
  const [simulationCartValue, setSimulationCartValue] = useState<number>(200);

  // Load all coupons and metadata
  const fetchData = async () => {
    setLoading(true);
    try {
      const [couponsRes, metaRes, reportsRes] = await Promise.all([
        fetch('/api/coupons'),
        fetch('/api/coupons/metadata'),
        fetch('/api/coupons/reports'),
      ]);

      if (couponsRes.ok) {
        const data = await couponsRes.json();
        setCoupons(data.coupons || []);
        setStats(data.stats || null);
      }

      if (metaRes.ok) {
        const meta = await metaRes.json();
        setMetadata(meta);
      }

      if (reportsRes.ok) {
        const rep = await reportsRes.json();
        setRedemptions(rep.redemptions || []);
      }
    } catch (err) {
      console.error('Erro ao carregar cupons:', err);
      showFeedback('error', 'Erro ao carregar dados de cupons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Generate random promotional code
  const handleGenerateCode = () => {
    const prefixes = ['CHROME', 'CW', 'VERAO', 'SANCTUM', 'SPECIAL', 'PROMO', 'VIP'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(10 + Math.random() * 90);
    setFormData((prev) => ({
      ...prev,
      code: `${prefix}${number}`,
    }));
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCoupon(true);

    try {
      const userStored = localStorage.getItem('chromewear_user');
      let adminName = 'Administrador';
      if (userStored) {
        try {
          adminName = JSON.parse(userStored).name || 'Administrador';
        } catch (e) {}
      }

      const payload = {
        ...formData,
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : null,
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
        endDate: formData.noEndDate || !formData.endDate ? null : new Date(formData.endDate).toISOString(),
        startDate: new Date(formData.startDate).toISOString(),
        totalUsageLimit: formData.isUnlimitedUsage || !formData.totalUsageLimit ? null : Number(formData.totalUsageLimit),
        financialBudget: formData.financialBudget ? Number(formData.financialBudget) : null,
        adminName,
      };

      const url = isEditing && editingId ? `/api/coupons/${editingId}` : '/api/coupons';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showFeedback('error', data.error || 'Erro ao salvar cupom.');
        return;
      }

      showFeedback('success', isEditing ? 'Cupom atualizado com sucesso!' : 'Cupom criado com sucesso!');
      setFormData(initialFormState);
      setIsEditing(false);
      setEditingId(null);
      await fetchData();
      changeTab('manage');
    } catch (err) {
      showFeedback('error', 'Falha na conexão ao salvar o cupom.');
    } finally {
      setSavingCoupon(false);
    }
  };

  // Start Editing Coupon
  const handleEditClick = (coupon: Coupon) => {
    setIsEditing(true);
    setEditingId(coupon.id);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      internalId: coupon.internalId || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      minOrderValue: coupon.minOrderValue || '',
      subtotalEligible: coupon.subtotalEligible,
      canStack: coupon.canStack,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : '',
      endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : '',
      noEndDate: !coupon.endDate,
      status: coupon.status,
      sellerScope: coupon.sellerScope,
      selectedSellerIds: coupon.selectedSellerIds || [],
      productScope: coupon.productScope,
      selectedProductIds: coupon.selectedProductIds || [],
      excludedProductIds: coupon.excludedProductIds || [],
      selectedCategoryIds: coupon.selectedCategoryIds || [],
      excludedCategoryIds: coupon.excludedCategoryIds || [],
      totalUsageLimit: coupon.totalUsageLimit || '',
      isUnlimitedUsage: coupon.totalUsageLimit === null,
      usagePerCustomerLimit: coupon.usagePerCustomerLimit || 1,
      usagePerOrderLimit: coupon.usagePerOrderLimit || 1,
      financialBudget: coupon.financialBudget || '',
      financingType: coupon.financingType,
      marketplaceSharePercent: coupon.marketplaceSharePercent,
      sellerSharePercent: coupon.sellerSharePercent,
    });
    changeTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle Active / Paused
  const handleToggleStatus = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showFeedback('error', data.error || 'Erro ao alterar status.');
        return;
      }
      showFeedback('success', `Status do cupom alterado para ${data.status}.`);
      fetchData();
    } catch (e) {
      showFeedback('error', 'Erro ao alterar status.');
    }
  };

  // Duplicate Coupon
  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/coupons/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        showFeedback('error', data.error || 'Erro ao duplicar.');
        return;
      }
      showFeedback('success', `Cupom duplicado com sucesso como "${data.code}"!`);
      fetchData();
    } catch (e) {
      showFeedback('error', 'Erro ao duplicar cupom.');
    }
  };

  // Archive Coupon
  const handleArchive = async (id: string, code: string) => {
    if (!window.confirm(`Tem certeza que deseja arquivar o cupom ${code}? Ele não poderá mais ser utilizado.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showFeedback('error', data.error || 'Erro ao arquivar.');
        return;
      }
      showFeedback('success', `Cupom ${code} arquivado.`);
      fetchData();
    } catch (e) {
      showFeedback('error', 'Erro ao arquivar cupom.');
    }
  };

  // Open Details Modal
  const handleOpenDetails = async (coupon: Coupon) => {
    setSelectedCouponDetails(coupon);
    setIsDetailModalOpen(true);
    try {
      const res = await fetch(`/api/coupons/${coupon.id}`);
      if (res.ok) {
        const fullData = await res.json();
        setSelectedCouponDetails(fullData.coupon);
        setAuditLogs(fullData.auditLogs || []);
      }
    } catch (e) {}
  };

  // Filtered coupons for management table
  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const matchesSearch =
        searchFilter === '' ||
        c.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
        c.name.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || c.discountType === typeFilter;
      const matchesFinancing = financingFilter === 'ALL' || c.financingType === financingFilter;

      return matchesSearch && matchesStatus && matchesType && matchesFinancing;
    });
  }, [coupons, searchFilter, statusFilter, typeFilter, financingFilter]);

  // Simulation calculations
  const simulationResults = useMemo(() => {
    const rawVal = simulationCartValue || 0;
    let disc = 0;
    if (formData.discountType === 'PERCENTAGE') {
      disc = (rawVal * formData.discountValue) / 100;
      if (formData.maxDiscountAmount && disc > Number(formData.maxDiscountAmount)) {
        disc = Number(formData.maxDiscountAmount);
      }
    } else if (formData.discountType === 'FIXED') {
      disc = Math.min(rawVal, Number(formData.discountValue));
    } else if (formData.discountType === 'FREE_SHIPPING') {
      disc = 25.00; // Standard simulated shipping
    }

    disc = Math.round(disc * 100) / 100;
    const mktShare = (disc * (formData.marketplaceSharePercent / 100));
    const sellerShare = disc - mktShare;
    const customerPays = Math.max(0, rawVal - disc);

    return {
      discount: disc,
      mktCost: Math.round(mktShare * 100) / 100,
      sellerCost: Math.round(sellerShare * 100) / 100,
      customerPays: Math.round(customerPays * 100) / 100,
    };
  }, [formData, simulationCartValue]);

  // Status Badge Helper
  const renderStatusBadge = (status: CouponStatus) => {
    const styles: Record<CouponStatus, string> = {
      ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold',
      SCHEDULED: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold',
      PAUSED: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold',
      EXPIRED: 'bg-gray-100 text-gray-600 border-gray-300',
      EXHAUSTED: 'bg-orange-50 text-orange-700 border-orange-300 font-semibold',
      ARCHIVED: 'bg-red-50 text-red-700 border-red-200 line-through',
      DRAFT: 'bg-slate-100 text-slate-700 border-slate-300 border-dashed',
    };

    const labels: Record<CouponStatus, string> = {
      ACTIVE: 'Ativo',
      SCHEDULED: 'Agendado',
      PAUSED: 'Pausado',
      EXPIRED: 'Expirado',
      EXHAUSTED: 'Esgotado',
      ARCHIVED: 'Arquivado',
      DRAFT: 'Rascunho',
    };

    return (
      <span
        className={`px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm inline-flex items-center gap-1 ${
          styles[status] || 'bg-gray-100 text-gray-700'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            status === 'ACTIVE'
              ? 'bg-emerald-500 animate-pulse'
              : status === 'PAUSED'
              ? 'bg-amber-500'
              : status === 'EXHAUSTED'
              ? 'bg-orange-500'
              : 'bg-gray-400'
          }`}
        />
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-5">
      {/* Header Banner - Mobile Friendly */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-6 border-b border-border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display uppercase tracking-widest text-xl sm:text-2xl font-bold text-text-primary">
              Cupons & Promoções
            </h1>
            <span className="text-[10px] bg-primary text-white px-2 py-0.5 uppercase tracking-widest font-semibold">
              Marketplace
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Gestão centralizada de campanhas, limites e rateio de custos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setFormData(initialFormState);
              changeTab('create');
            }}
            className="flex-1 sm:flex-initial min-h-[42px] px-4 sm:px-5 py-2.5 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>+ Criar Cupom</span>
          </button>

          <a
            href="/api/coupons/reports?format=csv"
            className="flex-1 sm:flex-initial min-h-[42px] px-3 sm:px-4 py-2.5 bg-surface-pure hover:bg-surface-off border border-border-hairline text-text-primary text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5"
            title="Exportar planilha completa em CSV"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            <span>Exportar CSV</span>
          </a>
        </div>
      </div>

      {/* Feedback Alert Toast */}
      {feedbackMessage && (
        <div
          className={`p-3.5 text-xs uppercase tracking-wider font-semibold flex items-center justify-between border transition-all animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-[#ba1a1a]/10 text-[#ba1a1a] border-[#ba1a1a]/30'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-lg leading-none font-bold p-1">
            &times;
          </button>
        </div>
      )}

      {/* Navigation Tabs - Touch scrollable on mobile */}
      <div className="flex border-b border-border-hairline gap-1 sm:gap-2 overflow-x-auto text-[11px] sm:text-xs uppercase tracking-wider font-semibold -mx-3 px-3 sm:mx-0 sm:px-0 scroll-smooth">
        <button
          onClick={() => changeTab('overview')}
          className={`pb-3 px-3 transition-colors relative whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Visão Geral
        </button>

        <button
          onClick={() => changeTab('manage')}
          className={`pb-3 px-3 transition-colors relative whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'manage'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <span>Gerenciar Cupons</span>
          <span className="text-[10px] bg-surface-container px-1.5 py-0.2 rounded font-normal text-text-secondary">
            {coupons.length}
          </span>
        </button>

        <button
          onClick={() => changeTab('create')}
          className={`pb-3 px-3 transition-colors relative whitespace-nowrap ${
            activeTab === 'create'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {isEditing ? `Editar: ${formData.code || 'Cupom'}` : '+ Criar Cupom'}
        </button>

        <button
          onClick={() => changeTab('reports')}
          className={`pb-3 px-3 transition-colors relative whitespace-nowrap ${
            activeTab === 'reports'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Relatórios & Resgates
        </button>

        <button
          onClick={() => changeTab('history')}
          className={`pb-3 px-3 transition-colors relative whitespace-nowrap ${
            activeTab === 'history'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Histórico
        </button>
      </div>

      {/* ========================================================
          TAB 1: VISÃO GERAL (DASHBOARD OPERACIONAL & ALERTAS)
          ======================================================== */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Status Volume Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <div className="bg-surface-pure border border-border-hairline p-3 sm:p-4">
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold block mb-1">
                Cadastrados
              </span>
              <span className="text-xl sm:text-2xl font-bold font-display">{stats.totalCoupons}</span>
              <span className="text-[10px] text-text-secondary block mt-0.5">todas as campanhas</span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 p-3 sm:p-4">
              <span className="text-[10px] text-emerald-800 uppercase tracking-widest font-semibold block mb-1">
                Ativos
              </span>
              <span className="text-xl sm:text-2xl font-bold font-display text-emerald-700">{stats.activeCoupons}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">no checkout</span>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-200 p-3 sm:p-4">
              <span className="text-[10px] text-indigo-800 uppercase tracking-widest font-semibold block mb-1">
                Agendados
              </span>
              <span className="text-xl sm:text-2xl font-bold font-display text-indigo-700">{stats.scheduledCoupons}</span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">início futuro</span>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 p-3 sm:p-4">
              <span className="text-[10px] text-amber-800 uppercase tracking-widest font-semibold block mb-1">
                Pausados
              </span>
              <span className="text-xl sm:text-2xl font-bold font-display text-amber-700">{stats.pausedCoupons}</span>
              <span className="text-[10px] text-amber-600 block mt-0.5">manualmente</span>
            </div>

            <div className="bg-orange-50/50 border border-orange-200 p-3 sm:p-4">
              <span className="text-[10px] text-orange-800 uppercase tracking-widest font-semibold block mb-1">
                Esgotados
              </span>
              <span className="text-xl sm:text-2xl font-bold font-display text-orange-700">{stats.exhaustedCoupons}</span>
              <span className="text-[10px] text-orange-600 block mt-0.5">limite / teto</span>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-3 sm:p-4">
              <span className="text-[10px] text-gray-700 uppercase tracking-widest font-semibold block mb-1">
                Expirados
              </span>
              <span className="text-xl sm:text-2xl font-bold font-display text-gray-600">{stats.expiredCoupons}</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">data vencida</span>
            </div>
          </div>

          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-surface-pure border border-border-hairline p-4 sm:p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-secondary uppercase tracking-widest font-bold">
                  Total de Descontos Concedidos
                </span>
                <span className="text-xs bg-surface-off px-2 py-0.5 border border-border-hairline font-mono font-bold">
                  {stats.totalRedemptions} {stats.totalRedemptions === 1 ? 'resgate' : 'resgates'}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-bold font-display text-text-primary">
                  R$ {formatCurrency(stats.totalDiscountGiven)}
                </span>
                <p className="text-[11px] text-text-secondary mt-1">
                  Média de R$ {formatCurrency(stats.averageDiscount)} por pedido
                </p>
              </div>
            </div>

            <div className="bg-surface-pure border border-border-hairline p-4 sm:p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
              <span className="text-[11px] text-text-secondary uppercase tracking-widest font-bold block">
                Financiado pelo Marketplace
              </span>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-bold font-display text-blue-700">
                  R$ {formatCurrency(stats.marketplaceCost)}
                </span>
                <p className="text-[11px] text-text-secondary mt-1">
                  Custo absorvido pela plataforma ({stats.totalDiscountGiven > 0 ? Math.round((stats.marketplaceCost / stats.totalDiscountGiven) * 100) : 100}%)
                </p>
              </div>
            </div>

            <div className="bg-surface-pure border border-border-hairline p-4 sm:p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600" />
              <span className="text-[11px] text-text-secondary uppercase tracking-widest font-bold block">
                Financiado pelos Vendedores
              </span>
              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-bold font-display text-purple-700">
                  R$ {formatCurrency(stats.sellerCost)}
                </span>
                <p className="text-[11px] text-text-secondary mt-1">
                  Descontos deduzidos dos repasses ({stats.totalDiscountGiven > 0 ? Math.round((stats.sellerCost / stats.totalDiscountGiven) * 100) : 0}%)
                </p>
              </div>
            </div>
          </div>

          {/* Highlights & Operational Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Campaigns */}
            <div className="bg-surface-pure border border-border-hairline p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border-hairline mb-4">
                <h3 className="font-display uppercase tracking-widest text-xs sm:text-sm font-bold text-text-primary">
                  Campanhas com Maior Utilização
                </h3>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Top 5</span>
              </div>

              {stats.topCampaigns.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <p className="text-xs">Nenhum cupom utilizado até o momento.</p>
                  <button
                    onClick={() => changeTab('create')}
                    className="mt-2 text-xs font-bold text-primary underline uppercase tracking-wider"
                  >
                    + Criar seu primeiro cupom
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.topCampaigns.map((camp) => {
                    const maxUses = stats.topCampaigns[0]?.usedCount || 1;
                    const percent = Math.min(100, Math.round((camp.usedCount / maxUses) * 100));

                    return (
                      <div key={camp.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-text-primary">{camp.code}</span>
                            <span className="text-text-secondary truncate max-w-[140px] sm:max-w-[200px]">{camp.name}</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="font-semibold">{camp.usedCount} usos</span>
                            <span className="text-text-secondary text-[11px]">R$ {formatCurrency(camp.totalDiscount)}</span>
                          </div>
                        </div>
                        <div className="w-full bg-surface-off h-2 rounded-full overflow-hidden border border-border-hairline">
                          <div className="bg-primary h-full transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Critical Alerts */}
            <div className="bg-surface-pure border border-border-hairline p-4 sm:p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border-hairline mb-4">
                  <h3 className="font-display uppercase tracking-widest text-xs sm:text-sm font-bold text-text-primary">
                    Alertas & Indicadores
                  </h3>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">Monitoramento</span>
                </div>

                <div className="space-y-3">
                  {/* Expiring Soon Alert */}
                  <div
                    className={`p-3 border flex items-start gap-3 ${
                      stats.expiringSoonCount > 0
                        ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                        : 'bg-surface-off border-border-hairline text-text-secondary'
                    }`}
                  >
                    <div className="p-1 rounded bg-amber-200/50 mt-0.5 flex-shrink-0">
                      <svg className="w-4 h-4 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">
                        {stats.expiringSoonCount} {stats.expiringSoonCount === 1 ? 'Campanha Próxima' : 'Campanhas Próximas'} do Vencimento
                      </p>
                      <p className="text-[11px] mt-0.5">
                        {stats.expiringSoonCount > 0
                          ? 'Cupons com expiração programada nos próximos 7 dias.'
                          : 'Nenhum cupom ativo expirando nos próximos 7 dias.'}
                      </p>
                    </div>
                  </div>

                  {/* Near Limit Alert */}
                  <div
                    className={`p-3 border flex items-start gap-3 ${
                      stats.nearLimitCount > 0
                        ? 'bg-orange-50/70 border-orange-300 text-orange-900'
                        : 'bg-surface-off border-border-hairline text-text-secondary'
                    }`}
                  >
                    <div className="p-1 rounded bg-orange-200/50 mt-0.5 flex-shrink-0">
                      <svg className="w-4 h-4 text-orange-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">
                        {stats.nearLimitCount} {stats.nearLimitCount === 1 ? 'Cupom Próximo' : 'Cupons Próximos'} do Limite
                      </p>
                      <p className="text-[11px] mt-0.5">
                        {stats.nearLimitCount > 0
                          ? 'Campanhas que atingiram 80% ou mais do teto de utilizações ou orçamento.'
                          : 'Todas as campanhas ativas possuem saldo saudável.'}
                      </p>
                    </div>
                  </div>

                  {/* Customer Engagement */}
                  <div className="p-3 bg-surface-off border border-border-hairline flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Clientes Únicos
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        Compradores que já usaram cupons
                      </p>
                    </div>
                    <span className="text-xl font-bold font-display">{stats.uniqueCustomers}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border-hairline mt-4">
                <button
                  onClick={() => changeTab('manage')}
                  className="w-full py-2.5 bg-surface-pure hover:bg-surface-off border border-border-hairline text-xs uppercase tracking-wider font-semibold text-text-primary transition-colors text-center"
                >
                  Ver Todos os Cupons &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: GERENCIAR CUPONS (TABELA & CARDS NO CELULAR)
          ======================================================== */}
      {activeTab === 'manage' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-surface-pure border border-border-hairline p-3 sm:p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por código ou nome..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm sm:text-xs bg-surface-off border border-border-hairline focus:outline-none focus:border-primary font-medium"
              />
              <svg className="w-4 h-4 text-text-secondary absolute left-3 top-2.5 sm:top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Dropdown Filters */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-2 text-xs bg-surface-off border border-border-hairline focus:outline-none focus:border-primary"
              >
                <option value="ALL">Status: Todos</option>
                <option value="ACTIVE">Ativo</option>
                <option value="SCHEDULED">Agendado</option>
                <option value="PAUSED">Pausado</option>
                <option value="EXPIRED">Expirado</option>
                <option value="EXHAUSTED">Esgotado</option>
                <option value="ARCHIVED">Arquivado</option>
                <option value="DRAFT">Rascunho</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-2 text-xs bg-surface-off border border-border-hairline focus:outline-none focus:border-primary"
              >
                <option value="ALL">Tipo: Todos</option>
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
                <option value="FREE_SHIPPING">Frete Grátis</option>
              </select>

              <select
                value={financingFilter}
                onChange={(e) => setFinancingFilter(e.target.value)}
                className="col-span-2 sm:col-span-1 w-full sm:w-auto px-2.5 py-2 text-xs bg-surface-off border border-border-hairline focus:outline-none focus:border-primary"
              >
                <option value="ALL">Financiador: Todos</option>
                <option value="MARKETPLACE_100">100% Marketplace</option>
                <option value="SELLER_100">100% Vendedor</option>
                <option value="SHARED">Compartilhado</option>
              </select>

              {(searchFilter || statusFilter !== 'ALL' || typeFilter !== 'ALL' || financingFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchFilter('');
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                    setFinancingFilter('ALL');
                  }}
                  className="col-span-2 sm:col-span-1 py-1 text-xs text-text-secondary hover:text-text-primary underline text-center"
                >
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Empty State */}
          {filteredCoupons.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-surface-pure border border-border-hairline shadow-sm space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-surface-off border border-border-hairline flex items-center justify-center text-text-secondary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="font-display uppercase tracking-widest text-sm font-bold text-text-primary">
                Nenhum cupom cadastrado
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                {searchFilter || statusFilter !== 'ALL' || typeFilter !== 'ALL' || financingFilter !== 'ALL'
                  ? 'Nenhum cupom corresponde aos filtros aplicados.'
                  : 'Crie seu primeiro cupom de desconto para os clientes utilizarem no carrinho e finalizar no WhatsApp!'}
              </p>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData(initialFormState);
                  changeTab('create');
                }}
                className="mt-2 min-h-[42px] px-5 py-2.5 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-bold transition-all shadow-sm inline-flex items-center gap-2"
              >
                <span>+ Criar Primeiro Cupom</span>
              </button>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW: Touch-Friendly Card List (Visible only on mobile/tablet screens < 768px) */}
              <div className="md:hidden space-y-3">
                {filteredCoupons.map((c) => {
                  const usagePercent = c.totalUsageLimit
                    ? Math.min(100, Math.round((c.usedCount / c.totalUsageLimit) * 100))
                    : null;

                  return (
                    <div key={c.id} className="bg-surface-pure border border-border-hairline p-4 shadow-sm space-y-3">
                      {/* Card Header: Code & Status Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm bg-surface-off px-2.5 py-1 border border-border-hairline tracking-wider">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(c.code)}
                            className="p-1.5 text-text-secondary hover:text-primary active:scale-95 transition-transform"
                            aria-label="Copiar código"
                          >
                            {copiedCode === c.code ? (
                              <span className="text-[10px] text-emerald-600 font-bold">Copiado!</span>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                              </svg>
                            )}
                          </button>
                        </div>
                        <div>{renderStatusBadge(c.status)}</div>
                      </div>

                      {/* Campaign Name */}
                      <div>
                        <p className="font-bold text-text-primary text-sm">{c.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-text-secondary">v{c.version}</span>
                          {c.canStack && (
                            <span className="text-[9px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.2 rounded">
                              Cumulativo
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 2-Column Info Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-surface-off p-3 border border-border-hairline">
                        <div>
                          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">
                            Desconto
                          </span>
                          <span className="font-bold text-text-primary">
                            {c.discountType === 'PERCENTAGE'
                              ? `${c.discountValue}% OFF`
                              : c.discountType === 'FIXED'
                              ? `R$ ${formatCurrency(c.discountValue)} OFF`
                              : 'Frete Grátis'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">
                            Utilizações
                          </span>
                          <span className="font-bold text-text-primary">
                            {c.usedCount} {c.totalUsageLimit ? `/ ${c.totalUsageLimit}` : '(ilimitado)'}
                          </span>
                          {usagePercent !== null && (
                            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${usagePercent >= 90 ? 'bg-orange-500' : 'bg-primary'}`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">
                            Vigência
                          </span>
                          <span className="text-[11px] text-text-primary">
                            {new Date(c.startDate).toLocaleDateString('pt-BR')} até{' '}
                            {c.endDate ? new Date(c.endDate).toLocaleDateString('pt-BR') : 'Indeterminado'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-text-secondary uppercase tracking-wider block font-semibold">
                            Financiador
                          </span>
                          <span className="text-[11px] font-medium text-text-primary">
                            {c.financingType === 'MARKETPLACE_100'
                              ? '100% Marketplace'
                              : c.financingType === 'SELLER_100'
                              ? '100% Vendedor'
                              : `${c.marketplaceSharePercent}% Mkt / ${c.sellerSharePercent}% Vend`}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Touch Action Buttons Bar */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-border-hairline text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(c)}
                          className="flex-1 min-h-[38px] px-2 bg-surface-off hover:bg-surface-container border border-border-hairline rounded text-center text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                        >
                          Detalhes
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c.id)}
                          className={`flex-1 min-h-[38px] px-2 border rounded text-center transition-colors flex items-center justify-center ${
                            c.status === 'PAUSED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {c.status === 'PAUSED' ? 'Ativar' : 'Pausar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditClick(c)}
                          className="flex-1 min-h-[38px] px-2 bg-surface-off hover:bg-surface-container border border-border-hairline rounded text-center text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(c.id)}
                          className="min-h-[38px] px-3 bg-surface-off hover:bg-surface-container border border-border-hairline rounded text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
                          title="Duplicar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                          </svg>
                        </button>

                        {c.status !== 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => handleArchive(c.id, c.code)}
                            className="min-h-[38px] px-3 text-[#ba1a1a] bg-red-50 hover:bg-red-100 border border-red-200 rounded transition-colors flex items-center justify-center"
                            title="Arquivar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP VIEW: Full Data Table (Visible on screens >= 768px) */}
              <div className="hidden md:block bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-off border-b border-border-hairline text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                      <th className="p-3">Código & Campanha</th>
                      <th className="p-3">Desconto</th>
                      <th className="p-3">Vigência</th>
                      <th className="p-3">Utilizações</th>
                      <th className="p-3">Custo Total</th>
                      <th className="p-3">Financiador</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-hairline">
                    {filteredCoupons.map((c) => {
                      const usagePercent = c.totalUsageLimit
                        ? Math.min(100, Math.round((c.usedCount / c.totalUsageLimit) * 100))
                        : null;

                      return (
                        <tr key={c.id} className="hover:bg-surface-off/60 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm bg-surface-off px-2 py-0.5 border border-border-hairline tracking-wider">
                                {c.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(c.code)}
                                className="text-text-secondary hover:text-primary p-1"
                                title="Copiar código"
                              >
                                {copiedCode === c.code ? (
                                  <span className="text-[10px] text-emerald-600 font-bold">Copiado!</span>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                                  </svg>
                                )}
                              </button>
                            </div>
                            <p className="font-medium text-text-primary text-xs mt-1">{c.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-text-secondary font-mono">v{c.version}</span>
                              {c.canStack && (
                                <span className="text-[9px] bg-blue-50 text-blue-700 px-1 font-semibold rounded">
                                  Cumulativo
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3">
                            <span className="font-bold text-text-primary text-xs">
                              {c.discountType === 'PERCENTAGE'
                                ? `${c.discountValue}% OFF`
                                : c.discountType === 'FIXED'
                                ? `R$ ${formatCurrency(c.discountValue)} OFF`
                                : 'Frete Grátis'}
                            </span>
                            {c.discountType === 'PERCENTAGE' && c.maxDiscountAmount && (
                              <p className="text-[10px] text-text-secondary">
                                Teto: R$ {formatCurrency(c.maxDiscountAmount)}
                              </p>
                            )}
                            {c.minOrderValue && (
                              <p className="text-[10px] text-text-secondary">
                                Mín: R$ {formatCurrency(c.minOrderValue)}
                              </p>
                            )}
                          </td>

                          <td className="p-3 text-[11px]">
                            <div>De: {new Date(c.startDate).toLocaleDateString('pt-BR')}</div>
                            <div className="text-text-secondary">
                              {c.endDate ? `Até: ${new Date(c.endDate).toLocaleDateString('pt-BR')}` : 'Indeterminado'}
                            </div>
                          </td>

                          <td className="p-3">
                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                              <span>{c.usedCount}</span>
                              <span className="text-text-secondary text-[10px]">
                                {c.totalUsageLimit ? `/ ${c.totalUsageLimit}` : 'ilimitado'}
                              </span>
                            </div>
                            {usagePercent !== null && (
                              <div className="w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${usagePercent >= 90 ? 'bg-orange-500' : 'bg-primary'}`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            )}
                          </td>

                          <td className="p-3 font-semibold text-text-primary">
                            R$ {formatCurrency(c.totalDiscountGiven)}
                            {c.financialBudget && (
                              <p className="text-[10px] text-text-secondary font-normal">
                                Teto: R$ {formatCurrency(c.financialBudget)}
                              </p>
                            )}
                          </td>

                          <td className="p-3 text-[11px]">
                            {c.financingType === 'MARKETPLACE_100' && (
                              <span className="text-blue-700 font-medium">100% Plataforma</span>
                            )}
                            {c.financingType === 'SELLER_100' && (
                              <span className="text-purple-700 font-medium">100% Vendedor</span>
                            )}
                            {c.financingType === 'SHARED' && (
                              <span className="text-indigo-700 font-medium">
                                {c.marketplaceSharePercent}% / {c.sellerSharePercent}%
                              </span>
                            )}
                          </td>

                          <td className="p-3">{renderStatusBadge(c.status)}</td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenDetails(c)}
                                className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-container rounded"
                                title="Ver detalhes"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>

                              <button
                                onClick={() => handleToggleStatus(c.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  c.status === 'PAUSED'
                                    ? 'text-emerald-700 hover:bg-emerald-50'
                                    : 'text-amber-700 hover:bg-amber-50'
                                }`}
                                title={c.status === 'PAUSED' ? 'Ativar cupom' : 'Pausar cupom'}
                              >
                                {c.status === 'PAUSED' ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                )}
                              </button>

                              <button
                                onClick={() => handleDuplicate(c.id)}
                                className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-container rounded"
                                title="Duplicar regras"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                              </button>

                              <button
                                onClick={() => handleEditClick(c)}
                                className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-container rounded"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {c.status !== 'ARCHIVED' && (
                                <button
                                  onClick={() => handleArchive(c.id, c.code)}
                                  className="p-1.5 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded"
                                  title="Arquivar"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: CRIAR / EDITAR CUPOM (WIZARD & SIMULADOR)
          ======================================================== */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmitForm} className="space-y-6 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="font-display uppercase tracking-widest text-sm sm:text-base font-bold text-text-primary">
                {isEditing ? `Editando Cupom: ${formData.code}` : 'Novo Cadastro de Cupom & Promoção'}
              </h2>
              <p className="text-xs text-text-secondary">
                Configure os parâmetros de validação, vigência e partilha de custos.
              </p>
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormData(initialFormState);
                }}
                className="text-xs text-text-secondary hover:text-text-primary underline uppercase tracking-wider"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Inputs (Left 2 columns on desktop) */}
            <div className="lg:col-span-2 space-y-5">
              {/* Section 1: Informações Básicas */}
              <div className="bg-surface-pure border border-border-hairline p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Informações Básicas</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Nome Interno da Campanha *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Campanha de Inverno"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                        Código do Cupom * (MAIÚSCULAS)
                      </label>
                      <button
                        type="button"
                        onClick={handleGenerateCode}
                        className="text-[10px] text-primary hover:underline uppercase font-bold"
                      >
                        Gerar Código
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex: PROMO10"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs font-mono font-bold uppercase tracking-wider bg-surface-off focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                    Descrição da Promoção (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descrição sobre a intenção da campanha, regras ou canal de divulgação."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Identificador Interno
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CAMP-2026-01"
                      value={formData.internalId}
                      onChange={(e) => setFormData({ ...formData, internalId: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Status Inicial
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as CouponStatus })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary"
                    >
                      <option value="ACTIVE">Ativo (Pronto para Uso)</option>
                      <option value="DRAFT">Rascunho (Em Configuração)</option>
                      <option value="PAUSED">Pausado (Inativo)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Tipo de Desconto & Parâmetros */}
              <div className="bg-surface-pure border border-border-hairline p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Tipo de Desconto & Regras</h3>
                </div>

                {/* Modality Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.discountType === 'PERCENTAGE'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider">Percentual</span>
                      <input
                        type="radio"
                        name="discountType"
                        value="PERCENTAGE"
                        checked={formData.discountType === 'PERCENTAGE'}
                        onChange={() => setFormData({ ...formData, discountType: 'PERCENTAGE' })}
                        className="accent-primary"
                      />
                    </div>
                    <span className="text-[11px]">Ex: 10%, 15% OFF no valor dos produtos.</span>
                  </label>

                  <label
                    className={`p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.discountType === 'FIXED'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider">Valor Fixo</span>
                      <input
                        type="radio"
                        name="discountType"
                        value="FIXED"
                        checked={formData.discountType === 'FIXED'}
                        onChange={() => setFormData({ ...formData, discountType: 'FIXED' })}
                        className="accent-primary"
                      />
                    </div>
                    <span className="text-[11px]">Ex: R$ 30, R$ 50 de desconto imediato.</span>
                  </label>

                  <label
                    className={`p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.discountType === 'FREE_SHIPPING'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider">Frete Grátis</span>
                      <input
                        type="radio"
                        name="discountType"
                        value="FREE_SHIPPING"
                        checked={formData.discountType === 'FREE_SHIPPING'}
                        onChange={() => setFormData({ ...formData, discountType: 'FREE_SHIPPING' })}
                        className="accent-primary"
                      />
                    </div>
                    <span className="text-[11px]">Isenção do frete na entrega.</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Discount Value */}
                  {formData.discountType !== 'FREE_SHIPPING' && (
                    <div>
                      <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                        {formData.discountType === 'PERCENTAGE' ? 'Percentual de Desconto (%) *' : 'Valor do Desconto (R$) *'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                        className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs font-bold bg-surface-off focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Max Discount Ceiling for Percentage */}
                  {formData.discountType === 'PERCENTAGE' && (
                    <div>
                      <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                        Teto Máximo de Desconto (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Opcional (ex: 100)"
                        value={formData.maxDiscountAmount}
                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                        className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}

                  {/* Minimum Order Value */}
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Valor Mínimo do Pedido (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Opcional (ex: 150)"
                      value={formData.minOrderValue}
                      onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Stacking / Accumulation Rule */}
                <div className="pt-3 border-t border-border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-off p-3.5">
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      Permitir Acúmulo com Outros Cupons
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Permite que o cliente use este cupom somado a outro cupom cumulativo na mesma compra.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.canStack}
                      onChange={(e) => setFormData({ ...formData, canStack: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              {/* Section 3: Vigência e Datas */}
              <div className="bg-surface-pure border border-border-hairline p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">3</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Vigência & Agendamento</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Data & Hora de Início *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                        Data & Hora de Término
                      </label>
                      <label className="flex items-center gap-1.5 text-[10px] text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.noEndDate}
                          onChange={(e) => setFormData({ ...formData, noEndDate: e.target.checked })}
                          className="accent-primary"
                        />
                        <span>Sem data final</span>
                      </label>
                    </div>
                    <input
                      type="datetime-local"
                      disabled={formData.noEndDate}
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Vendedores Participantes (Multi-vendor) */}
              <div className="bg-surface-pure border border-border-hairline p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">4</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Vendedores Participantes</h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sellerScope"
                      checked={formData.sellerScope === 'ALL'}
                      onChange={() => setFormData({ ...formData, sellerScope: 'ALL', selectedSellerIds: [] })}
                      className="accent-primary"
                    />
                    <span className="font-semibold">Todos os Vendedores Aprovados</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sellerScope"
                      checked={formData.sellerScope === 'SELECTED'}
                      onChange={() => setFormData({ ...formData, sellerScope: 'SELECTED' })}
                      className="accent-primary"
                    />
                    <span className="font-semibold">Apenas Vendedores Selecionados</span>
                  </label>
                </div>

                {formData.sellerScope === 'SELECTED' && (
                  <div className="p-3 bg-surface-off border border-border-hairline space-y-2">
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold block">
                      Vendedores Cadastrados:
                    </span>
                    {metadata.sellers.length === 0 ? (
                      <p className="text-xs text-text-secondary py-2">
                        Nenhum vendedor parceiro registrado no momento (os cupons abrangem a loja principal).
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {metadata.sellers.map((s) => {
                          const isChecked = formData.selectedSellerIds.includes(s.id);
                          return (
                            <label key={s.id} className="flex items-center gap-2 text-xs p-1.5 hover:bg-white rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData({ ...formData, selectedSellerIds: [...formData.selectedSellerIds, s.id] });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      selectedSellerIds: formData.selectedSellerIds.filter((id) => id !== s.id),
                                    });
                                  }
                                }}
                                className="accent-primary"
                              />
                              <span className="truncate">{s.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Section 5: Limites de Utilização */}
              <div className="bg-surface-pure border border-border-hairline p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">5</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Limites & Orçamento</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Total Limit */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                        Limite Total de Usos
                      </label>
                      <label className="flex items-center gap-1 text-[10px] text-text-secondary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isUnlimitedUsage}
                          onChange={(e) => setFormData({ ...formData, isUnlimitedUsage: e.target.checked })}
                          className="accent-primary"
                        />
                        <span>Ilimitado</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      min="1"
                      disabled={formData.isUnlimitedUsage}
                      placeholder="Ex: 500"
                      value={formData.totalUsageLimit}
                      onChange={(e) => setFormData({ ...formData, totalUsageLimit: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary disabled:opacity-40"
                    />
                  </div>

                  {/* Limit per Customer */}
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Limite por Cliente *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.usagePerCustomerLimit}
                      onChange={(e) => setFormData({ ...formData, usagePerCustomerLimit: Number(e.target.value) })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary"
                    />
                  </div>

                  {/* Financial Budget Cap */}
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Orçamento Máximo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Opcional (ex: 5000)"
                      value={formData.financialBudget}
                      onChange={(e) => setFormData({ ...formData, financialBudget: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-sm sm:text-xs bg-surface-off focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Rateio Financeiro */}
              <div className="bg-surface-pure border border-border-hairline p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">6</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Rateio de Custos</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.financingType === 'MARKETPLACE_100'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider">100% Marketplace</span>
                      <input
                        type="radio"
                        name="financingType"
                        value="MARKETPLACE_100"
                        checked={formData.financingType === 'MARKETPLACE_100'}
                        onChange={() => setFormData({ ...formData, financingType: 'MARKETPLACE_100', marketplaceSharePercent: 100, sellerSharePercent: 0 })}
                        className="accent-primary"
                      />
                    </div>
                    <span className="text-[11px]">A plataforma absorve integralmente o desconto.</span>
                  </label>

                  <label
                    className={`p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.financingType === 'SELLER_100'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider">100% Vendedor</span>
                      <input
                        type="radio"
                        name="financingType"
                        value="SELLER_100"
                        checked={formData.financingType === 'SELLER_100'}
                        onChange={() => setFormData({ ...formData, financingType: 'SELLER_100', marketplaceSharePercent: 0, sellerSharePercent: 100 })}
                        className="accent-primary"
                      />
                    </div>
                    <span className="text-[11px]">O vendedor financia todo o desconto concedido.</span>
                  </label>

                  <label
                    className={`p-3 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.financingType === 'SHARED'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider">Compartilhado</span>
                      <input
                        type="radio"
                        name="financingType"
                        value="SHARED"
                        checked={formData.financingType === 'SHARED'}
                        onChange={() => setFormData({ ...formData, financingType: 'SHARED', marketplaceSharePercent: 50, sellerSharePercent: 50 })}
                        className="accent-primary"
                      />
                    </div>
                    <span className="text-[11px]">Divisão percentual entre as partes.</span>
                  </label>
                </div>

                {/* Shared split slider */}
                {formData.financingType === 'SHARED' && (
                  <div className="p-3.5 bg-surface-off border border-border-hairline space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>Marketplace: {formData.marketplaceSharePercent}%</span>
                      <span>Vendedor: {formData.sellerSharePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.marketplaceSharePercent}
                      onChange={(e) => {
                        const mkt = Number(e.target.value);
                        setFormData({
                          ...formData,
                          marketplaceSharePercent: mkt,
                          sellerSharePercent: 100 - mkt,
                        });
                      }}
                      className="w-full accent-primary cursor-pointer h-2"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Financial Simulator & Actions */}
            <div className="space-y-5">
              <div className="bg-surface-pure border border-border-hairline p-4 sm:p-5 shadow-sm lg:sticky lg:top-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-display uppercase tracking-widest text-xs font-bold text-text-primary">
                      Simulador em Tempo Real
                    </h3>
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase">Prévia</span>
                </div>

                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                    Valor Simulado do Pedido (R$)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={simulationCartValue}
                    onChange={(e) => setSimulationCartValue(Number(e.target.value))}
                    className="w-full border border-border-hairline p-2 text-sm sm:text-xs font-mono font-bold bg-surface-off focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="p-3 bg-surface-off border border-border-hairline space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Subtotal Simulado:</span>
                    <span className="font-semibold">R$ {formatCurrency(simulationCartValue)}</span>
                  </div>

                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <span>Desconto Aplicado:</span>
                    <span>- R$ {formatCurrency(simulationResults.discount)}</span>
                  </div>

                  <div className="pt-2 border-t border-border-hairline/80 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-blue-800">
                      <span>Marketplace ({formData.marketplaceSharePercent}%):</span>
                      <span className="font-bold">R$ {formatCurrency(simulationResults.mktCost)}</span>
                    </div>

                    <div className="flex items-center justify-between text-purple-800">
                      <span>Vendedor ({formData.sellerSharePercent}%):</span>
                      <span className="font-bold">R$ {formatCurrency(simulationResults.sellerCost)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-hairline flex items-center justify-between text-sm font-bold text-text-primary">
                    <span>Cliente Paga:</span>
                    <span className="text-base text-primary">R$ {formatCurrency(simulationResults.customerPays)}</span>
                  </div>
                </div>

                {/* Submission Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={savingCoupon}
                    className="w-full min-h-[44px] py-3 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-bold transition-all shadow-sm disabled:opacity-50 flex items-center justify-center"
                  >
                    {savingCoupon ? 'Salvando...' : isEditing ? 'Salvar Alterações (Nova Versão)' : 'Publicar Campanha de Cupom'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingId(null);
                      setFormData(initialFormState);
                      changeTab('manage');
                    }}
                    className="w-full min-h-[40px] py-2 bg-surface-off hover:bg-surface-container text-text-secondary text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center"
                  >
                    Voltar para Lista
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================
          TAB 4: RELATÓRIOS & RESGATES (RESPONSIVO NO CELULAR)
          ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-surface-pure border border-border-hairline p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display uppercase tracking-widest text-sm sm:text-base font-bold text-text-primary">
                Relatório de Resgates
              </h2>
              <p className="text-xs text-text-secondary">
                Acompanhamento analítico de pedidos concluídos com cupons.
              </p>
            </div>

            <a
              href="/api/coupons/reports?format=csv"
              className="w-full sm:w-auto min-h-[40px] px-4 py-2 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Baixar CSV</span>
            </a>
          </div>

          {/* Redemptions Empty State */}
          {redemptions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center bg-surface-pure border border-border-hairline shadow-sm space-y-2">
              <svg className="w-10 h-10 mx-auto text-text-secondary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="font-display uppercase tracking-widest text-sm font-bold text-text-primary">
                Nenhum resgate registrado ainda
              </h3>
              <p className="text-xs text-text-secondary max-w-sm mx-auto">
                Assim que seus clientes aplicarem os cupons criados e finalizarem a compra, os resgates e métricas financeiras aparecerão aqui.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View for Redemptions */}
              <div className="md:hidden space-y-3">
                {redemptions.map((r) => (
                  <div key={r.id} className="bg-surface-pure border border-border-hairline p-4 shadow-sm space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-sm">
                        {r.couponCode}
                      </span>
                      <span className="text-[10px] text-text-secondary font-mono">{r.orderId || '-'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-text-primary">{r.customerName}</span>
                      <span className="text-text-secondary text-[10px]">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-surface-off p-2.5 border border-border-hairline">
                      <div>
                        <span className="text-[10px] text-text-secondary uppercase block">Subtotal</span>
                        <span>R$ {formatCurrency(r.subtotal)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-700 uppercase block font-semibold">Desconto</span>
                        <span className="font-bold text-emerald-700">- R$ {formatCurrency(r.discountAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-blue-700 uppercase block">Custo Mkt</span>
                        <span>R$ {formatCurrency(r.marketplaceCost)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-700 uppercase block">Custo Vend</span>
                        <span>R$ {formatCurrency(r.sellerCost)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border-hairline text-xs font-bold">
                      <span>Total Pago:</span>
                      <span className="text-sm">R$ {formatCurrency(r.finalTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table for Redemptions */}
              <div className="hidden md:block bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-off border-b border-border-hairline text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                      <th className="p-3">Data / Hora</th>
                      <th className="p-3">Pedido</th>
                      <th className="p-3">Cupom</th>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Subtotal</th>
                      <th className="p-3">Desconto</th>
                      <th className="p-3">Custo Mkt</th>
                      <th className="p-3">Custo Vendedor</th>
                      <th className="p-3">Total Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-hairline">
                    {redemptions.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-off/50 transition-colors">
                        <td className="p-3 text-[11px] text-text-secondary">
                          {new Date(r.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 font-mono font-bold text-xs">{r.orderId || '-'}</td>
                        <td className="p-3">
                          <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-sm">
                            {r.couponCode}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-medium">{r.customerName}</p>
                          <p className="text-[10px] text-text-secondary">{r.customerEmail || r.customerPhone || '-'}</p>
                        </td>
                        <td className="p-3">R$ {formatCurrency(r.subtotal)}</td>
                        <td className="p-3 font-bold text-emerald-700">
                          - R$ {formatCurrency(r.discountAmount)}
                        </td>
                        <td className="p-3 text-blue-700 font-medium">
                          R$ {formatCurrency(r.marketplaceCost)}
                        </td>
                        <td className="p-3 text-purple-700 font-medium">
                          R$ {formatCurrency(r.sellerCost)}
                        </td>
                        <td className="p-3 font-bold text-text-primary">
                          R$ {formatCurrency(r.finalTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 5: HISTÓRICO DE ALTERAÇÕES
          ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-surface-pure border border-border-hairline p-4 sm:p-5 shadow-sm">
            <h2 className="font-display uppercase tracking-widest text-sm sm:text-base font-bold text-text-primary">
              Trilha de Auditoria & Versionamento
            </h2>
            <p className="text-xs text-text-secondary">
              Registro cronológico de todas as ações administrativas e alterações de regras.
            </p>
          </div>

          <div className="bg-surface-pure border border-border-hairline shadow-sm divide-y divide-border-hairline">
            {coupons.length === 0 ? (
              <p className="p-8 text-center text-xs text-text-secondary">
                Nenhum histórico registrado até o momento.
              </p>
            ) : (
              coupons.map((c) => (
                <div key={c.id} className="p-4 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold bg-surface-off px-2 py-0.5 border border-border-hairline">
                        {c.code}
                      </span>
                      <span className="font-semibold text-text-primary">{c.name}</span>
                      <span className="text-[10px] bg-surface-container px-1.5 rounded font-mono">v{c.version}</span>
                    </div>
                    <span className="text-[11px] text-text-secondary">
                      Criado em: {new Date(c.createdAt).toLocaleDateString('pt-BR')} por {c.createdByAdmin || 'Administrador'}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary">
                    Tipo: {c.discountType} | Valor: {c.discountValue} | Financiador: {c.financingType} | Utilizações: {c.usedCount}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE DETALHES DO CUPOM (MOBILE BOTTOM SHEET & DESKTOP MODAL)
          ======================================================== */}
      {isDetailModalOpen && selectedCouponDetails && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 animate-in fade-in">
          <div className="bg-surface-pure border-t sm:border border-border-hairline w-full max-w-2xl max-h-[92dvh] overflow-y-auto shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 rounded-t-xl sm:rounded-none">
            <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base sm:text-lg">{selectedCouponDetails.code}</span>
                {renderStatusBadge(selectedCouponDetails.status)}
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-2xl leading-none text-text-secondary hover:text-primary transition-colors p-1"
                aria-label="Fechar"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-surface-off p-2.5 sm:p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Campanha</span>
                <span className="font-bold truncate block">{selectedCouponDetails.name}</span>
              </div>
              <div className="bg-surface-off p-2.5 sm:p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Tipo & Valor</span>
                <span className="font-bold">
                  {selectedCouponDetails.discountType === 'PERCENTAGE'
                    ? `${selectedCouponDetails.discountValue}% OFF`
                    : selectedCouponDetails.discountType === 'FIXED'
                    ? `R$ ${formatCurrency(selectedCouponDetails.discountValue)}`
                    : 'Frete Grátis'}
                </span>
              </div>
              <div className="bg-surface-off p-2.5 sm:p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Cumulativo</span>
                <span className="font-bold">{selectedCouponDetails.canStack ? 'Sim' : 'Não'}</span>
              </div>
              <div className="bg-surface-off p-2.5 sm:p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Utilizações</span>
                <span className="font-bold">
                  {selectedCouponDetails.usedCount} / {selectedCouponDetails.totalUsageLimit ?? 'Ilimitado'}
                </span>
              </div>
              <div className="bg-surface-off p-2.5 sm:p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Desconto Total</span>
                <span className="font-bold">R$ {formatCurrency(selectedCouponDetails.totalDiscountGiven)}</span>
              </div>
              <div className="bg-surface-off p-2.5 sm:p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Versão</span>
                <span className="font-bold font-mono">v{selectedCouponDetails.version}</span>
              </div>
            </div>

            {/* Description */}
            {selectedCouponDetails.description && (
              <div className="text-xs">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold mb-1">
                  Descrição
                </span>
                <p className="bg-surface-off p-2.5 sm:p-3 border border-border-hairline text-text-primary">
                  {selectedCouponDetails.description}
                </p>
              </div>
            )}

            {/* Financing details */}
            <div className="p-3 bg-surface-off border border-border-hairline text-xs space-y-1">
              <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">
                Divisão de Financiamento
              </span>
              <p>
                Marketplace: <strong>{selectedCouponDetails.marketplaceSharePercent}%</strong> (Custo acumulado: R$ {formatCurrency(selectedCouponDetails.totalMarketplaceCost)})
              </p>
              <p>
                Vendedores: <strong>{selectedCouponDetails.sellerSharePercent}%</strong> (Custo acumulado: R$ {formatCurrency(selectedCouponDetails.totalSellerCost)})
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-border-hairline">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 bg-surface-off border border-border-hairline text-xs uppercase tracking-wider font-semibold"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditClick(selectedCouponDetails);
                }}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-secondary transition-colors"
              >
                Editar Regras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CouponsAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-96 flex items-center justify-center bg-surface-off text-text-secondary">
          <p className="font-display uppercase tracking-widest text-xs animate-pulse font-semibold">
            Carregando Cupons & Promoções...
          </p>
        </div>
      }
    >
      <CouponsAdminContent />
    </Suspense>
  );
}
