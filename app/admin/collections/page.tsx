'use client';

import React, { useEffect, useState } from 'react';

export default function CollectionsAdmin() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ id: '', name: '', slug: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/collections');
      if (res.ok) {
        setCollections(await res.json());
      }
    } catch (e) {
      setMessage('Erro ao carregar coleções.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/collections', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Erro ao salvar.');
        return;
      }
      
      setMessage('Coleção salva com sucesso!');
      setFormData({ id: '', name: '', slug: '' });
      setIsEditing(false);
      fetchCollections();
    } catch (err) {
      setMessage('Erro de conexão.');
    }
  };

  const handleEdit = (col: any) => {
    setFormData({ id: col.id, name: col.name, slug: col.slug });
    setIsEditing(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta coleção?')) return;
    try {
      const res = await fetch(`/api/admin/collections?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Erro ao excluir');
      } else {
        fetchCollections();
      }
    } catch (err) {
      alert('Erro de conexão.');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl">
      <h1 className="font-display uppercase tracking-widest text-2xl font-bold mb-8">Gerenciar Coleções</h1>

      {message && (
        <div className={`mb-6 p-4 text-xs uppercase tracking-wider font-semibold ${message.includes('Erro') ? 'bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-12 bg-surface-pure border border-border-hairline p-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Nome da Coleção</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              setFormData({ ...formData, name, slug: isEditing ? formData.slug : slug });
            }}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            required
          />
        </div>
        <div className="flex-1 w-full">
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Slug (URL)</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            required
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            type="submit"
            className="bg-primary text-white text-xs uppercase tracking-wider font-bold py-3 px-6 hover:bg-black transition-colors"
          >
            {isEditing ? 'Atualizar' : 'Criar'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setFormData({ id: '', name: '', slug: '' });
              }}
              className="bg-surface-off border border-border-hairline text-text-primary text-xs uppercase tracking-wider font-bold py-3 px-4 hover:bg-border-hairline transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <div className="bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-off border-b border-border-hairline">
            <tr>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Nome</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Slug</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Qtd. Produtos</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">Carregando...</td></tr>
            ) : collections.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center">Nenhuma coleção encontrada.</td></tr>
            ) : (
              collections.map((col) => (
                <tr key={col.id} className="border-b border-border-hairline hover:bg-surface-off/50 transition-colors">
                  <td className="p-4 font-semibold">{col.name}</td>
                  <td className="p-4 font-mono text-xs">{col.slug}</td>
                  <td className="p-4">{col._count?.products || 0}</td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(col)}
                      className="text-xs uppercase tracking-wider font-bold text-primary hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(col.id)}
                      className="text-xs uppercase tracking-wider font-bold text-[#ba1a1a] hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
