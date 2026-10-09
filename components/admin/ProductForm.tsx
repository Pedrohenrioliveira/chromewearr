'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    price: '',
    categoryId: '',
    collectionId: '',
    ref: '',
    sub: '',
    description: '',
    about: '',
    composition: '',
    imageUrl: '',
    sizes: 'P,M,G,GG',
    sizeMatrix: [] as any[],
    inStock: true,
    isFeatured: false,
    status: 'ACTIVE'
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categories').then(res => res.json()),
      fetch('/api/admin/collections').then(res => res.json())
    ]).then(([cats, cols]) => {
      setCategories(cats);
      setCollections(cols);
      setLoadingCats(false);
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        price: initialData.price.toString(),
        sizeMatrix: initialData.sizeMatrix ? (typeof initialData.sizeMatrix === 'string' ? JSON.parse(initialData.sizeMatrix) : initialData.sizeMatrix) : []
      });
    }
  }, [initialData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      
      if (res.ok) {
        setFormData({ ...formData, imageUrl: data.url });
        setMessage('Upload de imagem concluído!');
      } else {
        setMessage(data.error || 'Erro no upload.');
      }
    } catch (err) {
      setMessage('Erro de conexão ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const url = isEditing ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Erro ao salvar');
        setSaving(false);
        return;
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setMessage('Erro de conexão.');
      setSaving(false);
    }
  };

  if (loadingCats) return <div>Carregando...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {message && (
        <div className="p-4 bg-[#ba1a1a]/10 text-[#ba1a1a] text-xs font-bold uppercase">{message}</div>
      )}
      
      <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
        <h2 className="font-display uppercase font-bold text-lg border-b border-border-hairline pb-2 mb-4">Informações Principais</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Nome do Produto</label>
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
          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Slug (URL)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Categoria</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              required
            >
              <option value="">Selecione...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
        <h2 className="font-display uppercase font-bold text-lg border-b border-border-hairline pb-2 mb-4">Mídia e Imagens</h2>
        
        <div className="mb-4 p-4 bg-surface-off border border-border-hairline">
          <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold mb-1">⚠️ Instrução de Imagem</p>
          <p className="text-sm text-text-primary">Para que nenhuma roupa fique maior ou menor que as outras na vitrine, envie as imagens sempre na proporção <b>4:5 (Exemplo: 1080x1350 pixels)</b>.<br/>O site possui um sistema que recorta (Cover) e adapta imagens fora de formato, mas mandar no tamanho certo garante 100% de qualidade.</p>
        </div>

        <div>
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Imagem Principal</label>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="flex-1 border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              placeholder="URL da imagem ou faça o upload..."
              required
            />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={uploading}
                className="w-full md:w-auto bg-surface-off border border-border-hairline text-text-primary text-xs uppercase tracking-wider font-bold py-3 px-6 hover:bg-border-hairline transition-colors disabled:opacity-50 pointer-events-none"
              >
                {uploading ? 'Enviando...' : 'Fazer Upload'}
              </button>
            </div>
          </div>
          {formData.imageUrl && (
            <img src={formData.imageUrl} alt="Preview" className="mt-4 w-32 h-32 object-cover border border-border-hairline" />
          )}
        </div>
      </div>

      <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
        <h2 className="font-display uppercase font-bold text-lg border-b border-border-hairline pb-2 mb-4">Detalhes do Produto</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Ref / SKU</label>
            <input
              type="text"
              value={formData.ref}
              onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Coleção</label>
            <select
              value={formData.collectionId || ''}
              onChange={(e) => setFormData({ ...formData, collectionId: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">Nenhuma / Solto</option>
              {collections.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Subtítulo (Grade/Gramatura)</label>
            <input
              type="text"
              value={formData.sub}
              onChange={(e) => setFormData({ ...formData, sub: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Descrição Curta</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors h-24"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Sobre a Peça (About)</label>
          <textarea
            value={formData.about}
            onChange={(e) => setFormData({ ...formData, about: e.target.value })}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors h-24"
          />
        </div>
        <div>
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Composição</label>
          <input
            type="text"
            value={formData.composition}
            onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
            className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-surface-pure border border-border-hairline p-6 shadow-sm space-y-4">
        <h2 className="font-display uppercase font-bold text-lg border-b border-border-hairline pb-2 mb-4">Variações e Status</h2>
        
        <div>
          <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Grade, Estoque e Medidas</label>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-1">Tamanhos (separados por vírgula)</label>
              <input
                type="text"
                value={formData.sizes}
                onChange={(e) => {
                  const newSizes = e.target.value;
                  const sizeArray = newSizes.split(',').map(s => s.trim()).filter(Boolean);
                  
                  // Keep existing matrix items or add new ones
                  const newMatrix = sizeArray.map(size => {
                    const existing = formData.sizeMatrix.find((m: any) => m.s === size);
                    return existing || { s: size, q: 10, w: '', l: '' };
                  });
                  
                  setFormData({ ...formData, sizes: newSizes, sizeMatrix: newMatrix });
                }}
                className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                placeholder="P,M,G,GG"
              />
            </div>
            
            {formData.sizeMatrix && formData.sizeMatrix.length > 0 && (
              <div className="border border-border-hairline p-4 bg-surface-off space-y-3">
                <div className="grid grid-cols-4 gap-2 text-[10px] text-text-secondary uppercase tracking-widest font-semibold pb-2 border-b border-border-hairline">
                  <div>Tamanho</div>
                  <div>Estoque</div>
                  <div>Largura (Busto)</div>
                  <div>Comprimento</div>
                </div>
                {formData.sizeMatrix.map((matrixItem: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-4 gap-2 items-center">
                    <div className="font-bold">{matrixItem.s}</div>
                    <input
                      type="number"
                      value={matrixItem.q}
                      onChange={(e) => {
                        const newMatrix = [...formData.sizeMatrix];
                        newMatrix[idx].q = parseInt(e.target.value) || 0;
                        setFormData({ ...formData, sizeMatrix: newMatrix });
                      }}
                      className="border border-border-hairline bg-surface-pure p-2 text-sm w-full"
                      placeholder="0"
                    />
                    <input
                      type="text"
                      value={matrixItem.w || ''}
                      onChange={(e) => {
                        const newMatrix = [...formData.sizeMatrix];
                        newMatrix[idx].w = e.target.value;
                        setFormData({ ...formData, sizeMatrix: newMatrix });
                      }}
                      className="border border-border-hairline bg-surface-pure p-2 text-sm w-full"
                      placeholder="Ex: 60 cm"
                    />
                    <input
                      type="text"
                      value={matrixItem.l || ''}
                      onChange={(e) => {
                        const newMatrix = [...formData.sizeMatrix];
                        newMatrix[idx].l = e.target.value;
                        setFormData({ ...formData, sizeMatrix: newMatrix });
                      }}
                      className="border border-border-hairline bg-surface-pure p-2 text-sm w-full"
                      placeholder="Ex: 74 cm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.inStock}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs uppercase tracking-widest font-semibold">Em Estoque</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isFeatured}
              onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <span className="text-xs uppercase tracking-widest font-semibold">Destaque</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-surface-off border border-border-hairline text-text-primary py-4 px-8 text-xs uppercase tracking-wider font-bold hover:bg-border-hairline transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-white py-4 px-12 text-xs uppercase tracking-wider font-bold hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>
    </form>
  );
}
