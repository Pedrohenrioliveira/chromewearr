'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [isLocked, setIsLocked] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        setIsLocked(data.isLocked || false);
        setAccessCode(data.accessCode || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked, accessCode })
      });
      if (res.ok) {
        setMessage('Configurações salvas com sucesso!');
      } else {
        setMessage('Erro ao salvar.');
      }
    } catch (err) {
      setMessage('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 md:p-8">Carregando...</div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/admin" className="text-[10px] text-text-secondary uppercase tracking-widest font-bold hover:text-primary transition-colors">
          &larr; Voltar para Dashboard
        </Link>
        <h1 className="font-display uppercase tracking-widest text-2xl font-bold mt-4">Configurações do Site</h1>
      </div>

      <form onSubmit={handleSave} className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-6">
        {message && (
          <div className="p-4 bg-primary/10 text-primary text-xs font-bold uppercase">{message}</div>
        )}

        <div>
          <h2 className="font-display uppercase font-bold text-lg border-b border-border-hairline pb-2 mb-4">Acesso Antecipado / Bloqueio</h2>
          <p className="text-sm text-text-secondary mb-6">Bloqueie a loja para o público e permita o acesso apenas com uma senha especial. Ideal para lançamentos exclusivos.</p>

          <label className="flex items-center gap-3 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="w-5 h-5 accent-primary"
            />
            <span className="text-sm uppercase tracking-widest font-semibold">Ativar bloqueio do site (Loja)</span>
          </label>

          {isLocked && (
            <div className="space-y-2">
              <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Senha de Acesso</label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                placeholder="Ex: VIP2024"
                required={isLocked}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white py-4 px-8 text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  );
}
