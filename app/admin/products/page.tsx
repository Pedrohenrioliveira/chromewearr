'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ProductsAdmin() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
      } else {
        alert('Erro ao excluir');
      }
    } catch (e) {
      alert('Erro de conexão');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-display uppercase tracking-widest text-2xl font-bold">Produtos</h1>
        <Link 
          href="/admin/products/new" 
          className="bg-primary text-white text-xs uppercase tracking-wider font-bold py-3 px-6 hover:bg-black transition-colors"
        >
          Novo Produto
        </Link>
      </div>

      <div className="bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-off border-b border-border-hairline">
            <tr>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Imagem</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Nome</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Preço</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">Estoque</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center">Carregando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center">Nenhum produto cadastrado.</td></tr>
            ) : (
              products.map((prod) => (
                <tr key={prod.id} className="border-b border-border-hairline hover:bg-surface-off/50 transition-colors">
                  <td className="p-4">
                    <img src={prod.imageUrl} alt={prod.name} className="w-12 h-12 object-cover border border-border-hairline" />
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{prod.name}</p>
                    <p className="text-xs text-text-secondary">{prod.category?.name} • {prod.ref}</p>
                  </td>
                  <td className="p-4 font-mono text-xs">
                    R$ {prod.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4">
                    {prod.inStock ? (
                      <span className="bg-[#146c2e]/10 text-[#146c2e] text-[10px] font-bold uppercase tracking-wider px-2 py-1">Ativo</span>
                    ) : (
                      <span className="bg-[#ba1a1a]/10 text-[#ba1a1a] text-[10px] font-bold uppercase tracking-wider px-2 py-1">Esgotado</span>
                    )}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      href={`/admin/products/${prod.id}`}
                      className="text-xs uppercase tracking-wider font-bold text-primary hover:underline"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(prod.id)}
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
