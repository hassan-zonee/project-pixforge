"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Script from 'next/script';

// Create a context to provide OpenCV status
interface OpenCVContextType {
  isOpenCVLoaded: boolean;
}

const OpenCVContext = createContext<OpenCVContextType>({
  isOpenCVLoaded: false,
});

export const useOpenCV = () => useContext(OpenCVContext);

export const OpenCVProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpenCVLoaded, setIsOpenCVLoaded] = useState(false);

  // Function to handle OpenCV.js loading
  const handleOpenCVLoad = () => {
    if (typeof window !== 'undefined' && (window as any).cv) {
      console.log('OpenCV.js loaded successfully');
      setIsOpenCVLoaded(true);
    }
  };

  // Check if OpenCV is already loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).cv) {
      setIsOpenCVLoaded(true);
    }
  }, []);

  return (
    <OpenCVContext.Provider value={{ isOpenCVLoaded }}>
      <Script
        src="https://docs.opencv.org/4.7.0/opencv.js"
        onLoad={handleOpenCVLoad}
        strategy="afterInteractive"
      />
      {children}
    </OpenCVContext.Provider>
  );
}; 