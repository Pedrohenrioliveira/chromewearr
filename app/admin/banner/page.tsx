'use client';

import React, { useEffect, useState } from 'react';

export default function BannerAdmin() {
  const [banner, setBanner] = useState({
    title: '',
    subtitle: '',
    quote: '',
    buttonText: '',
    buttonLink: '',
    imageUrl: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/banner')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.title) {
          setBanner(data);
        }
        setLoading(false);
      });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (res.ok) {
        setBanner({ ...banner, imageUrl: data.url });
        setMessage('Upload concluído com sucesso!');
      } else {
        setMessage(data.error || 'Erro no upload.');
      }
    } catch (err) {
      setMessage('Erro de conexão ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const img = new window.Image();
    img.onload = async () => {
      if (img.width < 1920 || img.height < 820) {
        setMessage(`Erro: A imagem tem ${img.width}x${img.height}. Ela deve ter pelo menos 1920x820 pixels (Recomendado 2560x1080).`);
        setSaving(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/banner', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(banner),
        });

        if (res.ok) {
          setMessage('Banner salvo com sucesso!');
        } else {
          setMessage('Erro ao salvar o banner.');
        }
      } catch (err) {
        setMessage('Erro de conexão.');
      } finally {
        setSaving(false);
      }
    };
    img.onerror = () => {
      setMessage('Erro: URL de imagem inválida ou imagem inacessível.');
      setSaving(false);
    };
    img.src = banner.imageUrl;
  };

  if (loading) return <div className="p-4 md:p-8">Carregando...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <h1 className="font-display uppercase tracking-widest text-2xl font-bold mb-8">Gerenciar Banner Principal</h1>

      {message && (
        <div className={`mb-6 p-4 text-xs uppercase tracking-wider font-semibold ${message.includes('Erro') ? 'bg-[#ba1a1a]/10 text-[#ba1a1a] border border-[#ba1a1a]/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-surface-pure border border-border-hairline p-6 shadow-sm">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <div className="mb-4 p-4 bg-surface-off border border-border-hairline">
              <p className="text-xs text-text-secondary uppercase tracking-widest font-semibold mb-1">⚠️ Instrução de Imagem</p>
              <p className="text-sm text-text-primary">O banner precisa ser no formato Ultra-Wide (aprox. 21:9).<br/><b>Tamanho Recomendado:</b> 2560x1080 pixels.<br/><b>Tamanho Mínimo Permitido:</b> 1920x820 pixels.</p>
            </div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Imagem do Banner</label>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <input
                type="text"
                value={banner.imageUrl || ''}
                onChange={(e) => setBanner({ ...banner, imageUrl: e.target.value })}
                className="flex-1 border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
                placeholder="URL da imagem ou faça o upload abaixo..."
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
            {banner.imageUrl && (
              <img src={banner.imageUrl} alt="Preview do Banner" className="w-full h-auto max-h-[300px] object-cover border border-border-hairline" />
            )}
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Título Principal (ex: SANCTUM)</label>
            <input
              type="text"
              value={banner.title || ''}
              onChange={(e) => setBanner({ ...banner, title: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Subtítulo (Opcional)</label>
            <input
              type="text"
              value={banner.subtitle || ''}
              onChange={(e) => setBanner({ ...banner, subtitle: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Frase/Citação (Quote)</label>
            <textarea
              value={banner.quote || ''}
              onChange={(e) => setBanner({ ...banner, quote: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors h-24 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Texto do Botão (Opcional)</label>
            <input
              type="text"
              value={banner.buttonText || ''}
              onChange={(e) => setBanner({ ...banner, buttonText: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] text-text-secondary uppercase tracking-widest font-semibold mb-2">Link do Botão (Opcional)</label>
            <input
              type="text"
              value={banner.buttonLink || ''}
              onChange={(e) => setBanner({ ...banner, buttonLink: e.target.value })}
              className="w-full border border-border-hairline bg-surface-off p-3 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="col-span-2 flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="isActive"
              checked={banner.isActive}
              onChange={(e) => setBanner({ ...banner, isActive: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="isActive" className="text-xs uppercase tracking-widest font-semibold cursor-pointer">
              Banner Ativo no Site
            </label>
          </div>
        </div>

        <div className="pt-6 mt-6 border-t border-border-hairline">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white text-xs uppercase tracking-[0.2em] font-bold py-4 px-8 hover:bg-black transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}
