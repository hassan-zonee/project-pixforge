"use client";

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useOpenCV } from './OpenCVProvider';

interface ClientResizerProps {
  imageUrl: string | null;
  width: number;
  height: number;
  percentage: number;
  resizeType: 'ratio' | 'percentage';
  onPreviewGenerated?: (dataUrl: string | null) => void;
}

export const ClientResizer: React.FC<ClientResizerProps> = ({
  imageUrl,
  width,
  height,
  percentage,
  resizeType,
  onPreviewGenerated
}) => {
  const { isOpenCVLoaded } = useOpenCV();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to resize image using OpenCV.js
  const resizeWithOpenCV = useCallback(async () => {
    if (!imageUrl || !isOpenCVLoaded || typeof window === 'undefined') {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cv = (window as any).cv;
      
      // Load the image
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Create canvas to get image data
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Create OpenCV matrices
      const src = cv.matFromImageData(imgData);
      const dst = new cv.Mat();
      
      // Calculate new dimensions
      let newWidth: number;
      let newHeight: number;
      
      if (resizeType === 'ratio') {
        newWidth = width;
        newHeight = height;
      } else {
        // Percentage resize
        newWidth = Math.round((img.width * percentage) / 100);
        newHeight = Math.round((img.height * percentage) / 100);
      }
      
      // Resize the image
      const dsize = new cv.Size(newWidth, newHeight);
      cv.resize(src, dst, dsize, 0, 0, cv.INTER_AREA);
      
      // Convert back to canvas
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = newWidth;
      resizedCanvas.height = newHeight;
      cv.imshow(resizedCanvas, dst);
      
      // Get data URL
      const dataUrl = resizedCanvas.toDataURL('image/jpeg');
      setPreviewUrl(dataUrl);
      
      // Notify parent component
      if (onPreviewGenerated) {
        onPreviewGenerated(dataUrl);
      }
      
      // Free memory
      src.delete();
      dst.delete();
    } catch (err) {
      console.error('Error in client-side resizing:', err);
      setError('Failed to generate preview');
      setPreviewUrl(null);
      if (onPreviewGenerated) {
        onPreviewGenerated(null);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, isOpenCVLoaded, width, height, percentage, resizeType, onPreviewGenerated]);

  // Trigger resize when parameters change
  useEffect(() => {
    if (imageUrl && isOpenCVLoaded) {
      resizeWithOpenCV();
    }
  }, [imageUrl, width, height, percentage, resizeType, isOpenCVLoaded, resizeWithOpenCV]);

  if (!imageUrl) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-gray-500">Processing...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      
      {previewUrl && !isProcessing && !error && (
        <Image 
          src={previewUrl} 
          alt="Resized preview" 
          fill
          className="object-contain"
          unoptimized
        />
      )}
    </div>
  );
}; 