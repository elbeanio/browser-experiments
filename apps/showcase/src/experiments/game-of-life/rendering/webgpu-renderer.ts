// Simplified WebGPU renderer for Game of Life

export interface RendererOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  cellSize?: number;
  aliveColor?: [number, number, number, number]; // RGBA
  deadColor?: [number, number, number, number]; // RGBA
}

export class GameOfLifeRenderer {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private bindGroup: GPUBindGroup | null = null;
  private texture: GPUTexture | null = null;
  private sampler: GPUSampler | null = null;
  
  private width: number;
  private height: number;
  private cellSize: number;
  private aliveColor: [number, number, number, number];
  private deadColor: [number, number, number, number];

  private isInitialized = false;
  private animationFrameId: number | null = null;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.width = options.width;
    this.height = options.height;
    this.cellSize = options.cellSize || 4;
    this.aliveColor = options.aliveColor || [0, 1, 0, 1]; // Green
    this.deadColor = options.deadColor || [0.1, 0.1, 0.1, 1]; // Dark gray

    // Set canvas size
    this.canvas.width = this.width * this.cellSize;
    this.canvas.height = this.height * this.cellSize;
  }

  /**
   * Initialize WebGPU resources
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Check WebGPU support
      if (!navigator.gpu) {
        throw new Error('WebGPU is not supported in this browser');
      }

      // Get adapter and device
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        throw new Error('Failed to get GPU adapter');
      }

      this.device = await adapter.requestDevice();
      if (!this.device) {
        throw new Error('Failed to get GPU device');
      }

      // Get canvas context
      this.context = this.canvas.getContext('webgpu');
      if (!this.context) {
        throw new Error('Failed to get WebGPU canvas context');
      }

      // Configure canvas
      const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
      });

      // Create texture for grid data
      this.texture = this.device.createTexture({
        size: { width: this.width, height: this.height, depthOrArrayLayers: 1 },
        format: 'r8unorm', // Single channel 8-bit texture
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
      });

      // Create sampler
      this.sampler = this.device.createSampler({
        magFilter: 'nearest',
        minFilter: 'nearest',
      });

      // Create shader module
      const shaderCode = `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) uv: vec2f,
        };

        @vertex
        fn vertex_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
          const positions = array(
            vec2f(-1.0, -1.0),
            vec2f(-1.0, 1.0),
            vec2f(1.0, -1.0),
            vec2f(1.0, 1.0),
          );

          const uvs = array(
            vec2f(0.0, 0.0),
            vec2f(0.0, 1.0),
            vec2f(1.0, 0.0),
            vec2f(1.0, 1.0),
          );

          var output: VertexOutput;
          output.position = vec4f(positions[vertex_index], 0.0, 1.0);
          output.uv = uvs[vertex_index];
          return output;
        }

        @group(0) @binding(0) var grid_texture: texture_2d<f32>;
        @group(0) @binding(1) var grid_sampler: sampler;

        struct Uniforms {
          alive_color: vec4f,
          dead_color: vec4f,
        };

        @group(0) @binding(2) var<uniform> uniforms: Uniforms;

        @fragment
        fn fragment_main(input: VertexOutput) -> @location(0) vec4f {
          let cell_value = textureSample(grid_texture, grid_sampler, input.uv).r;
          
          // Mix between dead and alive color based on cell value
          return mix(uniforms.dead_color, uniforms.alive_color, cell_value);
        }
      `;

      const shaderModule = this.device.createShaderModule({
        code: shaderCode,
      });

      // Create uniform buffer for colors
      const uniformBufferSize = 4 * 4 * 2; // 2x vec4f (alive_color + dead_color)
      const uniformBuffer = this.device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      // Write initial colors to uniform buffer
      const uniformData = new Float32Array([
        ...this.aliveColor,
        ...this.deadColor,
      ]);
      this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

      // Create bind group layout
      const bindGroupLayout = this.device.createBindGroupLayout({
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
              sampleType: 'float',
              viewDimension: '2d',
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {
              type: 'filtering',
            },
          },
          {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
              type: 'uniform',
            },
          },
        ],
      });

      // Create bind group
      this.bindGroup = this.device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: this.texture.createView(),
          },
          {
            binding: 1,
            resource: this.sampler,
          },
          {
            binding: 2,
            resource: {
              buffer: uniformBuffer,
            },
          },
        ],
      });

      // Create pipeline layout
      const pipelineLayout = this.device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout],
      });

      // Create render pipeline
      this.pipeline = this.device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
          module: shaderModule,
          entryPoint: 'vertex_main',
        },
        fragment: {
          module: shaderModule,
          entryPoint: 'fragment_main',
          targets: [
            {
              format: presentationFormat,
            },
          ],
        },
        primitive: {
          topology: 'triangle-strip',
          stripIndexFormat: undefined,
        },
      });

      this.isInitialized = true;
      console.log('WebGPU renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebGPU renderer:', error);
      throw error;
    }
  }

  /**
   * Update grid texture with simulation data
   */
  updateGrid(grid: Uint8Array): void {
    if (!this.isInitialized || !this.device || !this.texture) {
      throw new Error('Renderer not initialized');
    }

    if (grid.length !== this.width * this.height) {
      throw new Error(`Grid size mismatch: expected ${this.width * this.height}, got ${grid.length}`);
    }

    // Write grid data to texture
    this.device.queue.writeTexture(
      { texture: this.texture },
      grid.buffer,
      { bytesPerRow: this.width, rowsPerImage: this.height },
      { width: this.width, height: this.height, depthOrArrayLayers: 1 }
    );
  }

  /**
   * Update colors
   */
  updateColors(aliveColor: [number, number, number, number], deadColor: [number, number, number, number]): void {
    if (!this.isInitialized || !this.device) {
      throw new Error('Renderer not initialized');
    }

    this.aliveColor = aliveColor;
    this.deadColor = deadColor;

    // Note: Would need to update uniform buffer here
    // For now, colors are set at initialization
  }

  /**
   * Render current state
   */
  render(): void {
    if (!this.isInitialized || !this.device || !this.context || !this.pipeline || !this.bindGroup) {
      throw new Error('Renderer not initialized');
    }

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.draw(4, 1, 0, 0);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  /**
   * Start animation loop
   */
  startAnimation(updateCallback: () => void): void {
    if (this.animationFrameId !== null) {
      return;
    }

    const renderLoop = () => {
      updateCallback();
      this.render();
      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    this.animationFrameId = requestAnimationFrame(renderLoop);
  }

  /**
   * Stop animation loop
   */
  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAnimation();
    
    // Note: In a real application, we would properly dispose of all WebGPU resources
    // (textures, buffers, pipelines, etc.) to avoid memory leaks
    this.isInitialized = false;
    this.device = null;
    this.context = null;
    this.pipeline = null;
    this.bindGroup = null;
    this.texture = null;
    this.sampler = null;
  }

  /**
   * Check if renderer is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get canvas dimensions
   */
  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * Update cell size (recreates canvas)
   */
  setCellSize(cellSize: number): void {
    if (cellSize <= 0) {
      throw new Error(`Cell size must be positive, got ${cellSize}`);
    }

    this.cellSize = cellSize;
    this.canvas.width = this.width * this.cellSize;
    this.canvas.height = this.height * this.cellSize;
  }
}