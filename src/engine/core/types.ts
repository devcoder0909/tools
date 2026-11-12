export interface FileMeta {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

export interface EngineOptions {
  quality?: number; // 0.05 to 0.95
  targetBytes?: number;
  width?: number;
  height?: number;
  scale?: number;
  stripMetadata?: boolean;
  pageSize?: 'A4' | 'Letter' | 'Fit';
}

export interface ConversionResult {
  blob: Blob;
  fileName: string;
  originalSize: number;
  newSize: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface Engine {
  canRun(input: FileMeta, opts: EngineOptions): boolean;
  run(file: File, opts: EngineOptions, onProgress: (p: number) => void): Promise<ConversionResult>;
  cancel(): void;
}
