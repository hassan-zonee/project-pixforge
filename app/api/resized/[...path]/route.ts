import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// Set up the resized directory
const resizedDir = path.join(process.cwd(), 'resized');

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = path.join(resizedDir, ...params.path);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const fileExtension = path.extname(filePath).toLowerCase().substring(1);
    let contentType = 'application/octet-stream';
    
    if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExtension === 'png') {
      contentType = 'image/png';
    } else if (fileExtension === 'webp') {
      contentType = 'image/webp';
    }
    
    // Return the file
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300', // 5 minutes
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
} 