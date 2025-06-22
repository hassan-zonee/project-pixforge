import { NextRequest, NextResponse } from 'next/server';

// Define runtime environment for Vercel Edge
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // Since we're using in-memory storage, we don't need to do any file cleanup
    // We'll just return a success response
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to clean up temporary files' },
      { status: 500 }
    );
  }
} 