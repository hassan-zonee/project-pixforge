"use client"

import React, { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import { ClientResizer } from "./ClientResizer";
import { useOpenCV } from "./OpenCVProvider";

type UploadedFile = {
  fileId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  fileData: ArrayBuffer | string;
};

type ResizedFile = {
  resizedFileName: string;
  originalName: string;
  resizedData: string;
  width: number;
  height: number;
};

type ResizeType = "ratio" | "percentage";

export const PixForgeHome = (): JSX.Element => {
  // OpenCV loading state
  const { isOpenCVLoaded } = useOpenCV();

  // State for file upload and processing
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [resizedFile, setResizedFile] = useState<ResizedFile | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);
  const [clientResizedPreview, setClientResizedPreview] = useState<string | null>(null);

  // State for resize options
  const [resizeType, setResizeType] = useState<ResizeType>("ratio");
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(50);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);

  // State for original dimensions
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SEO-friendly metadata
  const pageTitle = "Free Online Image Resizer | Resize JPG, PNG, WebP Images Easily";
  const pageDescription = "Resize your images online for free. No registration required, no watermarks. Support for JPG, PNG, and WebP formats with custom dimensions or percentage scaling.";
  const keywords = "image resizer, resize image online, free image resizer, photo resizer, resize pictures, image size converter";

  // Cleanup function to remove uploaded files when component unmounts or page refreshes
  useEffect(() => {
    // Function to clean up files
    const cleanupFiles = async () => {
      if (uploadedFile || resizedFile) {
        try {
          await fetch('/api/cleanup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              uploadedFile: uploadedFile?.fileName,
              resizedFile: resizedFile?.resizedFileName
            }),
          });
          console.log('Files cleaned up successfully');
        } catch (err) {
          console.error('Failed to clean up files:', err);
        }
      }
    };

    // Add event listeners for page unload
    const handleBeforeUnload = () => {
      cleanupFiles();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupFiles();
    };
  }, [uploadedFile, resizedFile]);

  // Upload file to server
  const handleUpload = useCallback(async (fileToUpload: File) => {
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const data = await response.json();
      setUploadedFile(data);
      
      // Set initial width and height to match the original image dimensions
      if (preview) {
        const img = document.createElement('img');
        img.onload = () => {
          console.log(`Original dimensions: ${img.width}x${img.height}`);
          // Set the width and height to the original image dimensions
          setWidth(img.width);
          setHeight(img.height);
          // Calculate and store the aspect ratio
          setAspectRatio(img.width / img.height);
        };
        img.src = preview;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [preview]);

  // Reset dimensions to original
  const resetDimensions = useCallback(() => {
    setWidth(originalWidth);
    setHeight(originalHeight);
  }, [originalWidth, originalHeight]);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    // Reset states
    setError(null);
    setUploadedFile(null);
    setResizedFile(null);
    setResizedPreview(null);
    setClientResizedPreview(null);
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPG, PNG, and WebP are supported');
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    setFile(selectedFile);
    
    // Generate preview and set dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreview(previewUrl);
      
      // Set original dimensions
      const img = document.createElement('img');
      img.onload = () => {
        console.log(`Original dimensions: ${img.width}x${img.height}`);
        setWidth(img.width);
        setHeight(img.height);
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setAspectRatio(img.width / img.height);
      };
      img.src = previewUrl;
    };
    reader.readAsDataURL(selectedFile);
    
    // Upload the file
    handleUpload(selectedFile);
  }, [handleUpload]);

  // Handle drag and drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  // Handle click on upload area
  const handleUploadClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Handle width change with aspect ratio maintenance
  const handleWidthChange = useCallback((newWidth: number) => {
    setWidth(newWidth);
    if (maintainAspectRatio && aspectRatio) {
      // Calculate new height based on aspect ratio
      setHeight(Math.round(newWidth / aspectRatio));
    }
  }, [maintainAspectRatio, aspectRatio]);

  // Handle height change with aspect ratio maintenance
  const handleHeightChange = useCallback((newHeight: number) => {
    setHeight(newHeight);
    if (maintainAspectRatio && aspectRatio) {
      // Calculate new width based on aspect ratio
      setWidth(Math.round(newHeight * aspectRatio));
    }
  }, [maintainAspectRatio, aspectRatio]);

  // Handle client-side preview generation
  const handlePreviewGenerated = useCallback((dataUrl: string | null) => {
    setClientResizedPreview(dataUrl);
  }, []);

  // Resize the image
  const handleResize = useCallback(async () => {
    if (!uploadedFile || !preview) return;
    
    setIsResizing(true);
    setError(null);
    
    try {
      // Since we can't use server-side Sharp in Edge Runtime,
      // we'll use the client-side preview directly
      if (isOpenCVLoaded && clientResizedPreview) {
        // If OpenCV is loaded and we have a client-side preview, use that
        setResizedPreview(clientResizedPreview);
        setResizedFile({
          resizedFileName: `resized_${uploadedFile.fileName}`,
          originalName: uploadedFile.originalName,
          resizedData: clientResizedPreview,
          width,
          height
        });
      } else {
        // Fallback to API
        const requestData = {
          fileName: uploadedFile.fileName,
          fileData: preview,
          fileType: uploadedFile.fileType,
          resizeType,
          width: width,
          height: height,
          percentage: percentage,
        };
        
        const response = await fetch('/api/resize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to resize image');
        }
        
        const data = await response.json();
        setResizedFile(data);
        
        // Set the resized image preview directly from the response data
        setResizedPreview(data.resizedData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resize image');
    } finally {
      setIsResizing(false);
    }
  }, [uploadedFile, preview, resizeType, width, height, percentage, isOpenCVLoaded, clientResizedPreview]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!resizedFile || !resizedPreview) return;
    
    // Create a temporary link for download
    const link = document.createElement('a');
    link.href = resizedPreview;
    link.download = `resized_${resizedFile.originalName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resizedFile, resizedPreview]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="w-full py-4 bg-white border-b border-gray-100">
        <div className="max-w-screen-xl w-full mx-auto px-4">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl md:text-3xl font-montserrat font-semibold app-title">
              PixForge
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full flex-1 px-4 md:px-8 lg:px-16 py-8 bg-gray-50">
        <div className="max-w-4xl w-full mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-2xl md:text-3xl font-poppins font-semibold text-gray-800 mb-2">
              Free Online Image Resizer
            </h2>
            <p className="text-base text-gray-600 font-body">
              Resize JPG, PNG, and WebP images with OpenCV-powered precision
            </p>
          </div>

          {/* OpenCV Loading Status */}
          {!isOpenCVLoaded && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-center">
              <svg className="animate-spin h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading OpenCV.js for advanced image processing...
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Upload Card */}
          <Card className="w-full mb-6 bg-white border-0 rounded-xl card-shadow overflow-hidden">
            <CardHeader className="pb-2 pt-5 px-6">
              <CardTitle className="text-lg font-poppins text-gray-800">
                Upload Image
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-5">
              {/* Upload Area */}
              {!uploadedFile ? (
                <div 
                  className="flex flex-col items-center justify-center w-full h-48 mb-4 rounded-lg cursor-pointer upload-area bg-gray-50 hover:bg-blue-50/30 transition-colors"
                  onClick={handleUploadClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileInputChange}
                  />
                  <div className="mb-3">
                    <div className="w-12 h-12 flex items-center justify-center text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    </div>
                  </div>
                  <div className="mb-1">
                    <p className="text-sm font-medium text-gray-700">
                      {isUploading ? 'Uploading...' : 'Drag & Drop your image here or Click to Browse'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      Supported formats: JPG, PNG, WEBP (Max 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Original Image Preview */}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Original</p>
                      <div className="border border-gray-100 rounded-lg overflow-hidden h-64 flex items-center justify-center bg-gray-50">
                        {preview && (
                          <Image 
                            src={preview} 
                            alt="Original" 
                            width={500} 
                            height={500} 
                            className="max-w-full max-h-full object-contain"
                            unoptimized
                          />
                        )}
                      </div>
                    </div>
                    
                    {/* Resized Image Preview */}
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                        {isOpenCVLoaded ? "Live Preview" : "Resized"}
                      </p>
                      <div className="border border-gray-100 rounded-lg overflow-hidden h-64 flex items-center justify-center bg-gray-50">
                        {isResizing ? (
                          <div className="flex flex-col items-center">
                            <svg className="animate-spin h-6 w-6 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm text-gray-500">Processing...</p>
                          </div>
                        ) : isOpenCVLoaded && preview ? (
                          <div className="relative w-full h-full">
                            <ClientResizer
                              imageUrl={preview}
                              width={width}
                              height={height}
                              percentage={percentage}
                              resizeType={resizeType}
                              onPreviewGenerated={handlePreviewGenerated}
                            />
                          </div>
                        ) : resizedPreview ? (
                          <Image 
                            src={resizedPreview} 
                            alt="Resized" 
                            width={500} 
                            height={500} 
                            className="max-w-full max-h-full object-contain"
                            unoptimized
                          />
                        ) : (
                          <p className="text-sm text-gray-400">Resize to see preview</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resize Options Card */}
          {uploadedFile && (
            <Card className="w-full mb-6 bg-white border-0 rounded-xl card-shadow overflow-hidden">
              <CardHeader className="pb-2 pt-5 px-6">
                <CardTitle className="text-lg font-poppins text-gray-800">
                  Resize Options
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-5">
                {/* Resize Type Selection */}
                <div className="mb-6">
                  <div className="flex gap-3 mb-5">
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${resizeType === 'ratio' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      onClick={() => setResizeType('ratio')}
                    >
                      Custom Dimensions
                    </button>
                    <button
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${resizeType === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      onClick={() => setResizeType('percentage')}
                    >
                      Percentage
                    </button>
                  </div>

                  {/* Resize Controls */}
                  {resizeType === 'ratio' ? (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="maintainAspectRatio"
                            checked={maintainAspectRatio}
                            onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="maintainAspectRatio" className="text-sm text-gray-700">
                            Maintain aspect ratio
                          </label>
                        </div>
                        <button
                          onClick={resetDimensions}
                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center"
                          type="button"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset to original
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        Original dimensions: {originalWidth} × {originalHeight} px
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="width" className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                            Width (px)
                          </label>
                          <input
                            type="number"
                            id="width"
                            min="1"
                            value={width}
                            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label htmlFor="height" className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                            Height (px)
                          </label>
                          <input
                            type="number"
                            id="height"
                            min="1"
                            value={height}
                            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6">
                      <label htmlFor="percentage" className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
                        Percentage: {percentage}%
                      </label>
                      <input
                        type="range"
                        id="percentage"
                        min="10"
                        max="100"
                        value={percentage}
                        onChange={(e) => setPercentage(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>10%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="px-6 pb-5 pt-0">
                <button
                  onClick={handleResize}
                  disabled={isResizing}
                  className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 transition-colors font-medium text-sm"
                >
                  {isResizing ? 'Processing...' : 'Resize Image'}
                </button>
              </CardFooter>
            </Card>
          )}

          {/* Download Card */}
          {resizedFile && (
            <Card className="w-full mb-6 bg-white border-0 rounded-xl card-shadow overflow-hidden">
              <CardHeader className="pb-2 pt-5 px-6">
                <CardTitle className="text-lg font-poppins text-gray-800">
                  Download
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-3">
                <p className="text-sm text-gray-600 mb-4">
                  Your image has been successfully resized and is ready for download.
                </p>
              </CardContent>
              <CardFooter className="px-6 pb-5 pt-0">
                <button
                  onClick={handleDownload}
                  className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium text-sm flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download Resized Image
                </button>
              </CardFooter>
            </Card>
          )}

          {/* SEO Content */}
          <div className="mt-12 prose prose-sm max-w-none">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">About Our Free Image Resizer Tool</h2>
            <p className="text-gray-600">
              PixForge offers a powerful, free online image resizer that uses OpenCV technology for high-quality image resizing. 
              Whether you need to resize images for social media, websites, or print, our tool makes it quick and easy.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Key Features</h3>
            <ul className="list-disc pl-5 text-gray-600">
              <li><strong>OpenCV-Powered:</strong> Professional-grade image processing for the best quality results</li>
              <li><strong>Multiple Formats:</strong> Support for JPG, PNG, and WebP images</li>
              <li><strong>Custom Dimensions:</strong> Resize to exact pixel dimensions or by percentage</li>
              <li><strong>Real-time Preview:</strong> See your resized image before downloading</li>
              <li><strong>Free to Use:</strong> No registration, no watermarks, no limits</li>
              <li><strong>Privacy-Focused:</strong> Your images are automatically deleted after processing</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Why Resize Images?</h3>
            <p className="text-gray-600">
              Resizing images is essential for optimizing website performance, meeting social media platform requirements, 
              reducing file sizes for email attachments, or preparing images for print. Our tool helps you achieve the 
              perfect dimensions without losing image quality.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 bg-white border-t border-gray-100">
        <div className="max-w-screen-xl w-full mx-auto px-4">
          <div className="flex flex-col items-center justify-center">
            <h2 className="text-xl font-montserrat font-semibold app-title mb-1">
              PixForge
            </h2>
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} PixForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};