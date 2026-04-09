export interface Experiment {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  features: string[];
  lastUpdated: string;
  details: {
    overview: string;
    implementation: string[];
    performance: string[];
    optimization: string[];
    browserSupport: string[];
  };
}

export const experiments: Experiment[] = [
  {
    id: 'game-of-life',
    name: 'Conway\'s Game of Life',
    tagline: 'Classic cellular automaton with WebGPU rendering',
    description: 'A naive implementation of Conway\'s Game of Life using CPU simulation and WebGPU rendering. Demonstrates basic WebGPU texture updates and shader-based visualization.',
    status: 'completed',
    complexity: 'beginner',
    features: [
      'Texture-based grid rendering',
      'CPU simulation with WebGPU visualization',
      'Real-time controls and statistics',
      'Multiple color themes'
    ],
    lastUpdated: 'April 2024',
    details: {
      overview: 'This experiment implements Conway\'s Game of Life with a focus on learning WebGPU fundamentals. The simulation runs on CPU while rendering uses WebGPU textures and shaders.',
      implementation: [
        'CPU-based simulation in TypeScript',
        'WebGPU texture updates for grid visualization',
        'Simple vertex/fragment shaders for cell rendering',
        'Real-time controls for simulation parameters'
      ],
      performance: [
        'CPU-bound simulation (naive implementation)',
        'Full texture updates each frame',
        'Target: 60 FPS for 64x64 grid',
        'Memory: ~4KB for grid texture'
      ],
      optimization: [
        'Phase 1: Move simulation to compute shaders',
        'Phase 2: Implement double buffering',
        'Phase 3: Optimize memory access patterns',
        'Phase 4: Add Web Workers for CPU simulation'
      ],
      browserSupport: [
        'Chrome 113+ (Windows, macOS, Linux)',
        'Edge 113+ (Windows, macOS)',
        'Firefox 121+ (Windows, macOS, Linux)',
        'Safari 17.4+ (macOS, iOS)'
      ]
    }
  },
  {
    id: 'plasma-effect',
    name: 'Plasma Effect',
    tagline: 'Real-time procedural graphics with compute shaders',
    description: 'A WebGPU compute shader implementation of classic plasma effects, demonstrating real-time procedural graphics and GPU computation.',
    status: 'planned',
    complexity: 'intermediate',
    features: [
      'Compute shader-based plasma generation',
      'Real-time parameter controls',
      'Multiple plasma algorithms',
      'Performance monitoring'
    ],
    lastUpdated: 'Planned',
    details: {
      overview: 'This experiment will demonstrate WebGPU compute shaders by implementing various plasma effect algorithms running entirely on the GPU.',
      implementation: [
        'Compute shader for plasma generation',
        'Real-time parameter adjustment',
        'Multiple algorithm implementations',
        'Performance visualization'
      ],
      performance: [
        'GPU-bound computation',
        'Real-time 60 FPS target',
        '4K resolution support',
        'Multiple workgroup optimization'
      ],
      optimization: [
        'Workgroup size optimization',
        'Memory access patterns',
        'Shader instruction count reduction',
        'Async compute queue usage'
      ],
      browserSupport: [
        'Requires compute shader support',
        'Chrome 118+ recommended',
        'Modern desktop GPUs required'
      ]
    }
  },
  {
    id: 'fractal-explorer',
    name: 'Fractal Explorer',
    tagline: 'Interactive Mandelbrot/Julia set visualization',
    description: 'A GPU-accelerated fractal explorer with real-time zoom and pan, demonstrating advanced WebGPU compute shader patterns and interactive visualization.',
    status: 'planned',
    complexity: 'advanced',
    features: [
      'GPU-accelerated fractal computation',
      'Real-time zoom and pan',
      'Multiple fractal types',
      'Color palette customization'
    ],
    lastUpdated: 'Planned',
    details: {
      overview: 'This advanced experiment will implement GPU-accelerated fractal computation using WebGPU compute shaders, with real-time interaction and visualization.',
      implementation: [
        'Compute shader for fractal iteration',
        'Double buffering for smooth interaction',
        'Real-time color mapping',
        'Progressive rendering'
      ],
      performance: [
        'Heavy GPU computation',
        'Real-time interaction target',
        'High precision floating point',
        'Memory bandwidth optimization'
      ],
      optimization: [
        'Iteration count optimization',
        'Memory hierarchy utilization',
        'Async computation and rendering',
        'Precision vs performance trade-offs'
      ],
      browserSupport: [
        'Requires high-precision compute shaders',
        'Modern desktop GPUs recommended',
        'Chrome 120+ for best performance'
      ]
    }
  }
];

export type ExperimentStatus = Experiment['status'];
export type ExperimentComplexity = Experiment['complexity'];