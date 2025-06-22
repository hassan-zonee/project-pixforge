import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

// Define runtime environment for Vercel Edge
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { fileName, fileData, resizeType, width, height, percentage, fileType } = data;
    
    if (!fileName || !fileData) {
      return NextResponse.json(
        { error: 'No file data provided' },
        { status: 400 }
      );
    }
    
    // Get the file extension
    const fileExtension = fileName.split('.').pop();
    
    // Convert base64 to buffer if needed
    let imageBuffer;
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      // Handle base64 data URL
      const base64Data = fileData.split(',')[1];
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (typeof fileData === 'string') {
      // Handle plain base64
      imageBuffer = Buffer.from(fileData, 'base64');
    } else if (fileData instanceof ArrayBuffer) {
      // Handle ArrayBuffer
      imageBuffer = Buffer.from(new Uint8Array(fileData));
    } else if (ArrayBuffer.isView(fileData)) {
      // Handle TypedArray
      imageBuffer = Buffer.from(fileData as Uint8Array);
    } else {
      return NextResponse.json(
        { error: 'Invalid file data format' },
        { status: 400 }
      );
    }
    
    // Process with sharp
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
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
    
    // Resize the image
    const resizedImageBuffer = await image
      .resize({
        width: newWidth,
        height: newHeight,
        fit: 'fill'
      })
      .toBuffer();
    
    // Generate a unique filename for the resized image
    const resizedId = uuidv4();
    const resizedFileName = `${resizedId}.${fileExtension}`;
    
    // Convert buffer to base64 for response
    const resizedBase64 = `data:${fileType || 'image/jpeg'};base64,${resizedImageBuffer.toString('base64')}`;
    
    // Return the resized file details
    return NextResponse.json({
      success: true,
      resizedFileName,
      originalName: fileName,
      resizedData: resizedBase64,
      width: newWidth,
      height: newHeight
    });
  } catch (error) {
    console.error('Error resizing image:', error);
    return NextResponse.json(
      { error: 'Failed to resize image' },
      { status: 500 }
    );
  }
} 