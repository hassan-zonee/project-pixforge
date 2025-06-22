import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Define runtime environment for Vercel Edge
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WEBP are supported' },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;
    
    // Store file in memory
    const buffer = await file.arrayBuffer();
    
    // Create a response with the file data in memory
    const response = NextResponse.json({
      success: true,
      fileId,
      fileName,
      originalName: file.name,
      fileType: file.type,
      fileData: buffer,
    });
    
    // Store the file data in the response headers for later use
    // We'll use a cookie to track the uploaded file
    response.cookies.set(`file_${fileId}`, fileName, {
      path: '/',
      maxAge: 3600, // 1 hour expiry
      httpOnly: true,
      sameSite: 'strict',
    });
    
    return response;
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 