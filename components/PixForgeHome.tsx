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

type UploadedFile = {
  fileId: string;
  fileName: string;
  originalName: string;
  fileType: string;
  filePath: string;
};

type ResizedFile = {
  resizedFileName: string;
  originalName: string;
  resizedPath: string;
};

type ResizeType = "ratio" | "percentage";

export const PixForgeHome = (): JSX.Element => {
  // State for file upload and processing
  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [resizedFile, setResizedFile] = useState<ResizedFile | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resizedPreview, setResizedPreview] = useState<string | null>(null);

  // State for resize options
  const [resizeType, setResizeType] = useState<ResizeType>("ratio");
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(50);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File format data for the supported formats
  const fileFormats = [
    {
      id: "jpg",
      name: "JPG",
      icon: "/file.svg",
    },
    {
      id: "png",
      name: "PNG",
      icon: "/file.svg",
    },
    {
      id: "webp",
      name: "WEBP",
      icon: "/file.svg",
    },
    {
      id: "size",
      name: "Max size: 10MB",
      icon: "/file.svg",
    },
  ];

  // Cleanup function to remove uploaded files when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (uploadedFile || resizedFile) {
        fetch('/api/cleanup', {
          method: 'POST',
        }).catch(err => console.error('Failed to clean up files:', err));
      }
    };
  }, [uploadedFile, resizedFile]);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    // Reset states
    setError(null);
    setUploadedFile(null);
    setResizedFile(null);
    setResizedPreview(null);
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPG, PNG, and WEBP are supported');
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit');
      return;
    }
    
    setFile(selectedFile);
    
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
    
    // Upload the file
    handleUpload(selectedFile);
  }, []);

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
      
      // Set initial width and height if we have an image preview
      if (preview) {
        const img = document.createElement('img');
        img.onload = () => {
          setWidth(img.width);
          setHeight(img.height);
        };
        img.src = preview;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  }, [preview]);

  // Resize the image
  const handleResize = useCallback(async () => {
    if (!uploadedFile) return;
    
    setIsResizing(true);
    setError(null);
    
    try {
      const requestData = {
        fileName: uploadedFile.fileName,
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
      
      // Load the resized image preview
      setResizedPreview(`/resized/${data.resizedFileName}?t=${Date.now()}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resize image');
    } finally {
      setIsResizing(false);
    }
  }, [uploadedFile, resizeType, width, height, percentage]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!resizedFile) return;
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = `/api/download/${resizedFile.resizedFileName}`;
    link.download = resizedFile.resizedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [resizedFile]);

  return (
    <div className="flex flex-col min-h-screen items-start relative bg-[#f9fafa]">
      {/* Header */}
      <header className="w-full h-16 flex items-center px-20 py-4 bg-white shadow-[0px_1px_2px_#0000000d]">
        <div className="max-w-screen-xl w-full mx-auto px-4">
          <div className="flex items-center justify-center">
            <h1 className="text-2xl leading-8 [font-family:'Pacifico',Helvetica] font-normal text-[#3b81f5] text-center tracking-[0]">
              PixForge
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 md:px-8 lg:px-36 py-0">
        <div className="max-w-6xl w-full mx-auto px-4 py-8">
          <div className="pb-8">
            <div className="w-full">
              {/* Page Title */}
              <div className="pb-2">
                <h2 className="text-3xl font-semibold text-gray-800 [font-family:'Roboto',Helvetica] leading-9">
                  Transform Your Images
                </h2>
              </div>

              {/* Page Subtitle */}
              <div className="pb-6">
                <p className="text-base font-normal text-[#4a5462] [font-family:'Roboto',Helvetica] leading-6">
                  Simple yet powerful image processing tools at your fingertips
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              {/* Upload Card */}
              <Card className="w-full mb-8 p-6 rounded-2xl shadow-[0px_4px_6px_-1px_#0000001a,0px_2px_4px_-2px_#0000001a]">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-800 [font-family:'Roboto',Helvetica] leading-7">
                    Upload Image
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Upload Area */}
                  {!uploadedFile ? (
                    <div 
                      className="flex flex-col items-center justify-center w-full h-48 p-0.5 mb-4 rounded-2xl border-2 border-dashed border-slate-300 cursor-pointer"
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
                      <div className="pb-2">
                        <div className="w-12 h-12 flex items-center justify-center">
                          <Image
                            className="w-8 h-8"
                            alt="Upload icon"
                            src="/file.svg"
                            width={32}
                            height={32}
                          />
                        </div>
                      </div>
                      <div className="pb-2">
                        <p className="text-base font-normal text-[#6a7280] [font-family:'Roboto',Helvetica] leading-6">
                          {isUploading ? 'Uploading...' : 'Drag & Drop your image here or Click to Browse'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-normal text-gray-400 [font-family:'Roboto',Helvetica] leading-5">
                          Supported formats: JPG, PNG, WEBP
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Original Image Preview */}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-2">Original Image</p>
                          <div className="border rounded-lg overflow-hidden h-64 flex items-center justify-center bg-gray-100">
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
                          <p className="text-sm font-medium text-gray-700 mb-2">Resized Image</p>
                          <div className="border rounded-lg overflow-hidden h-64 flex items-center justify-center bg-gray-100">
                            {isResizing ? (
                              <p>Processing...</p>
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
                              <p className="text-gray-400">Resize to see preview</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Format Information */}
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    {fileFormats.map((format) => (
                      <div key={format.id} className="flex items-center">
                        <div className="pr-1">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <Image
                              className="w-4 h-4"
                              alt={`${format.name} icon`}
                              src={format.icon}
                              width={16}
                              height={16}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-normal text-[#6a7280] [font-family:'Roboto',Helvetica] leading-5">
                          {format.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resize Options Card */}
              {uploadedFile && (
                <Card className="w-full mb-8 p-6 rounded-2xl shadow-[0px_4px_6px_-1px_#0000001a,0px_2px_4px_-2px_#0000001a]">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-800 [font-family:'Roboto',Helvetica] leading-7">
                      Resize Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Resize Type Selection */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-gray-700 mb-2">Resize Method</p>
                      <div className="flex gap-4">
                        <button
                          className={`px-4 py-2 rounded-md ${resizeType === 'ratio' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                          onClick={() => setResizeType('ratio')}
                        >
                          Custom Dimensions
                        </button>
                        <button
                          className={`px-4 py-2 rounded-md ${resizeType === 'percentage' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
                          onClick={() => setResizeType('percentage')}
                        >
                          Percentage
                        </button>
                      </div>
                    </div>

                    {/* Resize Controls */}
                    {resizeType === 'ratio' ? (
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                              Width (px)
                            </label>
                            <input
                              type="number"
                              id="width"
                              min="1"
                              value={width}
                              onChange={(e) => setWidth(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                              Height (px)
                            </label>
                            <input
                              type="number"
                              id="height"
                              min="1"
                              value={height}
                              onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-6">
                        <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-1">
                          Percentage: {percentage}%
                        </label>
                        <input
                          type="range"
                          id="percentage"
                          min="10"
                          max="100"
                          value={percentage}
                          onChange={(e) => setPercentage(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>10%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-0 pt-4">
                    <button
                      onClick={handleResize}
                      disabled={isResizing}
                      className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                    >
                      {isResizing ? 'Processing...' : 'Resize Image'}
                    </button>
                  </CardFooter>
                </Card>
              )}

              {/* Download Card */}
              {resizedFile && (
                <Card className="w-full mb-8 p-6 rounded-2xl shadow-[0px_4px_6px_-1px_#0000001a,0px_2px_4px_-2px_#0000001a]">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-xl font-semibold text-gray-800 [font-family:'Roboto',Helvetica] leading-7">
                      Download Resized Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-gray-600 mb-4">
                      Your image has been successfully resized. Click the button below to download it.
                    </p>
                  </CardContent>
                  <CardFooter className="p-0 pt-4">
                    <button
                      onClick={handleDownload}
                      className="w-full py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Download Resized Image
                    </button>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto pt-[25px] pb-6 bg-white border-t border-[#e4e7eb]">
        <div className="px-4 md:px-20">
          <div className="max-w-screen-xl w-full mx-auto px-4">
            <div className="pb-2">
              <div className="flex justify-center items-center">
                <h2 className="text-xl leading-7 [font-family:'Pacifico',Helvetica] font-normal text-[#3b81f5] text-center tracking-[0]">
                  PixForge
                </h2>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <p className="text-sm font-normal text-[#6a7280] [font-family:'Roboto',Helvetica] text-center leading-5">
                © 2025 PixForge. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};