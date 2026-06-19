import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth-helpers';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths
  const isPublicPath =
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/seed') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/logout') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|webp)$/);

  if (isPublicPath) {
    // If user is already logged in and goes to /login, redirect to home
    if (pathname === '/login') {
      const token = request.cookies.get('session_token')?.value;
      if (token) {
        const decoded = await verifyToken(token);
        if (decoded) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Session verification
  const token = request.cookies.get('session_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set({
      name: 'session_token',
      value: '',
      httpOnly: true,
      path: '/',
      expires: new Date(0)
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth/login|api/seed|_next/static|_next/image|favicon.ico).*)',
  ],
};
