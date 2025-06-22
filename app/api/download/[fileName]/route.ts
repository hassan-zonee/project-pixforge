import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

// Set up the resized directory
const resizedDir = path.join(process.cwd(), 'resized');

export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const fileName = params.fileName;
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'No file specified' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(resizedDir, fileName);
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExtension === 'png') {
      contentType = 'image/png';
    } else if (fileExtension === 'webp') {
      contentType = 'image/webp';
    }
    
    // Create headers for the response
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Return the file as a download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
} 