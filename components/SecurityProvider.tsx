'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function SecurityProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname && !pathname.startsWith('/admin')) {
      const stored = localStorage.getItem('chromewear_user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          // Auto-logout admin if they navigate back to the main site
          if (u.role === 'ADMIN' || u.role === 'VENDOR') {
            localStorage.removeItem('chromewear_user');
            sessionStorage.removeItem('chromewear_user');
          }
        } catch (e) {
          localStorage.removeItem('chromewear_user');
        }
      }
    }
  }, [pathname]);

  return null;
}
