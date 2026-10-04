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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-surface-off text-text-primary">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-surface-pure border-b border-border-hairline sticky top-0 z-40">
        <Link href="/" className="font-display text-lg uppercase tracking-[0.2em] font-bold">
          CHROMEWEAR
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -mr-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-surface-pure border-r border-border-hairline flex flex-col h-screen fixed md:sticky top-0 z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-border-hairline flex flex-col gap-1 relative">
          <Link href="/" className="font-display text-xl uppercase tracking-[0.2em] font-bold hover:text-primary transition-colors">
            CHROMEWEAR
          </Link>
          <span className="text-[10px] text-text-secondary uppercase tracking-widest">Painel Administrativo</span>
          
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden absolute top-6 right-4 p-2 text-text-secondary hover:text-text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname === '/admin' ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
            Dashboard
          </Link>
          <Link href="/admin/products" onClick={() => setIsSidebarOpen(false)} className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/products') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
            Produtos
          </Link>
          <Link href="/admin/categories" onClick={() => setIsSidebarOpen(false)} className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/categories') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
            Categorias
          </Link>
          <Link href="/admin/collections" onClick={() => setIsSidebarOpen(false)} className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/collections') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
            Coleções
          </Link>
          {user?.role === 'ADMIN' && (
            <>
              <Link href="/admin/banner" onClick={() => setIsSidebarOpen(false)} className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/banner') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
                Banner Principal
              </Link>
              <Link href="/admin/users" onClick={() => setIsSidebarOpen(false)} className={`block px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-colors ${pathname.startsWith('/admin/users') ? 'bg-primary text-white' : 'hover:bg-surface-container text-text-secondary hover:text-text-primary'}`}>
                Vendedores
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border-hairline bg-surface-pure">
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
