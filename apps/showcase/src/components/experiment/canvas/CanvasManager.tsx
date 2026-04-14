import React, { useRef, useEffect, ReactNode } from 'react';

export type CanvasContext = 
  | CanvasRenderingContext2D 
  | WebGLRenderingContext 
  | WebGL2RenderingContext 
  | GPUCanvasContext 
  | null;

export interface CanvasManagerProps {
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** CSS class name for the canvas element */
  className?: string;
  /** Whether to use WebGL/WebGPU context (default: false for 2d) */
  useWebGPU?: boolean;
  /** Callback when canvas is mounted and context is available */
  onCanvasReady?: (canvas: HTMLCanvasElement, context: CanvasContext) => void;
  /** Callback when canvas is resized */
  onResize?: (width: number, height: number) => void;
  /** Custom render function called on each animation frame */
  onRender?: (context: CanvasContext, timestamp: number) => void;
  /** Whether animation loop is running */
  isRunning?: boolean;
  /** Target frames per second (0 = unlimited) */
  targetFps?: number;
  /** Children to render inside the canvas wrapper */
  children?: ReactNode;
  /** Additional canvas attributes */
  canvasAttributes?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
}

const CanvasManager: React.FC<CanvasManagerProps> = ({
  width = 1024,
  height = 768,
  className = '',
  useWebGPU = false,
  onCanvasReady,
  onResize,
  onRender,
  isRunning = false,
  targetFps = 60,
  children,
  canvasAttributes = {},
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastRenderTimeRef = useRef<number>(0);

  // Initialize canvas and context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Get rendering context
    let context: CanvasContext = null;
    try {
      if (useWebGPU) {
        // Try to get WebGPU context
        const gpuContext = canvas.getContext('webgpu') as GPUCanvasContext;
        if (gpuContext) {
          context = gpuContext;
        } else {
          // Fallback to WebGL
          context = canvas.getContext('webgl2') || canvas.getContext('webgl');
        }
      } else {
        // Use 2D context
        context = canvas.getContext('2d');
      }
    } catch (error) {
      console.error('Failed to get canvas context:', error);
    }

    // Notify parent that canvas is ready
    if (onCanvasReady) {
      onCanvasReady(canvas, context);
    }

    // Cleanup on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, useWebGPU, onCanvasReady]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const newWidth = canvas.clientWidth;
      const newHeight = canvas.clientHeight;
      
      if (newWidth !== canvas.width || newHeight !== canvas.height) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        if (onResize) {
          onResize(newWidth, newHeight);
        }
      }
    };

    // Initial resize
    handleResize();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onResize]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || !onRender) return;

    const animate = (timestamp: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Calculate time since last render
      const deltaTime = timestamp - lastRenderTimeRef.current;
      const targetFrameTime = targetFps > 0 ? 1000 / targetFps : 0;

      // Render if enough time has passed or unlimited FPS
      if (targetFps === 0 || deltaTime >= targetFrameTime) {
        // Get current context
        let context: CanvasContext = null;
        if (useWebGPU) {
          context = canvas.getContext('webgpu') as GPUCanvasContext || 
                   canvas.getContext('webgl2') || 
                   canvas.getContext('webgl');
        } else {
          context = canvas.getContext('2d');
        }

        // Call render callback
        onRender(context, timestamp);
        lastRenderTimeRef.current = timestamp;
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, targetFps, onRender, useWebGPU]);

  // Expose canvas ref via ref if needed
  // (This would require forwardRef, but we'll keep it simple for now)

  return (
    <div className={`canvas-manager ${className}`}>
      <canvas
        ref={canvasRef}
        className="experiment-canvas"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        {...canvasAttributes}
      />
      {children}
    </div>
  );
};

export default CanvasManager;