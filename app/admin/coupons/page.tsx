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

      // Fetch audit logs
      const logsRes = await fetch('/api/coupons/reports');
      // Redemptions & logs
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
      disc = 25.00; // Simulated standard shipping rate
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
        className={`px-2.5 py-1 text-[10px] uppercase tracking-wider border rounded-sm inline-flex items-center gap-1 ${
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
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-hairline">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display uppercase tracking-widest text-2xl font-bold text-text-primary">
              Cupons & Promoções
            </h1>
            <span className="text-[10px] bg-primary text-white px-2 py-0.5 uppercase tracking-widest font-semibold">
              Marketplace
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Gestão centralizada de campanhas, incentivos, limites de uso e partilha de custos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setFormData(initialFormState);
              changeTab('create');
            }}
            className="px-5 py-2.5 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <span>+ Criar Cupom</span>
          </button>

          <a
            href="/api/coupons/reports?format=csv"
            className="px-4 py-2.5 bg-surface-pure hover:bg-surface-off border border-border-hairline text-text-primary text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
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
          className={`p-4 text-xs uppercase tracking-wider font-semibold flex items-center justify-between border transition-all animate-in fade-in duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-[#ba1a1a]/10 text-[#ba1a1a] border-[#ba1a1a]/30'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-lg leading-none font-bold">
            &times;
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-border-hairline gap-2 overflow-x-auto text-xs uppercase tracking-wider font-semibold">
        <button
          onClick={() => changeTab('overview')}
          className={`pb-3 px-3 transition-colors relative whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-primary border-b-2 border-primary font-bold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Visão Geral (Dashboard)
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
          {isEditing ? `Editar: ${formData.code || 'Cupom'}` : '+ Criar Novo Cupom'}
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
          Histórico de Alterações
        </button>
      </div>

      {/* ========================================================
          TAB 1: VISÃO GERAL (DASHBOARD OPERACIONAL & ALERTAS)
          ======================================================== */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Status Volume Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-surface-pure border border-border-hairline p-4">
              <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold block mb-1">
                Total Cadastrados
              </span>
              <span className="text-2xl font-bold font-display">{stats.totalCoupons}</span>
              <span className="text-[10px] text-text-secondary block mt-1">todas as campanhas</span>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 p-4">
              <span className="text-[10px] text-emerald-800 uppercase tracking-widest font-semibold block mb-1">
                Ativos Agora
              </span>
              <span className="text-2xl font-bold font-display text-emerald-700">{stats.activeCoupons}</span>
              <span className="text-[10px] text-emerald-600 block mt-1">disponíveis no checkout</span>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-200 p-4">
              <span className="text-[10px] text-indigo-800 uppercase tracking-widest font-semibold block mb-1">
                Agendados
              </span>
              <span className="text-2xl font-bold font-display text-indigo-700">{stats.scheduledCoupons}</span>
              <span className="text-[10px] text-indigo-600 block mt-1">início futuro</span>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 p-4">
              <span className="text-[10px] text-amber-800 uppercase tracking-widest font-semibold block mb-1">
                Pausados
              </span>
              <span className="text-2xl font-bold font-display text-amber-700">{stats.pausedCoupons}</span>
              <span className="text-[10px] text-amber-600 block mt-1">interrupção manual</span>
            </div>

            <div className="bg-orange-50/50 border border-orange-200 p-4">
              <span className="text-[10px] text-orange-800 uppercase tracking-widest font-semibold block mb-1">
                Esgotados
              </span>
              <span className="text-2xl font-bold font-display text-orange-700">{stats.exhaustedCoupons}</span>
              <span className="text-[10px] text-orange-600 block mt-1">limite / orçamento</span>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-4">
              <span className="text-[10px] text-gray-700 uppercase tracking-widest font-semibold block mb-1">
                Expirados
              </span>
              <span className="text-2xl font-bold font-display text-gray-600">{stats.expiredCoupons}</span>
              <span className="text-[10px] text-gray-500 block mt-1">data vencida</span>
            </div>
          </div>

          {/* Financial Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-surface-pure border border-border-hairline p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-text-secondary uppercase tracking-widest font-bold">
                  Total de Descontos Concedidos
                </span>
                <span className="text-xs bg-surface-off px-2 py-0.5 border border-border-hairline font-mono font-bold">
                  {stats.totalRedemptions} resgates
                </span>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold font-display text-text-primary">
                  R$ {formatCurrency(stats.totalDiscountGiven)}
                </span>
                <p className="text-[11px] text-text-secondary mt-1">
                  Média de R$ {formatCurrency(stats.averageDiscount)} por pedido
                </p>
              </div>
            </div>

            <div className="bg-surface-pure border border-border-hairline p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
              <span className="text-[11px] text-text-secondary uppercase tracking-widest font-bold block">
                Financiado pelo Marketplace
              </span>
              <div className="mt-3">
                <span className="text-3xl font-bold font-display text-blue-700">
                  R$ {formatCurrency(stats.marketplaceCost)}
                </span>
                <p className="text-[11px] text-text-secondary mt-1">
                  Custo absorvido pela plataforma ({stats.totalDiscountGiven > 0 ? Math.round((stats.marketplaceCost / stats.totalDiscountGiven) * 100) : 100}%)
                </p>
              </div>
            </div>

            <div className="bg-surface-pure border border-border-hairline p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600" />
              <span className="text-[11px] text-text-secondary uppercase tracking-widest font-bold block">
                Financiado pelos Vendedores
              </span>
              <div className="mt-3">
                <span className="text-3xl font-bold font-display text-purple-700">
                  R$ {formatCurrency(stats.sellerCost)}
                </span>
                <p className="text-[11px] text-text-secondary mt-1">
                  Descontos deduzidos dos repasses ({stats.totalDiscountGiven > 0 ? Math.round((stats.sellerCost / stats.totalDiscountGiven) * 100) : 0}%)
                </p>
              </div>
            </div>
          </div>

          {/* Highlights & Operational Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Campaigns */}
            <div className="bg-surface-pure border border-border-hairline p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-border-hairline mb-4">
                <h3 className="font-display uppercase tracking-widest text-sm font-bold text-text-primary">
                  Campanhas com Maior Utilização
                </h3>
                <span className="text-[10px] text-text-secondary uppercase tracking-wider">Top 5</span>
              </div>

              {stats.topCampaigns.length === 0 ? (
                <p className="text-xs text-text-secondary py-6 text-center">Nenhum cupom utilizado ainda.</p>
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
                            <span className="text-text-secondary truncate max-w-[180px]">{camp.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{camp.usedCount} usos</span>
                            <span className="text-text-secondary">R$ {formatCurrency(camp.totalDiscount)}</span>
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
            <div className="bg-surface-pure border border-border-hairline p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border-hairline mb-4">
                  <h3 className="font-display uppercase tracking-widest text-sm font-bold text-text-primary">
                    Alertas e Indicadores Críticos
                  </h3>
                  <span className="text-[10px] text-text-secondary uppercase tracking-wider">Monitoramento</span>
                </div>

                <div className="space-y-3">
                  {/* Expiring Soon Alert */}
                  <div
                    className={`p-3.5 border flex items-start gap-3 ${
                      stats.expiringSoonCount > 0
                        ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                        : 'bg-surface-off border-border-hairline text-text-secondary'
                    }`}
                  >
                    <div className="p-1 rounded bg-amber-200/50 mt-0.5">
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
                          ? 'Cupons com expiração programada nos próximos 7 dias. Revise ou estenda a vigência.'
                          : 'Nenhum cupom ativo expirando nos próximos 7 dias.'}
                      </p>
                    </div>
                  </div>

                  {/* Near Limit Alert */}
                  <div
                    className={`p-3.5 border flex items-start gap-3 ${
                      stats.nearLimitCount > 0
                        ? 'bg-orange-50/70 border-orange-300 text-orange-900'
                        : 'bg-surface-off border-border-hairline text-text-secondary'
                    }`}
                  >
                    <div className="p-1 rounded bg-orange-200/50 mt-0.5">
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
                          ? 'Campanhas que atingiram 80% ou mais do teto de utilizações ou orçamento financeiro.'
                          : 'Todas as campanhas ativas possuem saldo saudável de utilizações e orçamento.'}
                      </p>
                    </div>
                  </div>

                  {/* Customer Engagement */}
                  <div className="p-3.5 bg-surface-off border border-border-hairline flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-text-primary uppercase tracking-wider">
                        Clientes Únicos Beneficiados
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        Base de compradores únicos que finalizaram compras com cupons
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
                  Ver Todos os Cupons na Tabela &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: GERENCIAR CUPONS (TABELA ADMINISTRATIVA & AÇÕES)
          ======================================================== */}
      {activeTab === 'manage' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Controls Bar: Search & Filters */}
          <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por código ou nome da campanha..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-surface-off border border-border-hairline focus:outline-none focus:border-primary font-medium"
              />
              <svg className="w-4 h-4 text-text-secondary absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-surface-off border border-border-hairline focus:outline-none focus:border-primary"
              >
                <option value="ALL">Todos os Status</option>
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
                className="px-3 py-2 text-xs bg-surface-off border border-border-hairline focus:outline-none focus:border-primary"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
                <option value="FREE_SHIPPING">Frete Grátis</option>
              </select>

              <select
                value={financingFilter}
                onChange={(e) => setFinancingFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-surface-off border border-border-hairline focus:outline-none focus:border-primary"
              >
                <option value="ALL">Todo Financiador</option>
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
                  className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary underline"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Coupons Table */}
          <div className="bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
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
                {filteredCoupons.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-text-secondary">
                      Nenhum cupom encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredCoupons.map((c) => {
                    const usagePercent = c.totalUsageLimit
                      ? Math.min(100, Math.round((c.usedCount / c.totalUsageLimit) * 100))
                      : null;

                    return (
                      <tr key={c.id} className="hover:bg-surface-off/60 transition-colors">
                        {/* Código & Campanha */}
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

                        {/* Desconto */}
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

                        {/* Vigência */}
                        <td className="p-3 text-[11px]">
                          <div>De: {new Date(c.startDate).toLocaleDateString('pt-BR')}</div>
                          <div className="text-text-secondary">
                            {c.endDate ? `Até: ${new Date(c.endDate).toLocaleDateString('pt-BR')}` : 'Indeterminado'}
                          </div>
                        </td>

                        {/* Utilizações */}
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
                                className={`h-full ${
                                  usagePercent >= 90 ? 'bg-orange-500' : 'bg-primary'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </td>

                        {/* Custo Total */}
                        <td className="p-3 font-semibold text-text-primary">
                          R$ {formatCurrency(c.totalDiscountGiven)}
                          {c.financialBudget && (
                            <p className="text-[10px] text-text-secondary font-normal">
                              Teto: R$ {formatCurrency(c.financialBudget)}
                            </p>
                          )}
                        </td>

                        {/* Financiador */}
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

                        {/* Status */}
                        <td className="p-3">{renderStatusBadge(c.status)}</td>

                        {/* Ações */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Ver detalhes */}
                            <button
                              onClick={() => handleOpenDetails(c)}
                              className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-container rounded"
                              title="Ver detalhes e auditoria"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Pausar / Ativar */}
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

                            {/* Duplicar */}
                            <button
                              onClick={() => handleDuplicate(c.id)}
                              className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-container rounded"
                              title="Duplicar regras em novo cupom"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                              </svg>
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => handleEditClick(c)}
                              className="p-1.5 text-text-secondary hover:text-primary hover:bg-surface-container rounded"
                              title="Editar configurações"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Arquivar */}
                            {c.status !== 'ARCHIVED' && (
                              <button
                                onClick={() => handleArchive(c.id, c.code)}
                                className="p-1.5 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded"
                                title="Arquivar cupom"
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: CRIAR / EDITAR CUPOM (WIZARD & SIMULADOR)
          ======================================================== */}
      {activeTab === 'create' && (
        <form onSubmit={handleSubmitForm} className="space-y-8 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="font-display uppercase tracking-widest text-base font-bold text-text-primary">
                {isEditing ? `Editando Cupom: ${formData.code}` : 'Novo Cadastro de Cupom & Promoção'}
              </h2>
              <p className="text-xs text-text-secondary">
                Configure os parâmetros de validação, vigência, público e rateio financeiro.
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
                Cancelar Edição
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Informações Básicas */}
              <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">1</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Informações Básicas da Campanha</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Nome Interno da Campanha *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Campanha de Inverno 2026"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary"
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
                        Gerar Aleatório
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ex: VERAO20"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                      className="w-full border border-border-hairline p-2.5 text-xs font-mono font-bold uppercase tracking-wider bg-surface-off focus:outline-none focus:border-primary"
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
                    className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Identificador Interno / Tag
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CAMP-2026-09"
                      value={formData.internalId}
                      onChange={(e) => setFormData({ ...formData, internalId: e.target.value })}
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                      Status Inicial
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as CouponStatus })}
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary"
                    >
                      <option value="ACTIVE">Ativo (Pronto para Uso)</option>
                      <option value="DRAFT">Rascunho (Em Configuração)</option>
                      <option value="PAUSED">Pausado (Inativo)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Tipo de Desconto & Parâmetros */}
              <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">2</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Tipo de Desconto & Condições</h3>
                </div>

                {/* Modality Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`p-3.5 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.discountType === 'PERCENTAGE'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                    <span className="text-[11px]">Ex: 10%, 15% de desconto sobre o valor.</span>
                  </label>

                  <label
                    className={`p-3.5 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.discountType === 'FIXED'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                    className={`p-3.5 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.discountType === 'FREE_SHIPPING'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                    <span className="text-[11px]">Isenção total do frete no pedido.</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                        className="w-full border border-border-hairline p-2.5 text-xs font-bold bg-surface-off focus:outline-none focus:border-primary"
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
                        className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary"
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
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Stacking / Accumulation Rule */}
                <div className="pt-3 border-t border-border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-off p-3.5">
                  <div>
                    <span className="text-xs font-bold text-text-primary block">
                      Permitir Acúmulo com Outros Cupons & Promoções
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      Se ativado, o cliente poderá usar este cupom simultaneamente com outro cupom cumulativo na mesma compra.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
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
              <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
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
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary"
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
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary disabled:opacity-40"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-text-secondary">
                  Fuso horário padrão do sistema: <strong>America/Sao_Paulo (Horário de Brasília)</strong>. Se a data de início for futura, o status será automaticamente avaliado como &quot;Agendado&quot;.
                </p>
              </div>

              {/* Section 4: Vendedores Participantes (Multi-vendor) */}
              <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">4</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Vendedores Participantes (Marketplace)</h3>
                </div>

                <div className="flex gap-4 text-xs">
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
                      Selecione os Vendedores Autorizados:
                    </span>
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
                  </div>
                )}
              </div>

              {/* Section 5: Limites de Utilização */}
              <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">5</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Limites de Utilização & Orçamento</h3>
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
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary disabled:opacity-40"
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
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary"
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
                      className="w-full border border-border-hairline p-2.5 text-xs bg-surface-off focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Section 6: Responsável Financeiro pelo Desconto */}
              <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border-hairline">
                  <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-bold">6</span>
                  <h3 className="font-display uppercase tracking-widest text-xs font-bold">Rateio de Custos Financeiros</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`p-3.5 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.financingType === 'MARKETPLACE_100'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                    className={`p-3.5 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.financingType === 'SELLER_100'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                    className={`p-3.5 border cursor-pointer transition-all flex flex-col justify-between ${
                      formData.financingType === 'SHARED'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border-hairline bg-surface-off text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
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
                    <span className="text-[11px]">Divisão percentual configurável entre as partes.</span>
                  </label>
                </div>

                {/* Shared split sliders */}
                {formData.financingType === 'SHARED' && (
                  <div className="p-4 bg-surface-off border border-border-hairline space-y-3">
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
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Live Financial Simulation & Action Card */}
            <div className="space-y-6">
              {/* Live Simulator Card */}
              <div className="bg-surface-pure border border-border-hairline p-5 shadow-sm sticky top-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-display uppercase tracking-widest text-xs font-bold text-text-primary">
                      Simulador Financeiro
                    </h3>
                  </div>
                  <span className="text-[10px] text-text-secondary uppercase">Tempo Real</span>
                </div>

                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1.5">
                    Valor de Teste do Pedido (R$)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={simulationCartValue}
                    onChange={(e) => setSimulationCartValue(Number(e.target.value))}
                    className="w-full border border-border-hairline p-2 text-xs font-mono font-bold bg-surface-off focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="p-3.5 bg-surface-off border border-border-hairline space-y-2.5 text-xs">
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
                      <span>Parcela Marketplace ({formData.marketplaceSharePercent}%):</span>
                      <span className="font-bold">R$ {formatCurrency(simulationResults.mktCost)}</span>
                    </div>

                    <div className="flex items-center justify-between text-purple-800">
                      <span>Parcela Vendedor ({formData.sellerSharePercent}%):</span>
                      <span className="font-bold">R$ {formatCurrency(simulationResults.sellerCost)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border-hairline flex items-center justify-between text-sm font-bold text-text-primary">
                    <span>Cliente Paga:</span>
                    <span className="text-base text-primary">R$ {formatCurrency(simulationResults.customerPays)}</span>
                  </div>
                </div>

                {/* Submission Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={savingCoupon}
                    className="w-full py-3 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-bold transition-all shadow-sm disabled:opacity-50"
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
                    className="w-full py-2.5 bg-surface-off hover:bg-surface-container text-text-secondary text-xs uppercase tracking-wider font-semibold transition-colors"
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
          TAB 4: RELATÓRIOS & RESGATES
          ======================================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-surface-pure border border-border-hairline p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display uppercase tracking-widest text-base font-bold text-text-primary">
                Relatório de Resgates & Eficiência
              </h2>
              <p className="text-xs text-text-secondary">
                Acompanhamento analítico de pedidos realizados com cupons promocionais.
              </p>
            </div>

            <a
              href="/api/coupons/reports?format=csv"
              className="px-4 py-2 bg-primary hover:bg-secondary text-white text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Baixar Relatório CSV</span>
            </a>
          </div>

          {/* Redemptions Table */}
          <div className="bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-off border-b border-border-hairline text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Pedido</th>
                  <th className="p-3">Cupom Usado</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Subtotal</th>
                  <th className="p-3">Desconto Concedido</th>
                  <th className="p-3">Custo Mkt</th>
                  <th className="p-3">Custo Vendedor</th>
                  <th className="p-3">Total Pago</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline">
                {redemptions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-text-secondary">
                      Nenhum resgate registrado até o momento.
                    </td>
                  </tr>
                ) : (
                  redemptions.map((r) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: HISTÓRICO DE ALTERAÇÕES & AUDITORIA
          ======================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-surface-pure border border-border-hairline p-5 shadow-sm">
            <h2 className="font-display uppercase tracking-widest text-base font-bold text-text-primary">
              Trilha de Auditoria & Versionamento
            </h2>
            <p className="text-xs text-text-secondary">
              Registro cronológico imutável de todas as ações administrativas, alterações de regras e resgates.
            </p>
          </div>

          <div className="bg-surface-pure border border-border-hairline shadow-sm divide-y divide-border-hairline">
            {coupons.map((c) => (
              <div key={c.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between text-xs">
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
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE DETALHES COMPLETOS DO CUPOM
          ======================================================== */}
      {isDetailModalOpen && selectedCouponDetails && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 animate-in fade-in">
          <div className="bg-surface-pure border border-border-hairline w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg">{selectedCouponDetails.code}</span>
                {renderStatusBadge(selectedCouponDetails.status)}
              </div>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-2xl leading-none text-text-secondary hover:text-primary transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-surface-off p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Campanha</span>
                <span className="font-bold">{selectedCouponDetails.name}</span>
              </div>
              <div className="bg-surface-off p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Tipo & Valor</span>
                <span className="font-bold">
                  {selectedCouponDetails.discountType === 'PERCENTAGE'
                    ? `${selectedCouponDetails.discountValue}% OFF`
                    : selectedCouponDetails.discountType === 'FIXED'
                    ? `R$ ${formatCurrency(selectedCouponDetails.discountValue)}`
                    : 'Frete Grátis'}
                </span>
              </div>
              <div className="bg-surface-off p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Cumulativo</span>
                <span className="font-bold">{selectedCouponDetails.canStack ? 'Sim (Pode somar)' : 'Não'}</span>
              </div>
              <div className="bg-surface-off p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Utilizações</span>
                <span className="font-bold">
                  {selectedCouponDetails.usedCount} / {selectedCouponDetails.totalUsageLimit ?? 'Ilimitado'}
                </span>
              </div>
              <div className="bg-surface-off p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Desconto Total</span>
                <span className="font-bold">R$ {formatCurrency(selectedCouponDetails.totalDiscountGiven)}</span>
              </div>
              <div className="bg-surface-off p-3 border border-border-hairline">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold">Versão Atual</span>
                <span className="font-bold font-mono">v{selectedCouponDetails.version}</span>
              </div>
            </div>

            {/* Description & Rules */}
            {selectedCouponDetails.description && (
              <div className="text-xs">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest block font-semibold mb-1">
                  Descrição
                </span>
                <p className="bg-surface-off p-3 border border-border-hairline text-text-primary">
                  {selectedCouponDetails.description}
                </p>
              </div>
            )}

            {/* Financing details */}
            <div className="p-3.5 bg-surface-off border border-border-hairline text-xs space-y-1">
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

            <div className="flex justify-end gap-2 pt-3 border-t border-border-hairline">
              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleEditClick(selectedCouponDetails);
                }}
                className="px-4 py-2 bg-primary text-white text-xs uppercase tracking-wider font-semibold hover:bg-secondary transition-colors"
              >
                Editar Regras
              </button>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 bg-surface-off border border-border-hairline text-xs uppercase tracking-wider font-semibold"
              >
                Fechar
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

