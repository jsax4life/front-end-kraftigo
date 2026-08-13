import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const defaultLocale = 'en';

export function proxy(request: NextRequest) {
  // Pass through if the request is for API, _next/static, _next/image, favicon
  const { pathname } = request.nextUrl;
  
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get locale from cookie
  const locale = request.cookies.get('lang')?.value || defaultLocale;

  // We set the x-locale header or just return next() since next-intl gets it from cookie
  const response = NextResponse.next();
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
