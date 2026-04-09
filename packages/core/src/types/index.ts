// TypeScript types for browser experiments

export interface WebGPUContext {
  device: GPUDevice;
  adapter: GPUAdapter;
  canvasContext: GPUCanvasContext;
}

export interface SimulationState {
  grid: Uint8Array;
  width: number;
  height: number;
  generation: number;
  isRunning: boolean;
}

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  device?: GPUDevice;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  generationTime: number;
  renderTime: number;
}
