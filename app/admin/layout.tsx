'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('chromewear_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role === 'ADMIN' || u.role === 'VENDOR') {
          setUser(u);
          setIsAuthorized(true);
        } else {
          router.push('/'); // Normal users are kicked out
        }
      } else {
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
    } catch (e) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-surface-pure text-text-primary">
        <p className="font-display uppercase tracking-widest text-sm animate-pulse">Carregando Painel...</p>
      </div>
    );
  }

  // If on login page, just render it without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isAuthorized) return null;

  return (
    <div className="w-full min-h-screen flex bg-surface-off text-text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-pure border-r border-border-hairline flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-border-hairline flex flex-col gap-1">
          <Link href="/" className="font-display text-xl uppercase tracking-[0.2em] font-bold hover:text-primary transition-colors">
            CHROMEWEAR
          </Link>
          <span className="text-[10px] text-text-secondary uppercase tracking-widest">Painel Administrativo</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Link href="/admin" className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname === '/admin' ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
            Dashboard
          </Link>
          <Link href="/admin/products" className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/products') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
            Produtos
          </Link>
          <Link href="/admin/categories" className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/categories') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
            Categorias
          </Link>
          <Link href="/admin/collections" className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/collections') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
            Coleções
          </Link>
          {user?.role === 'ADMIN' && (
            <>
              <Link href="/admin/banner" className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/banner') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
                Banner Principal
              </Link>
              <Link href="/admin/users" className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/users') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
                Vendedores
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border-hairline">
          <div className="mb-4 px-4">
            <p className="text-xs font-semibold">{user.name}</p>
            <p className="text-[10px] text-text-secondary">{user.role}</p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('chromewear_user');
              router.push('/admin/login');
            }}
            className="w-full px-4 py-3 text-xs uppercase tracking-wider font-bold text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-colors text-left"
          >
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden min-h-screen">
        {children}
      </main>
    </div>
  );
}
