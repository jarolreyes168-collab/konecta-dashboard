import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // En producción se lee la sesión JWT o cookie corporativa
  const sessionUser = request.cookies.get('konecta_user')?.value;
  const userRole = request.cookies.get('konecta_role')?.value || 'ADMIN'; // Default en dev

  // Proteger rutas de administración solo para ADMIN o COORDINADOR
  if (path.startsWith('/admin')) {
    if (userRole !== 'ADMIN' && userRole !== 'COORDINADOR') {
      return NextResponse.redirect(new URL('/resumen?unauthorized=true', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
