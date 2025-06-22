import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';

// Set up the directories
const uploadDir = path.join(process.cwd(), 'uploads');
const resizedDir = path.join(process.cwd(), 'resized');

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
    // Clean up both directories
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