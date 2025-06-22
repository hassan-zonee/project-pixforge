import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Since we're using in-memory storage, we don't need to run cleanup
  return NextResponse.next();
}

// Only run the middleware on specific paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 