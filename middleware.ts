import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Always allow login page
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // 2. Allow public coupon endpoints needed by customers during store checkout
  if (pathname === '/api/coupons/validate') {
    return NextResponse.next();
  }
  if (pathname === '/api/coupons/verify' && request.method === 'POST') {
    return NextResponse.next();
  }

  // 3. Extract and verify token
  const token =
    request.cookies.get('chromewear_admin_token')?.value ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  const payload = token ? await verifyAdminToken(token) : null;
  const isAuthorized = Boolean(
    payload && (payload.role === 'ADMIN' || payload.role === 'VENDOR')
  );

  // 4. Guard Admin Pages (/admin/...)
  if (pathname.startsWith('/admin')) {
    if (!isAuthorized) {
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('redirect', pathname);
      }
      const response = NextResponse.redirect(loginUrl);
      if (token && !isAuthorized) {
        response.cookies.delete('chromewear_admin_token');
      }
      return response;
    }
    return NextResponse.next();
  }

  // 5. Guard Admin API Endpoints (/api/admin/...)
  if (pathname.startsWith('/api/admin')) {
    // /api/admin/auth/me handles its own response and DB validation
    if (pathname === '/api/admin/auth/me') {
      return NextResponse.next();
    }

    if (!payload) {
      return NextResponse.json(
        { error: 'Não autorizado. Autenticação administrativa necessária.' },
        { status: 401 }
      );
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Acesso negado. Requer permissão administrativa.' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 6. Guard administrative coupon APIs
  if (pathname.startsWith('/api/coupons')) {
    if (!payload) {
      return NextResponse.json(
        { error: 'Não autorizado. Autenticação administrativa necessária.' },
        { status: 401 }
      );
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Acesso negado. Requer permissão administrativa.' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/coupons/:path*',
  ],
};
