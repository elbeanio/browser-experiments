// WebGPU utilities for browser experiments

export class WebGPUError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`WebGPU Error: ${message}`);
    this.name = 'WebGPUError';
  }
}

export interface WebGPUDeviceOptions {
  powerPreference?: GPUPowerPreference;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Record<string, number>;
}

/**
 * Initialize a WebGPU device with error handling
 */
export async function createWebGPUDevice(
  options: WebGPUDeviceOptions = {}
): Promise<GPUDevice> {
  if (!navigator.gpu) {
    throw new WebGPUError(
      'WebGPU is not supported in this browser. ' +
      'Ensure you are using Chrome/Edge 113+, Firefox 121+, or Safari 17.4+ ' +
      'and are on a secure context (HTTPS or localhost).'
    );
  }

  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: options.powerPreference || 'high-performance',
    });

    if (!adapter) {
      throw new WebGPUError('Failed to get GPU adapter. Your device may not support WebGPU.');
    }

    const device = await adapter.requestDevice({
      requiredFeatures: options.requiredFeatures,
      requiredLimits: options.requiredLimits,
    });

    if (!device) {
      throw new WebGPUError('Failed to get GPU device.');
    }

    // Set up unhandled error reporting
    device.addEventListener('uncapturederror', (event) => {
      console.error('Uncaptured WebGPU error:', event.error);
    });

    return device;
  } catch (error) {
    if (error instanceof WebGPUError) {
      throw error;
    }
    throw new WebGPUError('Failed to initialize WebGPU device', error);
  }
}

/**
 * Create a buffer with common usage patterns
 */
export function createBuffer(
  device: GPUDevice,
  size: number,
  usage: GPUBufferUsageFlags
): GPUBuffer {
  if (size <= 0) {
    throw new WebGPUError(`Buffer size must be positive, got ${size}`);
  }

  if (size % 4 !== 0) {
    console.warn(`Buffer size ${size} is not a multiple of 4, which may cause alignment issues.`);
  }

  return device.createBuffer({
    size,
    usage,
    mappedAtCreation: false,
  });
}

/**
 * Create a vertex buffer (common pattern)
 */
export function createVertexBuffer(
  device: GPUDevice,
  size: number
): GPUBuffer {
  return createBuffer(
    device,
    size,
    GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
  );
}

/**
 * Create a uniform buffer (common pattern)
 */
export function createUniformBuffer(
  device: GPUDevice,
  size: number
): GPUBuffer {
  return createBuffer(
    device,
    size,
    GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
  );
}

/**
 * Create a storage buffer (common pattern)
 */
export function createStorageBuffer(
  device: GPUDevice,
  size: number
): GPUBuffer {
  return createBuffer(
    device,
    size,
    GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
  );
}

/**
 * Create a 2D texture with common defaults
 */
export function createTexture2D(
  device: GPUDevice,
  width: number,
  height: number,
  format: GPUTextureFormat = 'rgba8unorm',
  usage: GPUTextureUsageFlags = GPUTextureUsage.TEXTURE_BINDING |
    GPUTextureUsage.COPY_DST |
    GPUTextureUsage.RENDER_ATTACHMENT
): GPUTexture {
  if (width <= 0 || height <= 0) {
    throw new WebGPUError(`Texture dimensions must be positive, got ${width}x${height}`);
  }

  return device.createTexture({
    size: { width, height, depthOrArrayLayers: 1 },
    format,
    usage,
    dimension: '2d',
    mipLevelCount: 1,
    sampleCount: 1,
  });
}

/**
 * Create a storage texture for compute shaders
 */
export function createStorageTexture2D(
  device: GPUDevice,
  width: number,
  height: number,
  format: GPUTextureFormat = 'rgba8unorm'
): GPUTexture {
  return createTexture2D(
    device,
    width,
    height,
    format,
    GPUTextureUsage.STORAGE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.COPY_SRC
  );
}

/**
 * Compile a WGSL shader with validation
 */
export async function compileShader(
  device: GPUDevice,
  code: string,
  label?: string
): Promise<GPUShaderModule> {
  if (!code.trim()) {
    throw new WebGPUError('Shader code cannot be empty');
  }

  const shaderModule = device.createShaderModule({
    code,
    label,
  });

  // Check for compilation errors
  const compilationInfo = await shaderModule.getCompilationInfo();
  if (compilationInfo.messages.length > 0) {
    const errors = compilationInfo.messages
      .filter(msg => msg.type === 'error')
      .map(msg => `${msg.lineNum}:${msg.linePos} - ${msg.message}`)
      .join('\n');

    if (errors) {
      throw new WebGPUError(`Shader compilation failed:\n${errors}`);
    }

    // Log warnings
    const warnings = compilationInfo.messages
      .filter(msg => msg.type === 'warning')
      .map(msg => `${msg.lineNum}:${msg.linePos} - ${msg.message}`)
      .join('\n');

    if (warnings) {
      console.warn(`Shader compilation warnings:\n${warnings}`);
    }
  }

  return shaderModule;
}

/**
 * Write data to a buffer
 */
export function writeBuffer(
  device: GPUDevice,
  buffer: GPUBuffer,
  data: BufferSource,
  offset: number = 0
): void {
  device.queue.writeBuffer(buffer, offset, data);
}

/**
 * Copy texture to buffer
 */
export function copyTextureToBuffer(
  device: GPUDevice,
  source: GPUTexture,
  destination: GPUBuffer,
  width: number,
  height: number
): void {
  const commandEncoder = device.createCommandEncoder();
  commandEncoder.copyTextureToBuffer(
    { texture: source },
    { buffer: destination, bytesPerRow: width * 4 },
    { width, height }
  );
  device.queue.submit([commandEncoder.finish()]);
}

/**
 * Check if WebGPU is supported
 */
export function isWebGPUSupported(): boolean {
  return !!navigator.gpu;
}

/**
 * Get GPU adapter info for debugging
 */
export async function getGPUInfo(): Promise<GPUAdapterInfo | null> {
  if (!navigator.gpu) return null;
  
  const adapter = await navigator.gpu.requestAdapter();
  // Note: requestAdapterInfo might not be available in all browsers
  if (adapter && 'requestAdapterInfo' in adapter) {
    return await (adapter as GPUAdapter & { requestAdapterInfo(): Promise<GPUAdapterInfo> }).requestAdapterInfo();
  }
  return null;
}
