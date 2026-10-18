'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface OrderSummary {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
}

interface CartProductItem {
  id: string;
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

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'USER' | 'VENDOR' | 'ADMIN';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  ordersCount: number;
  orders?: OrderSummary[];
  cartData?: any;
}

// Helper to parse cart data safely
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
  if (typeof cartData === 'object' && Array.isArray(cartData.items)) {
    return cartData.items;
  }
  return [];
}

// Helper to get reminder sent timestamp
function getCartReminderSentAt(cartData: any): string | null {
  if (!cartData) return null;
  if (typeof cartData === 'string') {
    try {
      const parsed = JSON.parse(cartData);
      if (parsed?.reminderSentAt) return parsed.reminderSentAt;
      if (Array.isArray(parsed)) {
        return parsed.find((i: any) => i.reminderSentAt)?.reminderSentAt || null;
      }
    } catch {
      return null;
    }
  }
  if (typeof cartData === 'object') {
    if (cartData.reminderSentAt) return cartData.reminderSentAt;
    if (Array.isArray(cartData.items)) {
      return cartData.items.find((i: any) => i.reminderSentAt)?.reminderSentAt || null;
    }
    if (Array.isArray(cartData)) {
      return (cartData as any).find((i: any) => i.reminderSentAt)?.reminderSentAt || null;
    }
  }
  return null;
}

// Helper to calculate elapsed time in cart
function getTimeInCart(addedAt?: string | null, updatedAt?: string | null): { label: string; exactDate: string; daysAgo: number; hoursAgo: number } {
  const dateStr = addedAt || updatedAt;
  if (!dateStr) {
    return { label: 'Tempo não identificado', exactDate: 'Data indisponível', daysAgo: 0, hoursAgo: 0 };
  }

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let label = '';
  if (diffMins < 1) label = 'Menos de 1 minuto';
  else if (diffMins < 60) label = `${diffMins} min`;
  else if (diffHours === 1) label = '1 hora';
  else if (diffHours < 24) label = `${diffHours} horas`;
  else if (diffDays === 1) label = '1 dia';
  else if (diffDays < 30) label = `${diffDays} dias`;
  else label = `${Math.floor(diffDays / 30)} meses`;

  const exactDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return { label, exactDate, daysAgo: diffDays, hoursAgo: diffHours };
}

// Generate full cart recovery WhatsApp text
function buildFullCartRecoveryText(user: UserItem, items: CartProductItem[]): string {
  const timeInfo = getTimeInCart(items[0]?.addedAt, user.updatedAt);
  const firstName = user.name ? user.name.split(' ')[0] : 'Cliente';
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

  const itemsList = items
    .map((i) => `• *${i.name}* (Tam: ${i.size}) - ${i.quantity}x de R$ ${i.price.toFixed(2).replace('.', ',')}`)
    .join('\n');

  return `Olá, ${firstName}! Tudo bem? 

Aqui é da equipe da *ChromeWear* ⚡

Notamos que você adicionou itens à sua sacola em nossa loja há cerca de *${timeInfo.label}* e seu carrinho continua reservado para você:

${itemsList}
*Total:* ${formattedTotal}

Gostaria de saber se você ainda teria interesse em garantir e finalizar essa compra? 

Nosso estoque deste drop é limitado. Se precisar de ajuda com tamanhos, frete ou quiser finalizar rapidamente por aqui via PIX ou cartão, estou à disposição para te atender! 🖤`;
}

