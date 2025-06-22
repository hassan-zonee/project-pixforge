import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Set up the upload directory
const uploadDir = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureUploadDir();
    
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
    const filePath = path.join(uploadDir, fileName);
    
    // Save the file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    
    // Return the file details
    return NextResponse.json({
      success: true,
      fileId,
      fileName,
      originalName: file.name,
      fileType: file.type,
      filePath: `/uploads/${fileName}`,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 