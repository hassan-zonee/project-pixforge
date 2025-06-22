import { NextRequest, NextResponse } from 'next/server';
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
    
    // In Edge Runtime, we can't use Sharp, so we'll just return the original image data
    // The actual resizing will be done client-side with the ClientResizer component
    
    // Generate a unique filename for the resized image
    const resizedId = uuidv4();
    const resizedFileName = `${resizedId}.${fileExtension}`;
    
    // Return the resized file details with the original data
    // The client will handle the actual resizing
    return NextResponse.json({
      success: true,
      resizedFileName,
      originalName: fileName,
      resizedData: fileData, // Just return the original data, client will handle resizing
      width: parseInt(width) || 0,
      height: parseInt(height) || 0
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
} 