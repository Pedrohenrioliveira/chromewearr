'use client';

import React, { useEffect, useState } from 'react';

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'VENDOR' });
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Erro ao salvar.');
        return;
      }
      
      setMessage('Usuário criado com sucesso!');
      setFormData({ name: '', email: '', password: '', role: 'VENDOR' });
      fetchUsers();
    } catch (err) {
      setMessage('Erro de conexão.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir usuário?')) return;
    try {
      await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      fetchUsers();
    } catch (e) {
      alert('Erro de conexão');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <h1 className="font-display uppercase tracking-widest text-2xl font-bold mb-8">Gerenciar Vendedores/Admins</h1>

      {message && (
        <div className={`mb-6 p-4 text-xs uppercase tracking-wider font-semibold ${message.includes('Erro') ? 'bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-12 bg-surface-pure border border-border-hairline p-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Nome</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">E-mail</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Senha Provisória</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
            required
          />
        </div>
        <div className="w-full md:w-32">
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Nível</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary"
          >
            <option value="VENDOR">Vendedor</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button type="submit" className="bg-primary text-white text-xs uppercase tracking-wider font-bold py-3 px-6 hover:bg-black w-full md:w-auto">
          Adicionar
        </button>
      </form>

      <div className="bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-off border-b border-border-hairline">
            <tr>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Nome</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">E-mail</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Cargo</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">Carregando...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="border-b border-border-hairline hover:bg-surface-off/50">
                <td className="p-4 font-semibold">{u.name}</td>
                <td className="p-4 text-text-secondary">{u.email}</td>
                <td className="p-4">
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 ${u.role === 'ADMIN' ? 'bg-[#146c2e]/10 text-[#146c2e]' : 'bg-primary/10 text-primary'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {u.email !== 'admin@chromewear.com' && (
                    <button onClick={() => handleDelete(u.id)} className="text-[#ba1a1a] text-xs font-bold uppercase hover:underline">
                      Excluir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