// Generate single item recovery WhatsApp text
function buildSingleItemRecoveryText(user: UserItem, item: CartProductItem): string {
  const timeInfo = getTimeInCart(item.addedAt, user.updatedAt);
  const firstName = user.name ? user.name.split(' ')[0] : 'Cliente';
  const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price);

  return `Olá, ${firstName}! Tudo bem? 

Aqui é da equipe da *ChromeWear* ⚡

Vi que você adicionou a *${item.name}* (Tamanho: *${item.size}* - ${formattedPrice}) à sua sacola há cerca de *${timeInfo.label}*, mas o pedido ainda não foi concluído.

Você ainda teria interesse em garantir essa peça? Nossas unidades são de tiragem limitada e posso segurar para você!

Se tiver alguma dúvida sobre caimento, medidas ou frete, é só me avisar por aqui que te ajudo a finalizar agora mesmo! 🖤`;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'VENDOR' | 'ADMIN' | 'HAS_CART' | 'CART_30D'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');

  // Modals state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [cartModalUser, setCartModalUser] = useState<UserItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'USER' as 'USER' | 'VENDOR' | 'ADMIN',
    isVerified: true,
    newPassword: '',
  });
  const [showEditPass, setShowEditPass] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Create form state
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'VENDOR' as 'USER' | 'VENDOR' | 'ADMIN',
    isVerified: true,
    password: '',
  });
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  // Email sending states
  const [sendingEmailUserId, setSendingEmailUserId] = useState<string | null>(null);
  const [runningCronLoading, setRunningCronLoading] = useState(false);

  // Toast / notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showToast('error', 'Falha ao carregar lista de usuários.');
      }
    } catch (err) {
      showToast('error', 'Erro de conexão ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role / Cart filter
      if (roleFilter === 'HAS_CART') {
        const cart = getParsedCart(u.cartData);
        if (cart.length === 0) return false;
      } else if (roleFilter === 'CART_30D') {
        const cart = getParsedCart(u.cartData);
        if (cart.length === 0) return false;
        const timeInfo = getTimeInCart(cart[0]?.addedAt, u.updatedAt);
        if (timeInfo.daysAgo < 30) return false;
      } else if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'VERIFIED' && !u.isVerified) return false;
      if (statusFilter === 'PENDING' && u.isVerified) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = u.name.toLowerCase().includes(term);
        const matchEmail = u.email.toLowerCase().includes(term);
        const matchPhone = u.phone ? u.phone.toLowerCase().includes(term) : false;
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      return true;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  // Counts for tabs & KPIs
  const counts = useMemo(() => {
    const withCartUsers = users.filter((u) => getParsedCart(u.cartData).length > 0);
    const cart30dUsers = withCartUsers.filter((u) => {
      const cart = getParsedCart(u.cartData);
      const timeInfo = getTimeInCart(cart[0]?.addedAt, u.updatedAt);
      return timeInfo.daysAgo >= 30;
    });

    // Eligible for auto-reminder (30+ days and not reminded in last 30 days)
    const eligibleForEmail = cart30dUsers.filter((u) => {
      const reminderSentAt = getCartReminderSentAt(u.cartData);
      if (!reminderSentAt) return true;
      const sentDaysAgo = Math.floor((Date.now() - new Date(reminderSentAt).getTime()) / (1000 * 60 * 60 * 24));
      return sentDaysAgo >= 30;
    });

    return {
      all: users.length,
      customers: users.filter((u) => u.role === 'USER').length,
      vendors: users.filter((u) => u.role === 'VENDOR').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
      withCart: withCartUsers.length,
      cart30d: cart30dUsers.length,
      eligibleForEmail: eligibleForEmail.length,
      verified: users.filter((u) => u.isVerified).length,
      pending: users.filter((u) => !u.isVerified).length,
    };
  }, [users]);

  // Open Edit Modal
  const handleOpenEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isVerified: user.isVerified,
      newPassword: '',
    });
    setShowEditPass(false);
    setCopiedPassword(false);
  };

  // Generate random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pass = 'CW@';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleGeneratePasswordForEdit = () => {
    const generated = generateRandomPassword();
    setEditFormData((prev) => ({ ...prev, newPassword: generated }));
    setShowEditPass(true);
  };

  const handleGeneratePasswordForCreate = () => {
    const generated = generateRandomPassword();
    setCreateFormData((prev) => ({ ...prev, password: generated }));
    setShowCreatePass(true);
  };

  const handleCopyPassword = (pass: string) => {
    if (!pass) return;
    navigator.clipboard.writeText(pass);
    setCopiedPassword(true);
    showToast('success', 'Nova senha copiada para a área de transferência!');
    setTimeout(() => setCopiedPassword(false), 3000);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setEditLoading(true);
    try {
      const payload: any = {
        id: editingUser.id,
        name: editFormData.name.trim(),
        email: editFormData.email.trim().toLowerCase(),
        phone: editFormData.phone.trim() || null,
        role: editFormData.role,
        isVerified: editFormData.isVerified,
      };

      if (editFormData.newPassword.trim()) {
        payload.password = editFormData.newPassword.trim();
      }

      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Erro ao salvar alterações.');
        return;
      }

      showToast(
        'success',
        payload.password
          ? 'Dados e nova senha atualizados com sucesso (criptografada com Bcrypt)!'
          : 'Dados do usuário atualizados com sucesso!'
      );
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      showToast('error', 'Erro de conexão ao atualizar usuário.');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Erro ao criar usuário.');
        return;
      }

      showToast('success', 'Usuário criado com sucesso no sistema!');
      setIsCreateModalOpen(false);
      setCreateFormData({
        name: '',
        email: '',
        phone: '',
        role: 'VENDOR',
        isVerified: true,
        password: '',
      });
      fetchUsers();
    } catch (err) {
      showToast('error', 'Erro de conexão ao criar usuário.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete User
  const handleDelete = async (id: string, email: string) => {
    if (email === 'admin@chromewear.com') {
      alert('O administrador principal do sistema não pode ser excluído.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir o usuário "${email}"? Esta ação removerá os dados de acesso.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Erro ao excluir usuário.');
        return;
      }
      showToast('success', 'Usuário excluído com sucesso!');
      fetchUsers();
    } catch (e) {
      showToast('error', 'Erro de conexão ao excluir.');
    }
  };

  // Phone helpers
  const formatPhone = (phone: string | null) => {
    if (!phone) return 'Não informado';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone;
  };

  const getCleanPhone = (phone: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return digits.startsWith('55') ? digits : `55${digits}`;
    }
    return null;
  };

  // Open WhatsApp Link
  const handleSendRecoveryWhatsApp = (user: UserItem, item?: CartProductItem) => {
    const cleanPhone = getCleanPhone(user.phone);
    if (!cleanPhone) {
      alert(`O usuário ${user.name} não possui um telefone ou WhatsApp cadastrado. Você pode copiar o texto da mensagem ou enviar o lembrete por e-mail!`);
      return;
    }

    const cart = getParsedCart(user.cartData);
    if (cart.length === 0) return;

    const message = item ? buildSingleItemRecoveryText(user, item) : buildFullCartRecoveryText(user, cart);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Copy Recovery Message
  const handleCopyRecoveryMessage = (user: UserItem, item?: CartProductItem) => {
    const cart = getParsedCart(user.cartData);
    if (cart.length === 0) return;

    const message = item ? buildSingleItemRecoveryText(user, item) : buildFullCartRecoveryText(user, cart);
    navigator.clipboard.writeText(message);
    showToast('success', 'Mensagem de recuperação copiada para a área de transferência!');
  };

  // Trigger manual Email reminder for a specific customer
  const handleSendEmailReminder = async (user: UserItem) => {
    setSendingEmailUserId(user.id);
    try {
      const res = await fetch('/api/admin/cart/send-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast('error', data.error || 'Erro ao enviar e-mail de recuperação.');
        return;
      }

      showToast('success', `E-mail de recuperação enviado com sucesso para ${user.email}!`);
      fetchUsers();
      if (cartModalUser && cartModalUser.id === user.id) {
        setCartModalUser((prev) =>
          prev
            ? {
                ...prev,
                cartData: {
                  ...prev.cartData,
                  reminderSentAt: data.reminderSentAt,
                },
              }
            : null
        );
      }
    } catch (err) {
      showToast('error', 'Erro de conexão ao enviar e-mail.');
    } finally {
      setSendingEmailUserId(null);
    }
  };

  // Trigger bulk Cron check for all 30-day abandoned carts
  const handleRunBulk30DaysReminders = async () => {
    if (!window.confirm(`Deseja disparar a rotina de e-mails para todos os clientes com carrinhos parados há mais de 30 dias (${counts.eligibleForEmail} elegíveis)?`)) {
      return;
    }

    setRunningCronLoading(true);
    try {
      const res = await fetch('/api/cron/abandoned-cart', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        showToast('error', data.error || 'Erro ao executar rotina de e-mails.');
        return;
      }

      const sent = data.summary?.sent || 0;
      const errors = data.summary?.errors || 0;

      if (sent > 0) {
        showToast('success', `Sucesso! ${sent} ${sent === 1 ? 'e-mail enviado' : 'e-mails enviados'} para clientes com carrinho parado há 30+ dias.`);
      } else if (errors > 0) {
        showToast('error', `Ocorreram erros ao enviar ${errors} e-mails. Verifique as credenciais no .env.`);
      } else {
        showToast('success', 'Rotina executada: nenhum cliente elegível com 30+ dias sem lembrete no momento.');
      }

      fetchUsers();
    } catch (err) {
      showToast('error', 'Erro de conexão ao executar rotina automática.');
    } finally {
      setRunningCronLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[100] max-w-md p-4 shadow-xl border text-xs uppercase tracking-wider font-semibold transition-all duration-300 flex items-center justify-between gap-4 ${
            toast.type === 'error'
              ? 'bg-black text-[#ff6b6b] border-[#ba1a1a]'
              : 'bg-black text-[#4ade80] border-[#146c2e]'
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="text-white hover:opacity-75 font-mono text-sm">
            &times;
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-[10px] text-text-secondary uppercase tracking-[0.25em] font-semibold block mb-1">
            Gestão de Clientes & Recuperação de Vendas
          </span>
          <h1 className="font-display uppercase tracking-widest text-2xl md:text-3xl font-bold">
            Gerenciar Usuários & Clientes
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Veja dados cadastrados, histórico de compras, itens salvos na sacola com tempo decorrido, recuperação via WhatsApp e envio automático por e-mail (Gmail/Hostinger) para itens parados há 30 dias.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Button to run 30-day abandoned cart reminders */}
          <button
            onClick={handleRunBulk30DaysReminders}
            disabled={runningCronLoading}
            className="bg-amber-600 text-white text-xs uppercase tracking-wider font-bold py-3.5 px-5 hover:bg-amber-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            title="Disparar e-mails automáticos para carrinhos parados há mais de 30 dias"
          >
            {runningCronLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            Disparar E-mails 30d ({counts.eligibleForEmail})
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary text-white text-xs uppercase tracking-wider font-bold py-3.5 px-6 hover:bg-black transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Novo Usuário / Vendedor
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-8">
        <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm">
          <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold block mb-1">
            Total Cadastrados
          </span>
          <p className="text-2xl md:text-3xl font-display font-bold">{counts.all}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm">
          <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold block mb-1">
            Clientes (Loja)
          </span>
          <p className="text-2xl md:text-3xl font-display font-bold text-primary">{counts.customers}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm">
          <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold block mb-1">
            Carrinhos Ativos
          </span>
          <p className="text-2xl md:text-3xl font-display font-bold text-amber-600 flex items-center gap-1.5">
            {counts.withCart}
          </p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm">
          <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold block mb-1">
            Parados 30d+
          </span>
          <p className="text-2xl md:text-3xl font-display font-bold text-[#ba1a1a] flex items-center gap-1.5">
            {counts.cart30d}
          </p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm">
          <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold block mb-1">
            Vendedores / Admins
          </span>
          <p className="text-2xl md:text-3xl font-display font-bold text-blue-600">{counts.vendors + counts.admins}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold block mb-1">
            Verificados
          </span>
          <p className="text-2xl md:text-3xl font-display font-bold text-[#146c2e]">
            {counts.verified}{' '}
            <span className="text-xs font-normal text-text-secondary">
              ({counts.all > 0 ? Math.round((counts.verified / counts.all) * 100) : 0}%)
            </span>
          </p>
        </div>
      </div>

      {/* Toolbar: Filters and Search */}
      <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-2 text-[11px] uppercase tracking-wider font-bold transition-colors ${
              roleFilter === 'ALL'
                ? 'bg-primary text-white'
                : 'bg-surface-off text-text-secondary hover:text-text-primary border border-border-hairline'
            }`}
          >
            Todos ({counts.all})
          </button>
          <button
            onClick={() => setRoleFilter('HAS_CART')}
            className={`px-3 py-2 text-[11px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 ${
              roleFilter === 'HAS_CART'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border border-amber-500/30'
            }`}
          >
            <span>🛒 Com Carrinho ({counts.withCart})</span>
          </button>
          <button
            onClick={() => setRoleFilter('CART_30D')}
            className={`px-3 py-2 text-[11px] uppercase tracking-wider font-bold transition-colors flex items-center gap-1.5 ${
              roleFilter === 'CART_30D'
                ? 'bg-[#ba1a1a] text-white'
                : 'bg-[#ba1a1a]/10 text-[#ba1a1a] hover:bg-[#ba1a1a]/20 border border-[#ba1a1a]/30'
            }`}
          >
            <span>⏰ Parados 30d+ ({counts.cart30d})</span>
          </button>
          <button
            onClick={() => setRoleFilter('USER')}
            className={`px-3 py-2 text-[11px] uppercase tracking-wider font-bold transition-colors ${
              roleFilter === 'USER'
                ? 'bg-primary text-white'
                : 'bg-surface-off text-text-secondary hover:text-text-primary border border-border-hairline'
            }`}
          >
            Clientes ({counts.customers})
          </button>
          <button
            onClick={() => setRoleFilter('VENDOR')}
            className={`px-3 py-2 text-[11px] uppercase tracking-wider font-bold transition-colors ${
              roleFilter === 'VENDOR'
                ? 'bg-primary text-white'
                : 'bg-surface-off text-text-secondary hover:text-text-primary border border-border-hairline'
            }`}
          >
            Vendedores ({counts.vendors})
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-2 text-[11px] uppercase tracking-wider font-bold transition-colors ${
              roleFilter === 'ADMIN'
                ? 'bg-primary text-white'
                : 'bg-surface-off text-text-secondary hover:text-text-primary border border-border-hairline'
            }`}
          >
            Admins ({counts.admins})
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="border border-border-hairline bg-surface-off p-2.5 text-xs text-text-primary focus:outline-none focus:border-primary uppercase tracking-wider font-semibold"
          >
            <option value="ALL">Status: Todos</option>
            <option value="VERIFIED">Apenas Verificados</option>
            <option value="PENDING">Apenas Pendentes</option>
          </select>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:w-72">
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-border-hairline bg-surface-off p-2.5 pl-9 text-xs text-text-primary focus:outline-none focus:border-primary placeholder:text-text-secondary/60"
            />
            <svg
              className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs"
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={fetchUsers}
            title="Recarregar lista"
            className="p-2.5 border border-border-hairline bg-surface-off hover:bg-surface-container text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-off border-b border-border-hairline">
            <tr>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Usuário</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Contato</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Sacola / Carrinho</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Nível / Cargo</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Status</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Pedidos</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-hairline">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary animate-pulse uppercase tracking-wider font-semibold">
                  Carregando lista de usuários...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-secondary">
                  Nenhum usuário encontrado com os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isMainAdmin = u.email === 'admin@chromewear.com';
                const cart = getParsedCart(u.cartData);
                const hasCart = cart.length > 0;
                const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                const timeInfo = hasCart ? getTimeInCart(cart[0]?.addedAt, u.updatedAt) : null;
                const cleanPhone = getCleanPhone(u.phone);
                const reminderSentAt = getCartReminderSentAt(u.cartData);
                const is30DaysOld = timeInfo && timeInfo.daysAgo >= 30;

                return (
                  <tr key={u.id} className="hover:bg-surface-off/60 transition-colors">
                    {/* User Name & Initials */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-none bg-surface-container border border-border-hairline flex items-center justify-center font-display font-bold text-xs uppercase text-primary">
                          {u.name ? u.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                            {u.name}
                            {isMainAdmin && (
                              <span className="text-[9px] bg-black text-white px-1.5 py-0.5 uppercase tracking-widest font-bold">
                                Root
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] font-mono text-text-secondary/70">
                            ID: {u.id.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <p className="font-medium text-text-primary">{u.email}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-text-secondary">{formatPhone(u.phone)}</span>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-0.5"
                              title="Abrir WhatsApp"
                            >
                              <span>WhatsApp</span>
                              &rarr;
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cart Info / Status */}
                    <td className="p-4">
                      {hasCart ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 border flex items-center gap-1 ${
                              is30DaysOld
                                ? 'bg-[#ba1a1a]/15 text-[#ba1a1a] border-[#ba1a1a]/30'
                                : 'bg-amber-500/15 text-amber-800 border border-amber-500/30'
                            }`}>
                              🛒 {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                            </span>
                            <span className="font-semibold text-text-primary text-[11px]">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-text-secondary">
                            <span className={is30DaysOld ? 'text-[#ba1a1a] font-bold' : ''}>
                              ⏳ Há {timeInfo?.label}
                            </span>
                            {reminderSentAt && (
                              <span className="text-emerald-700 font-bold bg-emerald-500/10 px-1 border border-emerald-500/20" title={`Lembrete enviado em: ${new Date(reminderSentAt).toLocaleDateString('pt-BR')}`}>
                                ✉️ E-mail enviado
                              </span>
                            )}
                            <span>•</span>
                            <button
                              onClick={() => setCartModalUser(u)}
                              className="text-primary font-bold uppercase hover:underline"
                            >
                              Ver Detalhes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-text-secondary/60 text-[11px]">Vazio</span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <span
                        className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 inline-block ${
                          u.role === 'ADMIN'
                            ? 'bg-black text-white'
                            : u.role === 'VENDOR'
                            ? 'bg-blue-600/10 text-blue-700 border border-blue-600/20'
                            : 'bg-surface-container text-text-primary border border-border-hairline'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'Administrador' : u.role === 'VENDOR' ? 'Vendedor' : 'Cliente'}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="p-4">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-[#146c2e] bg-[#146c2e]/10 px-2 py-1 border border-[#146c2e]/20">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-700 bg-amber-500/10 px-2 py-1 border border-amber-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Pendente
                        </span>
                      )}
                    </td>

                    {/* Orders */}
                    <td className="p-4">
                      {u.ordersCount > 0 ? (
                        <span className="font-semibold text-text-primary">
                          {u.ordersCount} {u.ordersCount === 1 ? 'pedido' : 'pedidos'}
                        </span>
                      ) : (
                        <span className="text-text-secondary/60">Sem compras</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      {hasCart && (
                        <button
                          onClick={() => setCartModalUser(u)}
                          title="Recuperar Carrinho via WhatsApp ou E-mail"
                          className="bg-emerald-600 text-white text-xs uppercase tracking-wider font-bold py-1.5 px-3 hover:bg-emerald-700 transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                          </svg>
                          Recuperar
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="bg-surface-off border border-border-hairline text-text-primary text-xs uppercase tracking-wider font-bold py-1.5 px-3 hover:bg-primary hover:text-white transition-colors"
                      >
                        Editar
                      </button>

                      {!isMainAdmin && (
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          className="text-[#ba1a1a] hover:text-white hover:bg-[#ba1a1a] border border-transparent hover:border-[#ba1a1a] text-xs uppercase tracking-wider font-bold py-1.5 px-2.5 transition-colors"
                        >
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ================= CART RECOVERY MODAL ================= */}
      {cartModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setCartModalUser(null)}
          />

          <div className="relative w-full max-w-3xl bg-surface-pure border border-border-hairline shadow-2xl p-6 md:p-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-hairline pb-4 mb-6">
              <div>
                <span className="text-[10px] text-amber-600 uppercase tracking-[0.2em] font-bold block">
                  Recuperação de Carrinho Abandonado
                </span>
                <h2 className="font-display uppercase tracking-widest text-xl font-bold mt-1">
                  Sacola de {cartModalUser.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-text-secondary">
                  <span>{cartModalUser.email}</span>
                  <span>•</span>
                  <span>{formatPhone(cartModalUser.phone)}</span>
                  <span>•</span>
                  <span>ID: {cartModalUser.id.slice(0, 8)}...</span>
                </div>
              </div>
              <button
                onClick={() => setCartModalUser(null)}
                className="text-text-secondary hover:text-text-primary p-2 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Cart Items List */}
            {(() => {
              const cart = getParsedCart(cartModalUser.cartData);
              const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
              const cleanPhone = getCleanPhone(cartModalUser.phone);
              const reminderSentAt = getCartReminderSentAt(cartModalUser.cartData);
              const oldestItem = cart[0];
              const timeInfo = getTimeInCart(oldestItem?.addedAt, cartModalUser.updatedAt);
              const is30DaysOld = timeInfo.daysAgo >= 30;

              if (cart.length === 0) {
                return (
                  <div className="text-center py-12 text-text-secondary">
                    <p className="text-sm">A sacola deste cliente está vazia no momento.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Automated 30-day email alert banner */}
                  <div className="border border-border-hairline bg-surface-off p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">✉️</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Lembrete por E-mail (Gmail / Hostinger)
                        </span>
                        {is30DaysOld ? (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-[#ba1a1a]/15 text-[#ba1a1a] border border-[#ba1a1a]/30">
                            Parado há 30+ dias
                          </span>
                        ) : (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-blue-500/15 text-blue-700 border border-blue-500/30">
                            {timeInfo.daysAgo} dias de inatividade
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary">
                        {reminderSentAt ? (
                          <span className="text-emerald-700 font-semibold">
                            ✓ Lembrete enviado em {new Date(reminderSentAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
                          </span>
                        ) : is30DaysOld ? (
                          <span className="text-[#ba1a1a] font-semibold">
                            ⚠️ Este item está há mais de 30 dias parado e ainda não recebeu o e-mail de recuperação.
                          </span>
                        ) : (
                          <span>O disparo automático ocorre aos 30 dias de inatividade, mas você pode enviar manualmente agora.</span>
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSendEmailReminder(cartModalUser)}
                      disabled={sendingEmailUserId === cartModalUser.id}
                      className="bg-black text-white hover:bg-neutral-800 text-[11px] uppercase tracking-wider font-bold py-2 px-4 transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap self-stretch sm:self-auto justify-center"
                    >
                      {sendingEmailUserId === cartModalUser.id ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Enviando...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {reminderSentAt ? 'Reenviar E-mail' : 'Enviar E-mail Agora'}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Items list */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold">
                        Itens Salvos na Sacola ({cart.length})
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        Total:{' '}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                      </span>
                    </div>

                    <div className="divide-y divide-border-hairline border border-border-hairline bg-surface-off">
                      {cart.map((item) => {
                        const itemTime = getTimeInCart(item.addedAt, cartModalUser.updatedAt);

                        return (
                          <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 bg-surface-container border border-border-hairline flex-shrink-0 overflow-hidden">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-text-secondary font-mono">
                                    IMG
                                  </div>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-text-primary">{item.name}</h4>
                                <p className="text-xs text-text-secondary mt-0.5">
                                  Tamanho: <span className="font-bold text-text-primary">{item.size}</span> | Qtd: {item.quantity} | Ref: {item.ref}
                                </p>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 border ${
                                    itemTime.daysAgo >= 30
                                      ? 'text-[#ba1a1a] bg-[#ba1a1a]/10 border-[#ba1a1a]/20'
                                      : 'text-amber-700 bg-amber-500/10 border-amber-500/20'
                                  }`}>
                                    ⏳ No carrinho há {itemTime.label}
                                  </span>
                                  <span className="text-[10px] text-text-secondary font-mono">
                                    ({itemTime.exactDate})
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                              <span className="text-sm font-bold text-text-primary">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                  item.price * item.quantity
                                )}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSendRecoveryWhatsApp(cartModalUser, item)}
                                  className="text-[10px] uppercase tracking-wider font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 transition-colors flex items-center gap-1"
                                >
                                  📲 WhatsApp
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCopyRecoveryMessage(cartModalUser, item)}
                                  className="text-[10px] uppercase tracking-wider font-semibold border border-border-hairline bg-surface-pure hover:bg-surface-off px-2 py-1.5 transition-colors"
                                  title="Copiar texto para este item"
                                >
                                  📋 Copiar
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* WhatsApp Message Preview Box */}
                  <div className="bg-surface-off border border-border-hairline p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Prévia da Mensagem de Recuperação (WhatsApp)
                        </h3>
                      </div>
                      <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
                        Personalizada com tempo decorrido
                      </span>
                    </div>

                    <div className="bg-white border border-border-hairline p-4 rounded-none font-sans text-xs text-text-primary whitespace-pre-wrap leading-relaxed shadow-inner">
                      {buildFullCartRecoveryText(cartModalUser, cart)}
                    </div>

                    {!cleanPhone && (
                      <p className="text-[11px] text-[#ba1a1a] font-semibold bg-[#ba1a1a]/10 p-2.5 border border-[#ba1a1a]/20">
                        ⚠️ Atenção: Este cliente não possui um WhatsApp cadastrado. Utilize o botão acima para enviar o lembrete por E-mail ou copie o texto.
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleCopyRecoveryMessage(cartModalUser)}
                        className="w-full sm:w-auto border border-border-hairline bg-surface-pure py-3 px-6 text-xs uppercase tracking-wider font-bold hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
                      >
                        📋 Copiar Mensagem Completa
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSendRecoveryWhatsApp(cartModalUser)}
                        disabled={!cleanPhone}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-8 text-xs uppercase tracking-wider font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                        Abrir e Enviar no WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================= EDIT USER MODAL ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !editLoading && setEditingUser(null)}
          />

          <div className="relative w-full max-w-2xl bg-surface-pure border border-border-hairline shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-hairline pb-4 mb-6">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-semibold block">
                  Edição Administrativa
                </span>
                <h2 className="font-display uppercase tracking-widest text-xl font-bold mt-1">
                  Editar Dados de {editingUser.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-text-secondary">ID: {editingUser.id}</span>
                  <span className="text-text-secondary text-[10px]">•</span>
                  <span className="text-[10px] text-text-secondary">
                    Cadastrado em {new Date(editingUser.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                disabled={editLoading}
                className="text-text-secondary hover:text-text-primary p-2 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                    E-mail de Acesso *
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                    Nível de Acesso (Cargo)
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                    disabled={editingUser.email === 'admin@chromewear.com'}
                    className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-60"
                  >
                    <option value="USER">Cliente (Acesso Comum à Loja)</option>
                    <option value="VENDOR">Vendedor (Painel de Gestão)</option>
                    <option value="ADMIN">Administrador (Acesso Total)</option>
                  </select>
                </div>
              </div>

              {/* Verification Status */}
              <div className="bg-surface-off border border-border-hairline p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block text-text-primary">
                    Conta Verificada
                  </span>
                  <span className="text-[11px] text-text-secondary">
                    Define se o usuário precisa ou não validar código por e-mail para fazer login.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isVerified}
                    onChange={(e) => setEditFormData({ ...editFormData, isVerified: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border-hairline peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Password Section */}
              <div className="bg-surface-off border border-border-hairline p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 text-primary mt-0.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      Segurança & Criptografia da Senha
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                      Por segurança, a senha atual é protegida com <strong>Hash Bcrypt irreversível</strong> e não pode ser revelada em texto puro. Porém, você pode <strong>modificar ou redefinir uma nova senha</strong> para o usuário diretamente abaixo.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-hairline/60">
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                    Nova Senha (deixe vazio se não quiser alterar)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showEditPass ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={editFormData.newPassword}
                        onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                        className="w-full border border-border-hairline bg-surface-pure p-3 pr-10 text-sm text-text-primary focus:outline-none focus:border-primary font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPass(!showEditPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs"
                      >
                        {showEditPass ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleGeneratePasswordForEdit}
                      className="bg-surface-pure border border-border-hairline text-text-primary text-xs uppercase tracking-wider font-semibold py-3 px-4 hover:border-primary transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Gerar Senha
                    </button>

                    {editFormData.newPassword && (
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(editFormData.newPassword)}
                        className="bg-primary text-white text-xs uppercase tracking-wider font-semibold py-3 px-4 hover:bg-black transition-colors whitespace-nowrap"
                      >
                        {copiedPassword ? 'Copiado!' : 'Copiar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Active Cart Section in Edit Modal */}
              {(() => {
                const cart = getParsedCart(editingUser.cartData);
                if (cart.length === 0) return null;
                const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

                return (
                  <div className="border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🛒</span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Sacola Ativa do Cliente ({cart.length} itens - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)})
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCartModalUser(editingUser);
                          setEditingUser(null);
                        }}
                        className="text-[10px] uppercase font-bold text-amber-800 hover:underline"
                      >
                        Abrir Recuperação Completa &rarr;
                      </button>
                    </div>

                    <div className="space-y-2">
                      {cart.map((item) => {
                        const timeInfo = getTimeInCart(item.addedAt, editingUser.updatedAt);
                        return (
                          <div key={item.id} className="flex items-center justify-between text-xs bg-white p-2.5 border border-border-hairline">
                            <div>
                              <p className="font-semibold text-text-primary">{item.name}</p>
                              <p className="text-[10px] text-text-secondary">
                                Tam: {item.size} • Qtd: {item.quantity} • No carrinho há {timeInfo.label}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSendRecoveryWhatsApp(editingUser, item)}
                                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase"
                              >
                                📲 WhatsApp
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Orders summary if available */}
              {editingUser.orders && editingUser.orders.length > 0 && (
                <div className="border border-border-hairline p-4">
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold block mb-3">
                    Histórico Recente de Pedidos ({editingUser.orders.length})
                  </span>
                  <div className="space-y-2">
                    {editingUser.orders.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between text-xs bg-surface-off p-2.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-text-secondary">#{ord.id.slice(-6)}</span>
                          <span className="font-bold text-text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ord.totalPrice)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-primary/10 text-primary">
                            {ord.status}
                          </span>
                          <span className="text-text-secondary text-[10px]">
                            {new Date(ord.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-hairline">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  disabled={editLoading}
                  className="border border-border-hairline bg-surface-off py-3 px-6 text-xs uppercase tracking-wider font-semibold hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-primary text-white py-3 px-8 text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {editLoading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {editLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= CREATE USER MODAL ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !createLoading && setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-xl bg-surface-pure border border-border-hairline shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-border-hairline pb-4 mb-6">
              <div>
                <span className="text-[10px] text-text-secondary uppercase tracking-[0.2em] font-semibold block">
                  Novo Cadastro
                </span>
                <h2 className="font-display uppercase tracking-widest text-xl font-bold mt-1">
                  Cadastrar Usuário / Vendedor
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                disabled={createLoading}
                className="text-text-secondary hover:text-text-primary p-2 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: João da Silva"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                  E-mail *
                </label>
                <input
                  type="email"
                  placeholder="usuario@chromewear.com"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                    Nível de Acesso (Cargo)
                  </label>
                  <select
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value as any })}
                    className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="VENDOR">Vendedor (Painel de Gestão)</option>
                    <option value="USER">Cliente (Loja CW)</option>
                    <option value="ADMIN">Administrador (Total)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
                  Senha Provisória *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showCreatePass ? 'text' : 'password'}
                      placeholder="Mínimo de 6 caracteres"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      className="w-full border border-border-hairline bg-surface-off p-3 pr-10 text-sm text-text-primary focus:outline-none focus:border-primary font-mono"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCreatePass(!showCreatePass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary text-xs"
                    >
                      {showCreatePass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePasswordForCreate}
                    className="bg-surface-off border border-border-hairline text-text-primary text-xs uppercase tracking-wider font-semibold py-3 px-4 hover:border-primary transition-colors whitespace-nowrap"
                  >
                    Gerar
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="createVerified"
                  checked={createFormData.isVerified}
                  onChange={(e) => setCreateFormData({ ...createFormData, isVerified: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <label htmlFor="createVerified" className="text-xs uppercase tracking-wider font-semibold cursor-pointer">
                  Marcar conta como já verificada (dispensa código de e-mail)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-hairline">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createLoading}
                  className="border border-border-hairline bg-surface-off py-3 px-6 text-xs uppercase tracking-wider font-semibold hover:bg-surface-container transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-primary text-white py-3 px-8 text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {createLoading && (
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {createLoading ? 'Criando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
