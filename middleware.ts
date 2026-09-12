import { NextRequest, NextResponse } from 'next/server';
import { localeFromPath } from './lib/locale';
export function middleware(request: NextRequest) {
 const headers = new Headers(request.headers);
 headers.set('x-kosh-locale', localeFromPath(request.nextUrl.pathname));
 return NextResponse.next({ request: { headers } });
}
