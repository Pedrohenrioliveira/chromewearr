'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    users: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We will fetch real stats here later
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-4 md:p-8">Carregando métricas...</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display uppercase tracking-widest text-2xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm">
          <h2 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Total de Produtos</h2>
          <p className="text-4xl font-display font-bold">{stats.products}</p>
        </div>
        <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm">
          <h2 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Total de Categorias</h2>
          <p className="text-4xl font-display font-bold">{stats.categories}</p>
        </div>
        <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm">
          <h2 className="text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Vendedores Ativos</h2>
          <p className="text-4xl font-display font-bold">{stats.users}</p>
        </div>
      </div>

      <h2 className="font-display uppercase tracking-widest text-lg font-bold mb-6">Acesso Rápido</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link href="/admin/products/new" className="bg-primary text-white text-center py-4 px-6 text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors">
          Cadastrar Produto
        </Link>
        <Link href="/admin/settings" className="bg-surface-pure border border-border-hairline text-center py-4 px-6 text-xs uppercase tracking-wider font-bold hover:border-primary transition-colors">
          Travar Loja (Senhas)
        </Link>
        <Link href="/admin/banner" className="bg-surface-pure border border-border-hairline text-center py-4 px-6 text-xs uppercase tracking-wider font-bold hover:border-primary transition-colors">
          Editar Banner
        </Link>
        <Link href="/admin/categories" className="bg-surface-pure border border-border-hairline text-center py-4 px-6 text-xs uppercase tracking-wider font-bold hover:border-primary transition-colors">
          Gerenciar Categorias
        </Link>
      </div>
    </div>
  );
}
