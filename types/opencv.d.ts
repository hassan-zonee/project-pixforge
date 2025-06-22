declare module 'opencv.js' {
  // Basic OpenCV types
  export class Mat {
    delete(): void;
  }
  
  export class Size {
    constructor(width: number, height: number);
  }
  
  // Constants
  export const IMREAD_UNCHANGED: number;
  export const INTER_AREA: number;
  
  // Functions
  export function imdecode(buffer: Uint8Array, flags: number): Mat;
  export function resize(src: Mat, dst: Mat, dsize: Size, fx: number, fy: number, interpolation: number): void;
  export function imencode(ext: string, img: Mat): Uint8Array;
} 