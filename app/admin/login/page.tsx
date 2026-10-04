'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      // Check if Admin or Vendor
      if (data.user.role === 'ADMIN' || data.user.role === 'VENDOR') {
        localStorage.setItem('chromewear_user', JSON.stringify(data.user));
        router.push('/admin');
      } else {
        setError('Acesso não autorizado. Sua conta não é administrativa.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-surface-off flex flex-col items-center justify-center px-4">
      <Link href="/" className="font-display text-2xl uppercase tracking-[0.2em] font-bold mb-12 hover:text-primary transition-colors text-text-primary">
        CHROMEWEAR
      </Link>
      
      <div className="w-full max-w-sm bg-surface-pure border border-border-hairline p-8 shadow-sm">
        <h1 className="font-display uppercase tracking-widest text-lg font-bold mb-6 text-center text-text-primary">
          Acesso Restrito
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-[#ba1a1a]/10 border border-[#ba1a1a]/20 text-[#ba1a1a] text-xs uppercase tracking-wider font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
              E-mail Administrativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-border-hairline bg-transparent pb-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-border-hairline bg-transparent pb-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white text-xs uppercase tracking-[0.2em] font-bold py-4 hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
