import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';

// Set up the directories
const uploadDir = path.join(process.cwd(), 'uploads');
const resizedDir = path.join(process.cwd(), 'resized');

// Function to delete specific files
async function deleteSpecificFiles(uploadedFile: string | null, resizedFile: string | null) {
  try {
    // Delete uploaded file if specified
    if (uploadedFile) {
      const uploadedFilePath = path.join(uploadDir, uploadedFile);
      if (existsSync(uploadedFilePath)) {
        await unlink(uploadedFilePath);
        console.log(`Deleted uploaded file: ${uploadedFilePath}`);
      }
    }
    
    // Delete resized file if specified
    if (resizedFile) {
      const resizedFilePath = path.join(resizedDir, resizedFile);
      if (existsSync(resizedFilePath)) {
        await unlink(resizedFilePath);
        console.log(`Deleted resized file: ${resizedFilePath}`);
      }
    }
  } catch (error) {
    console.error('Error deleting specific files:', error);
  }
}

// Function to delete files older than a specified time
async function deleteOldFiles(directory: string, maxAgeMinutes: number = 5) {
  if (!existsSync(directory)) {
    return;
  }
  
  try {
    const files = await readdir(directory);
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await stat(filePath);
      const fileAgeMs = now - stats.mtimeMs;
      
      if (fileAgeMs > maxAgeMs) {
        await unlink(filePath);
        console.log(`Deleted old file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error(`Error cleaning up directory ${directory}:`, error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if specific files need to be deleted
    try {
      const data = await request.json();
      const { uploadedFile, resizedFile } = data;
      
      if (uploadedFile || resizedFile) {
        // Delete specific files
        await deleteSpecificFiles(uploadedFile, resizedFile);
        return NextResponse.json({
          success: true,
          message: 'Specific files cleaned up successfully',
        });
      }
    } catch (e) {
      // If parsing JSON fails, proceed with general cleanup
      console.log('No specific files to delete, performing general cleanup');
    }
    
    // Clean up both directories (files older than 5 minutes)
    await deleteOldFiles(uploadDir);
    await deleteOldFiles(resizedDir);
    
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