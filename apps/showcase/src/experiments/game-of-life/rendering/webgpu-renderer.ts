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
  private uniformBuffer: GPUBuffer | null = null;

  private width: number;
  private height: number;
  private cellSize: number;
  private aliveColor: [number, number, number, number];
  private deadColor: [number, number, number, number];
  private disableTiling = false;

  private isInitialized = false;
  private animationFrameId: number | null = null;

  constructor(options: RendererOptions) {
    this.canvas = options.canvas;
    this.width = options.width;
    this.height = options.height;
    this.cellSize = options.cellSize || 4;
    this.aliveColor = options.aliveColor || [0, 1, 0, 1]; // Green
    this.deadColor = options.deadColor || [0.1, 0.1, 0.1, 1]; // Dark gray

    // Set canvas to fixed size (512×512)
    this.canvas.width = 512;
    this.canvas.height = 512;
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

      // Create sampler with repeat addressing for tiling
      this.sampler = this.device.createSampler({
        magFilter: 'nearest',
        minFilter: 'nearest',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
      });

      // Create shader module - use sampler repeat mode for tiling (Firefox compatible)
      const shaderCode = `
        struct VertexOutput {
          @builtin(position) position: vec4f,
          @location(0) uv: vec2f,
        };

        @vertex
        fn vertex_main(@builtin(vertex_index) vertex_index: u32) -> VertexOutput {
          const positions = array<vec2f, 4>(
            vec2f(-1.0, -1.0),
            vec2f(-1.0, 1.0),
            vec2f(1.0, -1.0),
            vec2f(1.0, 1.0),
          );

          const uvs = array<vec2f, 4>(
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
          uv_scale_x: f32,
          uv_scale_y: f32,
        };

        @group(0) @binding(2) var<uniform> uniforms: Uniforms;

        @fragment
        fn fragment_main(input: VertexOutput) -> @location(0) vec4f {
          // Scale UVs for zoom/tiling
          // uv_scale = 512 / (gridSize * cellSize)  [INVERSE!]
          // If scale > 1: texture repeats (tiling, zoom OUT)
          // If scale < 1: texture is magnified (zoom IN, shows portion)
          let scaled_uv_x: f32 = input.uv.x * uniforms.uv_scale_x;
          let scaled_uv_y: f32 = input.uv.y * uniforms.uv_scale_y;
          
          let tex_coord: vec2f = vec2f(scaled_uv_x, scaled_uv_y);
          let sampled: vec4f = textureSample(grid_texture, grid_sampler, tex_coord);
          let cell_value: f32 = sampled.r;

          // Mix between dead and alive color based on cell value
          return mix(uniforms.dead_color, uniforms.alive_color, cell_value);
        }
      `;

      const shaderModule = this.device.createShaderModule({
        code: shaderCode,
      });

      // Create uniform buffer for colors and grid parameters
      // alive_color: vec4f (4 floats)
      // dead_color: vec4f (4 floats)
      // cell_size: f32 (1 float)
      // grid_width: f32 (1 float)
      // grid_height: f32 (1 float)
      // Total: 4 + 4 + 1 + 1 + 1 = 11 floats
      // Round up to nearest vec4 (4 floats) = 12 floats = 48 bytes
      const uniformBufferSize = 4 * 4 * 3; // 3x vec4f = 48 bytes
      this.uniformBuffer = this.device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      });

      // Write initial data to uniform buffer
      this.updateUniformBuffer();

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
              buffer: this.uniformBuffer,
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
      throw new Error(
        `Grid size mismatch: expected ${this.width * this.height}, got ${grid.length}`
      );
    }

    // Scale 0/1 values to 0/255 for r8unorm texture
    // r8unorm stores values as 0.0 to 1.0, where 255 becomes 1.0
    // Flip Y coordinate: texture has (0,0) at bottom-left, but grid has row 0 at top
    const scaledGrid = new Uint8Array(grid.length);
    for (let y = 0; y < this.height; y++) {
      const srcRow = y * this.width;
      const dstRow = (this.height - 1 - y) * this.width; // Flip vertically
      for (let x = 0; x < this.width; x++) {
        scaledGrid[dstRow + x] = grid[srcRow + x] * 255;
      }
    }

    // Write grid data to texture
    this.device.queue.writeTexture(
      { texture: this.texture },
      scaledGrid.buffer,
      { bytesPerRow: this.width, rowsPerImage: this.height },
      { width: this.width, height: this.height, depthOrArrayLayers: 1 }
    );
  }

  /**
   * Update colors
   */
  updateColors(
    aliveColor: [number, number, number, number],
    deadColor: [number, number, number, number]
  ): void {
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
   * Update uniform buffer with current colors and UV scale
   */
  private updateUniformBuffer(): void {
    if (!this.device || !this.uniformBuffer) {
      return;
    }

    // Calculate UV scale for zoom/tiling
    // Canvas is fixed at 512px
    // Grid pixel size = gridSize * cellSize
    // UV scale = 512 / gridPixelSize (INVERSE relationship!)
    // Larger cell size → smaller uv_scale → texture appears larger (zoom IN)
    // Smaller cell size → larger uv_scale → texture appears smaller, tiles (zoom OUT)
    let uvScaleX = 512 / (this.width * this.cellSize);
    let uvScaleY = 512 / (this.height * this.cellSize);

    // If tiling is disabled, clamp UV scale to max 1.0 (no tiling)
    if (this.disableTiling) {
      uvScaleX = Math.min(uvScaleX, 1.0);
      uvScaleY = Math.min(uvScaleY, 1.0);
    }

    const uniformData = new Float32Array([
      // alive_color: vec4f
      ...this.aliveColor,
      // dead_color: vec4f
      ...this.deadColor,
      // uv_scale_x: f32, uv_scale_y: f32
      uvScaleX,
      uvScaleY,
      // Padding to fill vec4 (2 floats)
      0.0,
      0.0,
    ]);

    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
  }

  /**
   * Update cell size (changes zoom level)
   * Note: Canvas size is fixed, we zoom via UV scaling
   */
  setCellSize(cellSize: number): void {
    if (cellSize <= 0) {
      throw new Error(`Cell size must be positive, got ${cellSize}`);
    }

    this.cellSize = cellSize;
    this.updateUniformBuffer();
  }

  /**
   * Enable or disable texture tiling
   * When disabled, UV scale is clamped to max 1.0 (no tiling)
   */
  setTilingEnabled(enabled: boolean): void {
    this.disableTiling = !enabled;
    this.updateUniformBuffer();
  }
}
