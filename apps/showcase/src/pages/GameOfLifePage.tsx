import React, { useEffect, useRef, useState } from 'react';
import { GameOfLife } from '../experiments/game-of-life/simulation/game-of-life';
import { GameOfLifeRenderer } from '../experiments/game-of-life/rendering/webgpu-renderer';
import { usePerformanceMonitor, BenchmarkMode } from '../experiments/game-of-life/performance';

const GameOfLifePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<GameOfLife | null>(null);
  const [renderer, setRenderer] = useState<GameOfLifeRenderer | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [gridSize, setGridSize] = useState(256); // Massive grid for insane tiling detail
  const [cellSize, setCellSize] = useState(1); // Tiny 1px cells for maximum density
  const [speed, setSpeed] = useState(30); // Default to 30 FPS (middle of range 1-60, unlimited is 61)

  // Stats
  const [generation, setGeneration] = useState(0);
  const [aliveCount, setAliveCount] = useState(0);
  const [density, setDensity] = useState(0);
  // Simulation FPS tracking
  const [simulationFps, setSimulationFps] = useState(0);
  const stepTimesRef = useRef<number[]>([]);
  // Modal states
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<'single' | '3x3' | '5x5'>('single');
  const [drawMode, setDrawMode] = useState<'draw' | 'erase' | null>(null); // null = no tool selected
  const [selectedPattern, setSelectedPattern] = useState<{
    name: string;
    width: number;
    height: number;
    cells: number[][];
  } | null>(null);

  // Pattern management
  const [startingPositionGrid, setStartingPositionGrid] = useState<Uint8Array | null>(null);
  const { metrics } = usePerformanceMonitor({
    enabled: true,
    updateInterval: 1000,
    warningThresholds: {
      lowFps: 30,
      highFrameTime: 33,
      highMemoryUsage: 80,
    },
  });

  // Animation state
  const lastStepTimeRef = useRef(0);
  const frameIntervalRef = useRef(1000 / 10); // 10 FPS default
  const animationFrameRef = useRef<number | null>(null);

  // Simple black/white colors
  const colors = {
    alive: [0.94, 0.94, 0.94, 1] as [number, number, number, number], // #F0F0F0
    dead: [0, 0, 0, 1] as [number, number, number, number], // #000000
  };

  // Initialize simulation and renderer
  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current) return;

      try {
        setError(null);

        // Create simulation
        const newGame = new GameOfLife({
          width: gridSize,
          height: gridSize,
          initialDensity: 0.4, // Slightly denser for better background pattern
          wrapEdges: true,
        });

        setGame(newGame);

        // Create renderer
        const newRenderer = new GameOfLifeRenderer({
          canvas: canvasRef.current,
          width: gridSize,
          height: gridSize,
          cellSize,
          aliveColor: colors.alive,
          deadColor: colors.dead,
        });

        // Initialize WebGPU
        await newRenderer.initialize();
        setRenderer(newRenderer);

        // Update grid texture
        newRenderer.updateGrid(newGame.getState().grid);
        newRenderer.render();

        // Update stats
        updateStats(newGame);

        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Game of Life:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsInitialized(false);
      }
    };

    init();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, [gridSize]); // Recreate only when grid size changes

  // Update frame interval when speed changes
  useEffect(() => {
    // 61 represents "unlimited" (process every frame)
    frameIntervalRef.current = speed === 61 ? 0 : 1000 / speed;
  }, [speed]);

  // Update stats
  const updateStats = (gameInstance: GameOfLife) => {
    const stats = gameInstance.getStats();
    setGeneration(stats.generation);
    setAliveCount(stats.alive);
    setDensity(stats.density);
  };

  // Animation loop
  const animationLoop = (currentTime: number) => {
    if (!isRunning || !game || !renderer) {
      return;
    }

    // Update simulation at target FPS (or every frame if unlimited)
    const shouldStep =
      speed === 61 || currentTime - lastStepTimeRef.current >= frameIntervalRef.current;
    if (shouldStep) {
      game.step();
      renderer.updateGrid(game.getState().grid);
      updateStats(game);

      // Track simulation FPS
      stepTimesRef.current.push(currentTime);
      // Keep only last second of data
      const oneSecondAgo = currentTime - 1000;
      stepTimesRef.current = stepTimesRef.current.filter((time) => time > oneSecondAgo);
      // Calculate FPS
      if (stepTimesRef.current.length > 1) {
        const timeSpan =
          stepTimesRef.current[stepTimesRef.current.length - 1] - stepTimesRef.current[0];
        const fps = timeSpan > 0 ? ((stepTimesRef.current.length - 1) * 1000) / timeSpan : 0;
        setSimulationFps(Math.round(fps));
      }

      lastStepTimeRef.current = currentTime;
    }

    // Render
    renderer.render();

    // Continue loop
    animationFrameRef.current = requestAnimationFrame(animationLoop);
  };

  // Start/stop animation
  useEffect(() => {
    if (!isInitialized || !game || !renderer) return;

    if (isRunning) {
      game.setRunning(true);
      lastStepTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animationLoop);
    } else {
      game.setRunning(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, isInitialized]);

  // Update highlighting based on tool selection and simulation state
  useEffect(() => {
    if (renderer) {
      // Enable highlighting if a tool or pattern is selected AND simulation isn't running
      const shouldHighlight = (drawMode !== null || selectedPattern !== null) && !isRunning;
      renderer.setHighlightEditableTile(shouldHighlight);
      renderer.render();
    }
  }, [drawMode, selectedPattern, isRunning, renderer]);

  // Handle ESC key to exit drawing mode, pattern placement, or fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (drawMode !== null) {
          setDrawMode(null);
        }
        if (selectedPattern !== null) {
          setSelectedPattern(null);
        }
        if (isFullscreen) {
          handleExitFullscreen();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawMode, selectedPattern, isFullscreen]);

  // Control handlers
  const handleRun = () => {
    if (game) {
      // Save current grid as starting position
      const state = game.getState();
      setStartingPositionGrid(new Uint8Array(state.grid));
    }
    setIsRunning(true);
  };
  const handleStop = () => setIsRunning(false);
  const handleStep = () => {
    if (game && renderer && !isRunning) {
      game.step();
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };
  const handleReset = () => {
    if (game && renderer) {
      game.randomize(0.4); // Reset to initial randomized state
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };

  // Fullscreen handlers
  const handleEnterFullscreen = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      } else if ((canvas as any).webkitRequestFullscreen) {
        (canvas as any).webkitRequestFullscreen();
      } else if ((canvas as any).mozRequestFullScreen) {
        (canvas as any).mozRequestFullScreen();
      } else if ((canvas as any).msRequestFullscreen) {
        (canvas as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    }
  };

  const handleExitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    setIsFullscreen(false);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const handleGridSizeChange = (newSize: number) => {
    setIsRunning(false); // Stop simulation when changing grid size

    if (newSize === 1024) {
      // 1024 represents "max" (canvas) - use calculated canvas size
      const canvasSize = calculateGridSizeFromCanvas();
      setGridSize(canvasSize);
    } else {
      setGridSize(newSize);
    }
    // Effect will recreate simulation and renderer with new size
  };
  // Calculate grid size from canvas dimensions
  const calculateGridSizeFromCanvas = () => {
    if (!canvasRef.current) return gridSize;
    const canvas = canvasRef.current;
    const width = canvas.width;
    const height = canvas.height;
    // Use the smaller dimension to ensure square grid fits
    const canvasSize = Math.min(width, height);
    // Calculate grid size based on cell size (round to nearest multiple of 16)
    const calculatedSize = Math.floor(canvasSize / cellSize);
    return Math.max(16, Math.floor(calculatedSize / 16) * 16); // Round to nearest multiple of 16, min 16
  };

  const handleCellSizeChange = (newSize: number) => {
    setCellSize(newSize);
    if (renderer) {
      renderer.setCellSize(newSize);
      renderer.render();
    }
    // If grid is set to "max" (canvas), update grid size based on new cell size
    if (gridSize >= 1024) {
      const newGridSize = calculateGridSizeFromCanvas();
      setGridSize(newGridSize);
      // Effect will recreate simulation with new size
    }
  };

  // Convert mouse coordinates to grid coordinates
  const getGridCoordinates = (clientX: number, clientY: number): [number, number] | null => {
    if (!canvasRef.current) return null;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      return [gridX, gridY];
    }
    return null;
  };

  // Draw cells at specified coordinates with current brush
  const drawCells = (gridX: number, gridY: number) => {
    if (!game || !renderer || isRunning) return;

    const brushOffsets = {
      single: [[0, 0]],
      '3x3': [
        [-1, -1],
        [0, -1],
        [1, -1],
        [-1, 0],
        [0, 0],
        [1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
      ],
      '5x5': [
        [-2, -2],
        [-1, -2],
        [0, -2],
        [1, -2],
        [2, -2],
        [-2, -1],
        [-1, -1],
        [0, -1],
        [1, -1],
        [2, -1],
        [-2, 0],
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, 0],
        [-2, 1],
        [-1, 1],
        [0, 1],
        [1, 1],
        [2, 1],
        [-2, 2],
        [-1, 2],
        [0, 2],
        [1, 2],
        [2, 2],
      ],
    };

    const offsets = brushOffsets[brushSize];
    let cellsModified = false;

    for (const [dx, dy] of offsets) {
      const targetX = gridX + dx;
      const targetY = gridY + dy;

      if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
        if (drawMode === 'draw') {
          game.setCell(targetX, targetY, true);
        } else if (drawMode === 'erase') {
          game.setCell(targetX, targetY, false);
        }
        // If drawMode is null, don't modify cells
        if (drawMode !== null) {
          cellsModified = true;
        }
      }
    }

    if (cellsModified) {
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };

  // Handle mouse down on canvas
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Only allow drawing if a tool or pattern is selected and simulation isn't running
    if (!game || !renderer || isRunning || (drawMode === null && selectedPattern === null)) return;

    setIsDrawing(true);

    const coords = getGridCoordinates(event.clientX, event.clientY);
    if (coords) {
      const [gridX, gridY] = coords;

      if (drawMode !== null) {
        drawCells(gridX, gridY);
      } else if (selectedPattern !== null) {
        placePattern(gridX, gridY, selectedPattern);
      }
    }
  };

  // Handle mouse move on canvas (for drag drawing)
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !game || !renderer || isRunning) return;

    const coords = getGridCoordinates(event.clientX, event.clientY);
    if (coords) {
      const [gridX, gridY] = coords;
      drawCells(gridX, gridY);
    }
  };

  // Handle mouse up on canvas
  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  // Handle mouse leave canvas
  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  // Save current state to PNG file
  const handleSaveToFile = async (saveStartingPosition = false) => {
    if (!game || !renderer) return;

    try {
      const state = game.getState();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `game-of-life-${timestamp}.png`;

      // Get the current grid state (either current or starting position)
      const gridToSave =
        saveStartingPosition && startingPositionGrid
          ? startingPositionGrid
          : new Uint8Array(state.grid);

      // Note: Metadata would be embedded in PNG tEXt chunks in a more complete implementation
      // For now, we save the visual representation only
      // Future enhancement: Add proper PNG metadata embedding

      // Create canvas for PNG export
      const canvas = document.createElement('canvas');
      canvas.width = state.width;
      canvas.height = state.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }

      // Create image data
      const imageData = ctx.createImageData(state.width, state.height);
      const data = imageData.data;

      // Fill with black/white pixels
      for (let i = 0; i < gridToSave.length; i++) {
        const value = gridToSave[i] === 1 ? 255 : 0;
        const pixelIndex = i * 4;
        data[pixelIndex] = value; // R
        data[pixelIndex + 1] = value; // G
        data[pixelIndex + 2] = value; // B
        data[pixelIndex + 3] = 255; // A (fully opaque)
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert to blob and add metadata
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) throw new Error('Failed to create blob');
          resolve(blob);
        }, 'image/png');
      });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to save pattern:', error);
      alert('Failed to save pattern. See console for details.');
    }
  };

  // Load pattern from PNG file
  const handleLoadFromFile = async () => {
    if (!game || !renderer) return;

    try {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          // Read file as data URL
          const reader = new FileReader();
          const imageDataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          // Create image element
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = imageDataUrl;
          });

          // Create canvas to read pixel data
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Failed to create canvas context');
          }

          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const pixelData = imageData.data;

          // Convert to grid
          const width = img.width;
          const height = img.height;
          const grid = new Uint8Array(width * height);

          for (let i = 0; i < grid.length; i++) {
            const pixelIndex = i * 4;
            // Simple threshold: if any color channel > 128, consider it alive
            const r = pixelData[pixelIndex];
            const g = pixelData[pixelIndex + 1];
            const b = pixelData[pixelIndex + 2];
            const avg = (r + g + b) / 3;
            grid[i] = avg > 128 ? 1 : 0;
          }

          // Check if pattern matches current grid size
          if (width !== gridSize || height !== gridSize) {
            const resize = confirm(
              `Pattern size (${width}x${height}) doesn't match current grid (${gridSize}x${gridSize}).\n\n` +
                `Options:\n` +
                `• Cancel: Keep current grid size\n` +
                `• OK: Resize grid to ${width}x${height}`
            );

            if (resize) {
              setGridSize(Math.max(width, height));
              // Wait for next render cycle for grid to resize
              setTimeout(() => {
                if (game && renderer) {
                  loadGridIntoGame(game, renderer, grid, width);
                }
              }, 100);
              return;
            } else {
              return;
            }
          }

          // Load pattern into current grid
          loadGridIntoGame(game, renderer, grid, width);
        } catch (error) {
          console.error('Failed to load pattern:', error);
          alert('Failed to load pattern. See console for details.');
        }
      };

      input.click();
    } catch (error) {
      console.error('Failed to create file input:', error);
      alert('Failed to load pattern. See console for details.');
    }
  };

  // Helper function to load grid into game
  const loadGridIntoGame = (
    game: GameOfLife,
    renderer: GameOfLifeRenderer,
    grid: Uint8Array,
    width: number
  ) => {
    // Clear current grid
    game.clear();

    // Load pattern
    for (let i = 0; i < grid.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      game.setCell(x, y, grid[i] === 1);
    }

    renderer.updateGrid(game.getState().grid);
    renderer.render();
    updateStats(game);
  };

  // Place a pattern at specific grid coordinates
  const placePattern = (
    centerX: number,
    centerY: number,
    pattern: { width: number; height: number; cells: number[][] }
  ) => {
    if (!game || !renderer || isRunning) return;

    // Calculate top-left corner
    const startX = centerX - Math.floor(pattern.width / 2);
    const startY = centerY - Math.floor(pattern.height / 2);

    let cellsModified = false;

    // Place the pattern
    for (let y = 0; y < pattern.height; y++) {
      for (let x = 0; x < pattern.width; x++) {
        if (pattern.cells[y][x] === 1) {
          const targetX = startX + x;
          const targetY = startY + y;

          if (targetX >= 0 && targetX < gridSize && targetY >= 0 && targetY < gridSize) {
            game.setCell(targetX, targetY, true);
            cellsModified = true;
          }
        }
      }
    }

    if (cellsModified) {
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };

  // Generate different types of noise
  const generateNoise = (type: 'uniform' | 'clustered' | 'sparse' | 'center' | 'edges') => {
    if (!game || !renderer || isRunning) return;

    game.clear();
    const state = game.getState();
    const { width, height } = state;
    const centerX = width / 2;
    const centerY = height / 2;

    switch (type) {
      case 'uniform': {
        // Uniform random distribution (30% density)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (Math.random() < 0.3) {
              game.setCell(x, y, true);
            }
          }
        }
        break;
      }

      case 'clustered': {
        // Clustered noise - creates clusters of cells
        const clusters = Math.floor((width * height) / 100);
        for (let i = 0; i < clusters; i++) {
          const centerX = Math.floor(Math.random() * width);
          const centerY = Math.floor(Math.random() * height);
          const clusterSize = 3 + Math.floor(Math.random() * 4);

          for (let dy = -clusterSize; dy <= clusterSize; dy++) {
            for (let dx = -clusterSize; dx <= clusterSize; dx++) {
              if (Math.random() < 0.7) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x >= 0 && x < width && y >= 0 && y < height) {
                  game.setCell(x, y, true);
                }
              }
            }
          }
        }
        break;
      }

      case 'sparse': {
        // Sparse noise - very low density (10%)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (Math.random() < 0.1) {
              game.setCell(x, y, true);
            }
          }
        }
        break;
      }

      case 'center': {
        // Center-dense noise - higher density towards center
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Calculate distance from center (normalized 0-1)
            const dx = (x - centerX) / centerX;
            const dy = (y - centerY) / centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Higher probability near center (inverse of distance)
            const probability = Math.max(0, 0.5 * (1 - distance));
            if (Math.random() < probability) {
              game.setCell(x, y, true);
            }
          }
        }
        break;
      }

      case 'edges': {
        // Edge-dense noise - higher density towards edges
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Calculate distance from center (normalized 0-1)
            const dx = (x - centerX) / centerX;
            const dy = (y - centerY) / centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Higher probability near edges (proportional to distance)
            const probability = 0.4 * distance;
            if (Math.random() < probability) {
              game.setCell(x, y, true);
            }
          }
        }
        break;
      }
    }

    renderer.updateGrid(game.getState().grid);
    renderer.render();
    updateStats(game);
  };

  // Built-in Game of Life patterns
  const builtInPatterns = [
    {
      name: 'Glider',
      width: 3,
      height: 3,
      cells: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1],
      ],
    },
    {
      name: 'Blinker',
      width: 3,
      height: 1,
      cells: [[1, 1, 1]],
    },
    {
      name: 'Toad',
      width: 4,
      height: 2,
      cells: [
        [0, 1, 1, 1],
        [1, 1, 1, 0],
      ],
    },
    {
      name: 'Beacon',
      width: 4,
      height: 4,
      cells: [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1],
      ],
    },
    {
      name: 'Pulsar',
      width: 13,
      height: 13,
      cells: [
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      ],
    },
  ];

  if (error) {
    return (
      <div className="container">
        <div className="experiment-detail">
          <div className="experiment-detail-header">
            <h1>Conway&apos;s Game of Life</h1>
            <p className="hero-subtitle">WebGPU Experiment - Naive Implementation</p>
          </div>

          <div className="experiment-content">
            <div className="status-panel error">
              <h4>WebGPU Error</h4>
              <p>{error}</p>
            </div>

            <div className="mt-3">
              <h3>WebGPU Requirements:</h3>
              <ul>
                <li>Chrome 113+ (Windows, macOS, Linux)</li>
                <li>Edge 113+ (Windows, macOS)</li>
                <li>Firefox 121+ (Windows, macOS, Linux)</li>
                <li>Safari 17.4+ (macOS, iOS)</li>
                <li>Secure context (HTTPS or localhost)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-of-life-fullscreen">
      {/* Header with title and sub-nav */}
      <div className="game-of-life-header">
        <div className="header-title">
          <h1>Conway&apos;s Game of Life</h1>
        </div>

        {/* Sub-nav bar with transport controls and modal buttons */}
        <div className="sub-nav-bar">
          <div className="sub-nav-content">
            <div className="transport-controls">
              <button
                className="tool-button"
                onClick={handleStop}
                disabled={!isInitialized || !isRunning}
                title="Stop simulation"
              >
                ▢
              </button>
              <button
                className="tool-button"
                onClick={handleStep}
                disabled={!isInitialized || isRunning}
                title="Step one generation"
              >
                ▷|
              </button>
              <button
                className="tool-button"
                onClick={handleRun}
                disabled={!isInitialized || isRunning}
                title="Run simulation"
              >
                ▷
              </button>
              <button
                className="tool-button"
                onClick={handleReset}
                disabled={!isInitialized}
                title="Reset to initial state"
              >
                ↻
              </button>
            </div>

            <div className="sub-nav-actions">
              <button
                className={`button secondary ${showAnalyticsModal ? 'active' : ''}`}
                onClick={() => setShowAnalyticsModal(!showAnalyticsModal)}
                disabled={!isInitialized}
              >
                {showAnalyticsModal ? 'Hide Analytics' : 'Analytics'}
              </button>
              <button
                className={`button secondary ${showBenchmarkModal ? 'active' : ''}`}
                onClick={() => setShowBenchmarkModal(!showBenchmarkModal)}
                disabled={!isInitialized}
              >
                {showBenchmarkModal ? 'Hide Benchmark' : 'Benchmark'}
              </button>
              <button
                className={`button secondary ${isFullscreen ? 'active' : ''}`}
                onClick={isFullscreen ? handleExitFullscreen : handleEnterFullscreen}
                disabled={!isInitialized}
                title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Enter fullscreen'}
              >
                {isFullscreen ? '⤓' : '⤢'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Canvas IS the background */}
      <canvas
        ref={canvasRef}
        className="game-of-life-canvas"
        style={{
          cursor: drawMode !== null || selectedPattern !== null ? 'crosshair' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {/* Tool strip - appears conditionally when stopped */}
      {!isRunning && (
        <div className="game-of-life-toolstrip">
          <div className="toolstrip-content">
            {/* Grid Configuration - Compact */}
            <div className="control-group compact-sliders">
              <div className="slider-group compact">
                <label htmlFor="gridSize">
                  Grid: {gridSize >= 1024 ? 'max' : `${gridSize}×${gridSize}`}
                </label>
                <input
                  type="range"
                  id="gridSize"
                  min="16"
                  max="1024"
                  step="16"
                  value={gridSize >= 1024 ? 1024 : gridSize}
                  onChange={(e) => handleGridSizeChange(parseInt(e.target.value))}
                  disabled={!isInitialized}
                />
                {gridSize >= 1024 && (
                  <div className="slider-hint">
                    Canvas size: {calculateGridSizeFromCanvas()}×{calculateGridSizeFromCanvas()}
                  </div>
                )}
              </div>
              <div className="slider-group compact">
                <label htmlFor="cellSize">Cell: {cellSize}px</label>
                <input
                  type="range"
                  id="cellSize"
                  min="1"
                  max="16"
                  step="1"
                  value={cellSize}
                  onChange={(e) => handleCellSizeChange(parseInt(e.target.value))}
                  disabled={!isInitialized}
                />
              </div>
              <div className="slider-group compact">
                <label htmlFor="speed">Speed: {speed === 61 ? 'unlimited' : `${speed}fps`}</label>
                <input
                  type="range"
                  id="speed"
                  min="1"
                  max="61"
                  step="1"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  disabled={!isInitialized}
                />
                {speed === 61 && <div className="slider-hint">Process every frame</div>}
              </div>
            </div>

            {/* Freehand Tools - 4x2 grid */}
            <div className="control-group tool-section">
              <div className="tool-section-label">Freehand Tools</div>
              <div className="tool-grid">
                {/* Row 1: Drawing tools */}
                <button
                  className={`tool-button ${drawMode === 'erase' ? 'active' : ''}`}
                  onClick={() => setDrawMode(drawMode === 'erase' ? null : 'erase')}
                  disabled={!isInitialized || isRunning}
                  title="Erase (click and drag to remove cells)"
                >
                  🗑️
                </button>
                <button
                  className="tool-button"
                  onClick={() => generateNoise('uniform')}
                  disabled={!isInitialized || isRunning}
                  title="Uniform noise (30% density)"
                >
                  🎲
                </button>
                <button
                  className="tool-button"
                  onClick={() => generateNoise('sparse')}
                  disabled={!isInitialized || isRunning}
                  title="Sparse noise (10% density)"
                >
                  ✨
                </button>
                <button
                  className="tool-button"
                  onClick={() => generateNoise('center')}
                  disabled={!isInitialized || isRunning}
                  title="Center-dense noise (higher density in middle)"
                >
                  🎯
                </button>

                {/* Row 2: More noise types and brush sizes */}
                <button
                  className="tool-button"
                  onClick={() => generateNoise('edges')}
                  disabled={!isInitialized || isRunning}
                  title="Edge-dense noise (higher density at edges)"
                >
                  🏁
                </button>
                <button
                  className="tool-button"
                  onClick={() => generateNoise('clustered')}
                  disabled={!isInitialized || isRunning}
                  title="Clustered noise (groups of cells)"
                >
                  🌌
                </button>
                <button
                  className={`tool-button ${drawMode === 'draw' ? 'active' : ''}`}
                  onClick={() => setDrawMode(drawMode === 'draw' ? null : 'draw')}
                  disabled={!isInitialized || isRunning}
                  title="Draw (click and drag to add cells)"
                >
                  ✏️
                </button>
                <button
                  className={`tool-button ${brushSize === 'single' ? 'active' : ''}`}
                  onClick={() => setBrushSize('single')}
                  disabled={!isInitialized || isRunning || drawMode === null}
                  title="Single cell brush"
                >
                  ●
                </button>

                {/* Row 3: Brush sizes */}
                <button
                  className={`tool-button ${brushSize === '3x3' ? 'active' : ''}`}
                  onClick={() => setBrushSize('3x3')}
                  disabled={!isInitialized || isRunning || drawMode === null}
                  title="3×3 brush"
                >
                  ◼
                </button>
                <button
                  className={`tool-button ${brushSize === '5x5' ? 'active' : ''}`}
                  onClick={() => setBrushSize('5x5')}
                  disabled={!isInitialized || isRunning || drawMode === null}
                  title="5×5 brush"
                >
                  ◼◼
                </button>
                <div className="tool-spacer"></div>
                <div className="tool-spacer"></div>
              </div>
            </div>

            {/* Pattern Brushes - 4x2 grid */}
            <div className="control-group tool-section">
              <div className="tool-section-label">Pattern Brushes</div>
              <div className="tool-grid">
                {/* Row 1: Glider, Blinker, Toad, Pulsar */}
                <button
                  className={`tool-button ${selectedPattern?.name === 'Glider' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedPattern?.name === 'Glider') {
                      setSelectedPattern(null);
                    } else {
                      setSelectedPattern(builtInPatterns.find((p) => p.name === 'Glider') || null);
                      setDrawMode(null);
                    }
                  }}
                  disabled={!isInitialized || isRunning}
                  title="Glider (3×3)"
                >
                  🛸
                </button>
                <button
                  className={`tool-button ${selectedPattern?.name === 'Blinker' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedPattern?.name === 'Blinker') {
                      setSelectedPattern(null);
                    } else {
                      setSelectedPattern(builtInPatterns.find((p) => p.name === 'Blinker') || null);
                      setDrawMode(null);
                    }
                  }}
                  disabled={!isInitialized || isRunning}
                  title="Blinker (3×1)"
                >
                  💡
                </button>
                <button
                  className={`tool-button ${selectedPattern?.name === 'Toad' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedPattern?.name === 'Toad') {
                      setSelectedPattern(null);
                    } else {
                      setSelectedPattern(builtInPatterns.find((p) => p.name === 'Toad') || null);
                      setDrawMode(null);
                    }
                  }}
                  disabled={!isInitialized || isRunning}
                  title="Toad (4×2)"
                >
                  🐸
                </button>
                <button
                  className={`tool-button ${selectedPattern?.name === 'Pulsar' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedPattern?.name === 'Pulsar') {
                      setSelectedPattern(null);
                    } else {
                      setSelectedPattern(builtInPatterns.find((p) => p.name === 'Pulsar') || null);
                      setDrawMode(null);
                    }
                  }}
                  disabled={!isInitialized || isRunning}
                  title="Pulsar (13×13)"
                >
                  💓
                </button>

                {/* Row 2: Beacon and Clear */}
                <button
                  className={`tool-button ${selectedPattern?.name === 'Beacon' ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedPattern?.name === 'Beacon') {
                      setSelectedPattern(null);
                    } else {
                      setSelectedPattern(builtInPatterns.find((p) => p.name === 'Beacon') || null);
                      setDrawMode(null);
                    }
                  }}
                  disabled={!isInitialized || isRunning}
                  title="Beacon (4×4)"
                >
                  🏮
                </button>
                <button
                  className="tool-button"
                  onClick={() => {
                    if (game) {
                      game.clear();
                      if (renderer) {
                        renderer.updateGrid(game.getState().grid);
                        renderer.render();
                        updateStats(game);
                      }
                    }
                  }}
                  disabled={!isInitialized || isRunning}
                  title="Clear all cells"
                >
                  🧹
                </button>
                <div className="tool-spacer"></div>
                <div className="tool-spacer"></div>
              </div>
            </div>

            {/* File Save/Load - Simplified */}
            <div className="control-group compact-patterns">
              <div className="button-group compact">
                <button
                  className="button small"
                  onClick={() => handleSaveToFile(true)}
                  disabled={!isInitialized || isRunning || !startingPositionGrid}
                  title="Save initial position to PNG file"
                >
                  💾 Initial
                </button>
                <button
                  className="button small"
                  onClick={() => handleSaveToFile(false)}
                  disabled={!isInitialized || isRunning}
                  title="Save current state to PNG file"
                >
                  💾 Current
                </button>
                <button
                  className="button small"
                  onClick={handleLoadFromFile}
                  disabled={!isInitialized || isRunning}
                  title="Load pattern from PNG file"
                >
                  📂 Load
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Analytics Modal - Combines stats and metrics */}
      {showAnalyticsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Simulation Analytics</h3>
              <button
                className="modal-close"
                onClick={() => setShowAnalyticsModal(false)}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value">{generation}</div>
                  <div className="stat-label">Generation</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{aliveCount}</div>
                  <div className="stat-label">Alive Cells</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{(density * 100).toFixed(1)}%</div>
                  <div className="stat-label">Density</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{simulationFps}</div>
                  <div className="stat-label">Simulation FPS</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{metrics.fps}</div>
                  <div className="stat-label">Rendering FPS</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{metrics.frameTime.toFixed(1)}</div>
                  <div className="stat-label">Frame Time (ms)</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">
                    {metrics.memoryUsage !== null ? `${metrics.memoryUsage.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="stat-label">Memory</div>
                </div>
              </div>

              <div className="mt-4">
                <h4>Simulation Info</h4>
                <div className="simulation-info">
                  <div className="info-row">
                    <span className="info-label">Grid Size:</span>
                    <span className="info-value">
                      {gridSize}×{gridSize}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Cell Size:</span>
                    <span className="info-value">{cellSize}px</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Speed:</span>
                    <span className="info-value">{speed} FPS</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span
                      className={`info-value ${isRunning ? 'status-running' : 'status-paused'}`}
                    >
                      {isRunning ? 'Running' : 'Paused'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="button secondary" onClick={() => setShowAnalyticsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Benchmark Modal */}
      {showBenchmarkModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Benchmark Mode</h3>
              <button
                className="modal-close"
                onClick={() => setShowBenchmarkModal(false)}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <BenchmarkMode
                currentSettings={{
                  gridSize,
                  cellSize,
                  speed,
                  theme: 'simple',
                }}
                onBenchmarkComplete={(results) => {
                  console.warn('Benchmark completed:', results);
                }}
              />
            </div>
            <div className="modal-footer">
              <button className="button secondary" onClick={() => setShowBenchmarkModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Permanent FPS counter in bottom-right corner */}
      <div className="fps-counter">{simulationFps} FPS</div>
    </div>
  );
};

export default GameOfLifePage;
