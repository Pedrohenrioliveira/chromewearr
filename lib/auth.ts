import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Secret key for HMAC SHA-256 signing
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.JWT_SECRET ||
  'chromewear_secure_jwt_token_secret_key_2026_linh_prod_auth_cw';

export interface AdminTokenPayload {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'VENDOR';
  exp: number;
  iat: number;
}

// UTF-8 safe base64url encode
function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// UTF-8 safe base64url decode
function base64UrlDecodeToBytes(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function base64UrlEncode(str: string): string {
  const enc = new TextEncoder();
  return base64UrlEncodeBytes(enc.encode(str));
}

function base64UrlDecode(str: string): string {
  const bytes = base64UrlDecodeToBytes(str);
  const dec = new TextDecoder();
  return dec.decode(bytes);
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(AUTH_SECRET) as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Signs a cryptographic JWT token for admin or vendor sessions.
 * Compatible with Edge Runtime and Node.js runtimes.
 */
export async function signAdminToken(
  payload: { id: string; email: string; name: string; role: 'ADMIN' | 'VENDOR' },
  expiresInSeconds: number = 7 * 24 * 60 * 60 // 7 days
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: AdminTokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey();
  const enc = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(data) as unknown as BufferSource
  );
  const signatureBytes = new Uint8Array(signatureBuffer);
  const encodedSignature = base64UrlEncodeBytes(signatureBytes);

  return `${data}.${encodedSignature}`;
}

/**
 * Cryptographically verifies an admin token and checks expiration and role.
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await getCryptoKey();
    const enc = new TextEncoder();
    const signatureBytes = base64UrlDecodeToBytes(encodedSignature);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      enc.encode(data) as unknown as BufferSource
    );
    if (!isValid) return null;

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload: AdminTokenPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    if (payload.role !== 'ADMIN' && payload.role !== 'VENDOR') {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Extracts and verifies the admin token from an incoming NextRequest or Request.
 */
export async function getAdminFromRequest(
  req: Request | NextRequest
): Promise<AdminTokenPayload | null> {
  let token: string | null = null;

  // 1. Check cookies
  if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
    token = (req as any).cookies.get('chromewear_admin_token')?.value || null;
  } else {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)chromewear_admin_token=([^;]+)/);
    if (match) {
      token = decodeURIComponent(match[1]);
    }
  }

  // 2. Check Authorization Header (Bearer token fallback)
  if (!token) {
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * Helper to enforce admin authorization in API routes.
 */
export async function requireAdmin(
  req: Request | NextRequest,
  allowedRoles: ('ADMIN' | 'VENDOR')[] = ['ADMIN', 'VENDOR']
): Promise<{ error: NextResponse | null; user: AdminTokenPayload | null }> {
  const user = await getAdminFromRequest(req);

  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Acesso não autorizado. Faça login como administrador.' },
        { status: 401 }
      ),
      user: null,
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      error: NextResponse.json(
        { error: 'Acesso proibido. Permissões insuficientes.' },
        { status: 403 }
      ),
      user: null,
    };
  }

  return { error: null, user };
}
