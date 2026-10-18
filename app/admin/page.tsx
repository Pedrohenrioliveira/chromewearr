'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface CartProductItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color?: string;
  ref?: string;
  imageUrl?: string;
  addedAt?: string;
}

interface UserActivityItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'USER' | 'VENDOR' | 'ADMIN';
  isVerified: boolean;
  cartData: any;
  createdAt: string;
  updatedAt: string;
  orders: OrderItem[];
  ordersCount: number;
}

function getParsedCart(cartData: any): CartProductItem[] {
  if (!cartData) return [];
  if (Array.isArray(cartData)) return cartData;
  if (typeof cartData === 'string') {
    try {
      const parsed = JSON.parse(cartData);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.items)) return parsed.items;
      return [];
    } catch {
      return [];
    }
  }
  if (typeof cartData === 'object' && cartData !== null) {
    if (Array.isArray(cartData.items)) return cartData.items;
    return [];
  }
  return [];
}

function getTimeInCart(addedAt?: string, updatedAtFallback?: string): { daysAgo: number; label: string; exactDate: string } {
  const dateStr = addedAt || updatedAtFallback;
  if (!dateStr) {
    return { daysAgo: 0, label: 'recente', exactDate: 'Data não informada' };
  }
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let label = '';
  if (diffMinutes < 1) label = 'agora mesmo';
  else if (diffMinutes < 60) label = `${diffMinutes}m`;
  else if (diffHours < 24) label = `${diffHours}h`;
  else if (diffDays === 1) label = '1 dia';
  else label = `${diffDays} dias`;

  const exactDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return { daysAgo: diffDays, label, exactDate };
}

function getAccountAge(createdAt: string): { days: number; label: string; date: string } {
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let label = '';
  if (days === 0) label = 'Hoje';
  else if (days === 1) label = 'Ontem (1 dia)';
  else label = `Há ${days} dias`;

  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return { days, label, date: dateStr };
}

function getActivityStatus(updatedAt: string): { label: string; isRecent: boolean; daysAgo: number } {
  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return { label: 'Ativo agora', isRecent: true, daysAgo: 0 };
  if (diffHours < 24) return { label: `Ativo há ${diffHours}h`, isRecent: true, daysAgo: 0 };
  if (diffDays === 1) return { label: 'Ativo ontem', isRecent: true, daysAgo: 1 };
  if (diffDays < 7) return { label: `Ativo há ${diffDays} dias`, isRecent: false, daysAgo: diffDays };
  return { label: `Sem atividade há ${diffDays} dias`, isRecent: false, daysAgo: diffDays };
}

function getCleanPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.startsWith('55') ? digits : `55${digits}`;
  }
  return null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    users: 0,
    totalUsers: 0,
    customers: 0,
  });
  const [users, setUsers] = useState<UserActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'WITH_CART' | 'CART_30D' | 'WITH_ORDERS' | 'CUSTOMERS'>('ALL');

  // Quick Cart Modal inside Dashboard
  const [viewingCartUser, setViewingCartUser] = useState<UserActivityItem | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData);
        }
      } catch (e) {
        console.error('Erro ao carregar dados do dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      const cart = getParsedCart(u.cartData);
      if (activeTab === 'WITH_CART' && cart.length === 0) return false;
      if (activeTab === 'CART_30D') {
        if (cart.length === 0) return false;
        const timeInfo = getTimeInCart(cart[0]?.addedAt, u.updatedAt);
        if (timeInfo.daysAgo < 30) return false;
      }
      if (activeTab === 'WITH_ORDERS' && (u.ordersCount || 0) === 0) return false;
      if (activeTab === 'CUSTOMERS' && u.role !== 'USER') return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = u.name.toLowerCase().includes(term);
        const matchEmail = u.email.toLowerCase().includes(term);
        const matchPhone = u.phone ? u.phone.toLowerCase().includes(term) : false;
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      return true;
    });
  }, [users, activeTab, searchTerm]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const withCart = users.filter((u) => getParsedCart(u.cartData).length > 0);
    const cart30d = withCart.filter((u) => {
      const cart = getParsedCart(u.cartData);
      const timeInfo = getTimeInCart(cart[0]?.addedAt, u.updatedAt);
      return timeInfo.daysAgo >= 30;
    });
    const withOrders = users.filter((u) => (u.ordersCount || 0) > 0);
    const customers = users.filter((u) => u.role === 'USER');

    return {
      all: users.length,
      withCart: withCart.length,
      cart30d: cart30d.length,
      withOrders: withOrders.length,
      customers: customers.length,
    };
  }, [users]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
          <span className="text-xs uppercase tracking-widest font-bold text-text-secondary">
            Carregando Métricas & Atividade dos Clientes...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-text-secondary uppercase tracking-[0.25em] font-semibold block mb-1">
            Painel de Controle Central
          </span>
          <h1 className="font-display uppercase tracking-widest text-2xl md:text-3xl font-bold">
            Dashboard ChromeWear
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Visão geral de produtos, categorias e atividade em tempo real de clientes no site.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="bg-black text-white text-xs uppercase tracking-wider font-bold py-3.5 px-5 hover:bg-neutral-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>Gerenciar Usuários & Sacolas &rarr;</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-surface-pure border border-border-hairline p-4 md:p-5 shadow-sm">
          <h2 className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Produtos</h2>
          <p className="text-2xl md:text-3xl font-display font-bold">{stats.products}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 md:p-5 shadow-sm">
          <h2 className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Categorias</h2>
          <p className="text-2xl md:text-3xl font-display font-bold">{stats.categories}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 md:p-5 shadow-sm">
          <h2 className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Clientes Loja</h2>
          <p className="text-2xl md:text-3xl font-display font-bold text-primary">{tabCounts.customers}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 md:p-5 shadow-sm">
          <h2 className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Carrinhos Ativos</h2>
          <p className="text-2xl md:text-3xl font-display font-bold text-amber-600">{tabCounts.withCart}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 md:p-5 shadow-sm">
          <h2 className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Parados 30d+</h2>
          <p className="text-2xl md:text-3xl font-display font-bold text-[#ba1a1a]">{tabCounts.cart30d}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 md:p-5 shadow-sm">
          <h2 className="text-[9px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Staff / Admins</h2>
          <p className="text-2xl md:text-3xl font-display font-bold text-blue-600">{stats.users || 0}</p>
        </div>
      </div>

      {/* Acesso Rápido Section */}
      <div>
        <h2 className="font-display uppercase tracking-widest text-xs font-bold mb-3 text-text-secondary">
          Acesso Rápido às Configurações
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <Link
            href="/admin/products/new"
            className="bg-primary text-white text-center py-3.5 px-4 text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors"
          >
            + Cadastrar Produto
          </Link>
          <Link
            href="/admin/users"
            className="bg-surface-pure border border-border-hairline text-center py-3.5 px-4 text-xs uppercase tracking-wider font-bold hover:border-primary transition-colors"
          >
            👥 Gerenciar Usuários
          </Link>
          <Link
            href="/admin/settings"
            className="bg-surface-pure border border-border-hairline text-center py-3.5 px-4 text-xs uppercase tracking-wider font-bold hover:border-primary transition-colors"
          >
            🔒 Senhas & Acessos
          </Link>
          <Link
            href="/admin/banner"
            className="bg-surface-pure border border-border-hairline text-center py-3.5 px-4 text-xs uppercase tracking-wider font-bold hover:border-primary transition-colors"
          >
            🖼️ Editar Banner
          </Link>
          <Link
            href="/admin/categories"
            className="bg-surface-pure border border-border-hairline text-center py-3.5 px-4 text-xs uppercase tracking-wider font-bold hover:border-primary transition-colors"
          >
            🏷️ Categorias
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO SOLICITADA: ATIVIDADE DOS CLIENTES, CRIAÇÃO DE CONTA E COMPRAS */}
      {/* ========================================================================= */}
      <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-hairline pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="font-display uppercase tracking-widest text-lg font-bold text-text-primary">
                Atividade Recente dos Clientes no Site
              </h2>
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Monitore quando o usuário criou a conta, tempo de atividade, quantidade de compras e produtos salvos no carrinho.
            </p>
          </div>

          <Link
            href="/admin/users"
            className="text-xs uppercase font-bold tracking-wider text-text-secondary hover:text-text-primary flex items-center gap-1"
          >
            <span>Ver tabela completa em Usuários</span> &rarr;
          </Link>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`text-xs uppercase tracking-wider font-bold px-3 py-2 border transition-colors ${
                activeTab === 'ALL'
                  ? 'bg-black text-white border-black'
                  : 'bg-surface-off border-border-hairline text-text-secondary hover:text-text-primary'
              }`}
            >
              Todos ({tabCounts.all})
            </button>
            <button
              onClick={() => setActiveTab('WITH_CART')}
              className={`text-xs uppercase tracking-wider font-bold px-3 py-2 border transition-colors ${
                activeTab === 'WITH_CART'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-surface-off border-border-hairline text-amber-700 hover:text-amber-800'
              }`}
            >
              Com Carrinho ({tabCounts.withCart})
            </button>
            <button
              onClick={() => setActiveTab('CART_30D')}
              className={`text-xs uppercase tracking-wider font-bold px-3 py-2 border transition-colors ${
                activeTab === 'CART_30D'
                  ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]'
                  : 'bg-surface-off border-border-hairline text-[#ba1a1a] hover:bg-[#ba1a1a]/10'
              }`}
            >
              Parados 30d+ ({tabCounts.cart30d})
            </button>
            <button
              onClick={() => setActiveTab('WITH_ORDERS')}
              className={`text-xs uppercase tracking-wider font-bold px-3 py-2 border transition-colors ${
                activeTab === 'WITH_ORDERS'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-surface-off border-border-hairline text-emerald-700 hover:bg-emerald-500/10'
              }`}
            >
              Com Compras ({tabCounts.withOrders})
            </button>
            <button
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`text-xs uppercase tracking-wider font-bold px-3 py-2 border transition-colors ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface-off border-border-hairline text-text-secondary hover:text-text-primary'
              }`}
            >
              Clientes Loja ({tabCounts.customers})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Buscar por nome, email ou tel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-off border border-border-hairline p-2.5 text-xs text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:border-primary"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-text-secondary hover:text-text-primary"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Client Activity Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border-hairline bg-surface-off/50">
            <p className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
              Nenhum cliente encontrado com os filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-hairline">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-hairline bg-surface-off text-[10px] uppercase tracking-widest text-text-secondary font-bold">
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Criação da Conta</th>
                  <th className="p-3.5">Tempo de Atividade</th>
                  <th className="p-3.5">Compras</th>
                  <th className="p-3.5">Produtos no Carrinho</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-hairline text-xs">
                {filteredUsers.slice(0, 30).map((user) => {
                  const cart = getParsedCart(user.cartData);
                  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                  const timeInfo = getTimeInCart(cart[0]?.addedAt, user.updatedAt);
                  const accountAge = getAccountAge(user.createdAt);
                  const activityStatus = getActivityStatus(user.updatedAt);
                  const cleanPhone = getCleanPhone(user.phone);

                  // Calculate total spent in purchases
                  const totalSpent = (user.orders || []).reduce((acc, order) => acc + (order.totalPrice || 0), 0);

                  return (
                    <tr key={user.id} className="hover:bg-surface-off/40 transition-colors">
                      {/* Cliente Info */}
                      <td className="p-3.5">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container border border-border-hairline flex items-center justify-center font-bold text-xs uppercase text-text-primary flex-shrink-0">
                            {user.name ? user.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-text-primary block">{user.name}</span>
                            <span className="text-[11px] text-text-secondary font-mono block">{user.email}</span>
                            {user.phone ? (
                              <span className="text-[10px] text-text-secondary block mt-0.5">
                                📞 {user.phone}
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-400 block mt-0.5">Sem telefone</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Criação da Conta */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="font-semibold text-text-primary block">{accountAge.date}</span>
                        <span className="text-[11px] text-text-secondary block">{accountAge.label}</span>
                      </td>

                      {/* Tempo de Atividade */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 border ${
                          activityStatus.isRecent
                            ? 'text-emerald-800 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-text-secondary bg-surface-off border-border-hairline'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${activityStatus.isRecent ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                          {activityStatus.label}
                        </span>
                        <span className="text-[10px] text-text-secondary font-mono block mt-1">
                          Último update: {new Date(user.updatedAt).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      {/* Quantidade de Compras */}
                      <td className="p-3.5 whitespace-nowrap">
                        {user.ordersCount > 0 ? (
                          <div>
                            <span className="font-bold text-emerald-800 text-xs block">
                              🛍️ {user.ordersCount} {user.ordersCount === 1 ? 'compra' : 'compras'}
                            </span>
                            <span className="text-[11px] text-text-secondary font-mono">
                              Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-text-secondary">Nenhuma compra</span>
                        )}
                      </td>

                      {/* Produtos no Carrinho */}
                      <td className="p-3.5">
                        {cart.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-text-primary">
                                🛒 {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                              </span>
                              <span className="text-[11px] text-text-secondary font-mono font-bold">
                                ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)})
                              </span>
                            </div>

                            {/* Time in cart counter */}
                            <div>
                              <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-1.5 py-0.5 border ${
                                timeInfo.daysAgo >= 30
                                  ? 'text-[#ba1a1a] bg-[#ba1a1a]/10 border-[#ba1a1a]/30 animate-pulse'
                                  : 'text-amber-800 bg-amber-500/10 border-amber-500/20'
                              }`}>
                                ⏳ No carrinho há {timeInfo.label}
                              </span>
                            </div>

                            {/* Products name teaser */}
                            <p className="text-[11px] text-text-secondary line-clamp-1 max-w-xs">
                              {cart.map((i) => i.name).join(', ')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400">Carrinho vazio</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {cart.length > 0 && (
                            <button
                              onClick={() => setViewingCartUser(user)}
                              className="text-[10px] uppercase font-bold px-2.5 py-1.5 bg-surface-pure border border-border-hairline hover:border-primary transition-colors text-text-primary"
                              title="Ver produtos salvos no carrinho"
                            >
                              👁️ Ver Carrinho
                            </button>
                          )}

                          {cleanPhone ? (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] uppercase font-bold px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1"
                              title="Chamar no WhatsApp"
                            >
                              📲 WhatsApp
                            </a>
                          ) : (
                            <span className="text-[10px] text-neutral-400 px-2 py-1.5">Sem WhatsApp</span>
                          )}

                          <Link
                            href={`/admin/users?search=${encodeURIComponent(user.email)}`}
                            className="text-[10px] uppercase font-bold px-2 py-1.5 text-text-secondary hover:text-text-primary underline"
                            title="Gerenciar cadastro completo"
                          >
                            Gerenciar
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredUsers.length > 30 && (
          <div className="text-center pt-2">
            <Link
              href="/admin/users"
              className="text-xs uppercase font-bold tracking-wider text-primary hover:underline"
            >
              Visualizando 30 de {filteredUsers.length} clientes. Ver todos em Gerenciar Usuários &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* QUICK CART PREVIEW MODAL */}
      {/* ========================================================================= */}
      {viewingCartUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setViewingCartUser(null)}
          />

          <div className="relative w-full max-w-xl bg-surface-pure border border-border-hairline shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-hairline pb-4 mb-5">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-semibold block">
                  Sacola do Cliente
                </span>
                <h2 className="font-display uppercase tracking-widest text-lg font-bold mt-1">
                  {viewingCartUser.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-text-secondary font-mono">{viewingCartUser.email}</span>
                  {viewingCartUser.phone && (
                    <>
                      <span className="text-text-secondary text-[11px]">•</span>
                      <span className="text-[11px] text-text-secondary font-mono">{viewingCartUser.phone}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => setViewingCartUser(null)}
                className="text-text-secondary hover:text-text-primary p-2 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Cart Items */}
            {(() => {
              const cart = getParsedCart(viewingCartUser.cartData);
              const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span>Produtos Salvos ({cart.length})</span>
                    <span className="font-mono text-sm">
                      Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                    </span>
                  </div>

                  <div className="divide-y divide-border-hairline border border-border-hairline bg-surface-off">
                    {cart.map((item) => {
                      const timeInfo = getTimeInCart(item.addedAt, viewingCartUser.updatedAt);

                      return (
                        <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-surface-container border border-border-hairline flex-shrink-0 overflow-hidden">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-text-secondary">
                                  IMG
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-text-primary">{item.name}</h4>
                              <p className="text-[11px] text-text-secondary">
                                Tam: <strong>{item.size}</strong> | Qtd: {item.quantity}
                              </p>
                              <span className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 mt-1 border ${
                                timeInfo.daysAgo >= 30
                                  ? 'text-[#ba1a1a] bg-[#ba1a1a]/10 border-[#ba1a1a]/30'
                                  : 'text-amber-800 bg-amber-500/10 border-amber-500/20'
                              }`}>
                                ⏳ No carrinho há {timeInfo.label}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold font-mono">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
                    <button
                      type="button"
                      onClick={() => setViewingCartUser(null)}
                      className="border border-border-hairline bg-surface-off py-2.5 px-4 text-xs uppercase tracking-wider font-semibold hover:bg-surface-container transition-colors"
                    >
                      Fechar
                    </button>

                    <Link
                      href={`/admin/users?search=${encodeURIComponent(viewingCartUser.email)}`}
                      className="bg-black text-white py-2.5 px-5 text-xs uppercase tracking-wider font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                    >
                      <span>Abrir Recuperação em Usuários &rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
