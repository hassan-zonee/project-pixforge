import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Store the last cleanup time
let lastCleanupTime = Date.now();
const CLEANUP_INTERVAL = 2 * 60 * 1000; // 2 minutes (reduced from 5 minutes)

export async function middleware(request: NextRequest) {
  // Check if it's time to clean up
  const now = Date.now();
  if (now - lastCleanupTime > CLEANUP_INTERVAL) {
    lastCleanupTime = now;
    
    // Call the cleanup API
    try {
      await fetch(`${request.nextUrl.origin}/api/cleanup`, {
        method: 'POST',
      });
      console.log('Scheduled cleanup completed');
    } catch (error) {
      console.error('Failed to run scheduled cleanup:', error);
    }
  }
  
  return NextResponse.next();
}

// Only run the middleware on specific paths
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|resized).*)',
  ],
}; 