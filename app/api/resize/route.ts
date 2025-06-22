import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Set up the directories
const uploadDir = path.join(process.cwd(), 'uploads');
const resizedDir = path.join(process.cwd(), 'resized');

// Ensure directories exist
async function ensureDirectories() {
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
  if (!existsSync(resizedDir)) {
    await mkdir(resizedDir, { recursive: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const data = await request.json();
    const { fileName, resizeType, width, height, percentage } = data;
    
    if (!fileName) {
      return NextResponse.json(
        { error: 'No file specified' },
        { status: 400 }
      );
    }
    
    const filePath = path.join(uploadDir, fileName);
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }
    
    // Get the file extension
    const fileExtension = fileName.split('.').pop();
    
    // Create a new resized image instance
    let resizeOperation = sharp(filePath);
    
    // Get original image metadata
    const metadata = await sharp(filePath).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    
    if (!originalWidth || !originalHeight) {
      return NextResponse.json(
        { error: 'Could not determine image dimensions' },
        { status: 400 }
      );
    }
    
    // Apply resize based on type
    if (resizeType === 'ratio') {
      if (!width || !height) {
        return NextResponse.json(
          { error: 'Width and height are required for ratio resize' },
          { status: 400 }
        );
      }
      resizeOperation = resizeOperation.resize({
        width: parseInt(width),
        height: parseInt(height),
        fit: 'fill'
      });
    } else if (resizeType === 'percentage') {
      if (!percentage || percentage < 10 || percentage > 100) {
        return NextResponse.json(
          { error: 'Percentage must be between 10 and 100' },
          { status: 400 }
        );
      }
      
      const newWidth = Math.round((originalWidth * percentage) / 100);
      const newHeight = Math.round((originalHeight * percentage) / 100);
      
      resizeOperation = resizeOperation.resize({
        width: newWidth,
        height: newHeight,
        fit: 'fill'
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid resize type' },
        { status: 400 }
      );
    }
    
    // Generate a unique filename for the resized image
    const resizedId = uuidv4();
    const resizedFileName = `${resizedId}.${fileExtension}`;
    const resizedFilePath = path.join(resizedDir, resizedFileName);
    
    // Process and save the resized image
    await resizeOperation.toFile(resizedFilePath);
    
    // Return the resized file details
    return NextResponse.json({
      success: true,
      resizedFileName,
      originalName: fileName,
      resizedPath: `/resized/${resizedFileName}`,
    });
  } catch (error) {
    console.error('Error resizing image:', error);
    return NextResponse.json(
      { error: 'Failed to resize image' },
      { status: 500 }
    );
  }
} 