'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface OrderSummary {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: string;
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

export default function UsersAdmin() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'VENDOR' | 'ADMIN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');

  // Modals state
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
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

  // Toast / notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4500);
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
      // Role filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

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
    return {
      all: users.length,
      customers: users.filter((u) => u.role === 'USER').length,
      vendors: users.filter((u) => u.role === 'VENDOR').length,
      admins: users.filter((u) => u.role === 'ADMIN').length,
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

  // Generate random secure password
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

  // Format phone number helper
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

  // WhatsApp link helper
  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      const fullNumber = digits.startsWith('55') ? digits : `55${digits}`;
      return `https://wa.me/${fullNumber}`;
    }
    return null;
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
            Controle de Acessos & Perfis
          </span>
          <h1 className="font-display uppercase tracking-widest text-2xl md:text-3xl font-bold">
            Gerenciar Usuários & Clientes
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            Acesse todos os dados cadastrados pelos clientes e equipe. Edite dados de contato, permissões ou redefina senhas com segurança criptografada.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-primary text-white text-xs uppercase tracking-wider font-bold py-3.5 px-6 hover:bg-black transition-colors self-start md:self-auto flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário / Vendedor
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-8">
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
            Vendedores
          </span>
          <p className="text-2xl md:text-3xl font-display font-bold text-blue-600">{counts.vendors}</p>
        </div>

        <div className="bg-surface-pure border border-border-hairline p-4 shadow-sm">
          <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold block mb-1">
            Administradores
          </span>
          <p className="text-2xl md:text-3xl font-display font-bold text-purple-600">{counts.admins}</p>
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
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Nível / Cargo</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Status</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Pedidos</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Data Cadastro</th>
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
                const waLink = getWhatsAppLink(u.phone);
                const isMainAdmin = u.email === 'admin@chromewear.com';

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
                          {waLink && (
                            <a
                              href={waLink}
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

                    {/* Registration Date */}
                    <td className="p-4 text-text-secondary">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
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

              {/* Password Section (Notice about encryption and ability to modify) */}
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
                  {editFormData.newPassword && (
                    <span className="text-[10px] text-emerald-600 block mt-1.5 font-medium">
                      ✓ A nova senha será criptografada com Bcrypt antes de ser salva no banco de dados.
                    </span>
                  )}
                </div>
              </div>

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
