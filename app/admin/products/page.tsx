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
          className="h-9 inline-flex items-center px-4 bg-primary text-white text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors"
        >
          Novo Produto
        </Link>
      </div>

      <div className="bg-surface-pure border border-border-hairline shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-surface-off border-b border-border-hairline">
            <tr>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold whitespace-nowrap">Imagem</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold whitespace-nowrap">Nome</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold whitespace-nowrap">Preço</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold whitespace-nowrap">Estoque</th>
              <th className="p-4 text-[10px] text-text-secondary uppercase tracking-widest font-semibold text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-hairline">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-secondary uppercase tracking-wider font-semibold text-xs">Carregando...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-text-secondary text-xs">Nenhum produto cadastrado.</td></tr>
            ) : (
              products.map((prod) => (
                <tr key={prod.id} className="hover:bg-surface-off/50 transition-colors">
                  <td className="p-4 align-middle">
                    <img src={prod.imageUrl} alt={prod.name} className="w-12 h-12 object-cover border border-border-hairline flex-shrink-0" />
                  </td>
                  <td className="p-4 align-middle">
                    <p className="font-semibold text-text-primary text-sm">{prod.name}</p>
                    <p className="text-xs text-text-secondary font-mono mt-0.5">{prod.category?.name} • {prod.ref}</p>
                  </td>
                  <td className="p-4 align-middle font-mono text-xs font-semibold text-text-primary whitespace-nowrap">
                    R$ {prod.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4 align-middle whitespace-nowrap">
                    {prod.inStock ? (
                      <span className="bg-[#146c2e]/10 text-[#146c2e] border border-[#146c2e]/20 text-[10px] font-bold uppercase tracking-wider px-2 py-1 inline-block">Ativo</span>
                    ) : (
                      <span className="bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/20 text-[10px] font-bold uppercase tracking-wider px-2 py-1 inline-block">Esgotado</span>
                    )}
                  </td>
                  <td className="p-4 align-middle text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${prod.id}`}
                        className="h-8 inline-flex items-center justify-center px-3 bg-surface-off border border-border-hairline text-text-primary text-[11px] uppercase tracking-wider font-bold hover:border-primary hover:bg-surface-pure transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(prod.id)}
                        className="h-8 inline-flex items-center justify-center px-3 bg-surface-off border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white hover:border-[#ba1a1a] text-[11px] uppercase tracking-wider font-bold transition-colors"
                      >
                        Excluir
                      </button>
                    </div>
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
