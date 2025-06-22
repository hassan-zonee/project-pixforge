import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import path from 'path';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cv from 'opencv.js';

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

// Function to resize image with OpenCV
async function resizeImageWithOpenCV(
  inputPath: string, 
  outputPath: string, 
  newWidth: number, 
  newHeight: number
): Promise<void> {
  try {
    // Read the image file
    const imageBuffer = await readFile(inputPath);
    
    // Convert buffer to Uint8Array for OpenCV
    const imageArray = new Uint8Array(imageBuffer);
    
    // Read image with OpenCV
    const mat = cv.imdecode(imageArray, cv.IMREAD_UNCHANGED);
    
    // Create destination matrix
    const dst = new cv.Mat();
    
    // Resize the image
    const dsize = new cv.Size(newWidth, newHeight);
    cv.resize(mat, dst, dsize, 0, 0, cv.INTER_AREA);
    
    // Encode the resized image
    const encodedImage = cv.imencode('.jpg', dst);
    
    // Write the resized image to file
    await writeFile(outputPath, Buffer.from(encodedImage));
    
    // Free memory
    mat.delete();
    dst.delete();
  } catch (error) {
    console.error('Error resizing with OpenCV:', error);
    throw error;
  }
}

// Fallback to Sharp if OpenCV fails
async function resizeImageWithSharp(
  inputPath: string, 
  outputPath: string, 
  newWidth: number, 
  newHeight: number
): Promise<void> {
  try {
    await sharp(inputPath)
      .resize({
        width: newWidth,
        height: newHeight,
        fit: 'fill'
      })
      .toFile(outputPath);
  } catch (error) {
    console.error('Error resizing with Sharp:', error);
    throw error;
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
    
    // Calculate new dimensions
    let newWidth: number;
    let newHeight: number;
    
    if (resizeType === 'ratio') {
      if (!width || !height) {
        return NextResponse.json(
          { error: 'Width and height are required for ratio resize' },
          { status: 400 }
        );
      }
      newWidth = parseInt(width);
      newHeight = parseInt(height);
    } else if (resizeType === 'percentage') {
      if (!percentage || percentage < 10 || percentage > 100) {
        return NextResponse.json(
          { error: 'Percentage must be between 10 and 100' },
          { status: 400 }
        );
      }
      
      newWidth = Math.round((originalWidth * percentage) / 100);
      newHeight = Math.round((originalHeight * percentage) / 100);
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
    
    // Try to resize with OpenCV first, fallback to Sharp if it fails
    try {
      await resizeImageWithOpenCV(filePath, resizedFilePath, newWidth, newHeight);
      console.log('Image resized with OpenCV');
    } catch (error) {
      console.warn('OpenCV resize failed, falling back to Sharp:', error);
      await resizeImageWithSharp(filePath, resizedFilePath, newWidth, newHeight);
      console.log('Image resized with Sharp (fallback)');
    }
    
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