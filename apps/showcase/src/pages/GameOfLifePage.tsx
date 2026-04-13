import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GameOfLife } from '../experiments/game-of-life/simulation/game-of-life';
import { GameOfLifeRenderer } from '../experiments/game-of-life/rendering/webgpu-renderer';
import {
  usePerformanceMonitor,
  PerformanceVisualization,
  BenchmarkMode,
} from '../experiments/game-of-life/performance';

const GameOfLifePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<GameOfLife | null>(null);
  const [renderer, setRenderer] = useState<GameOfLifeRenderer | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [gridSize, setGridSize] = useState(64);
  const [cellSize, setCellSize] = useState(4);
  const [speed, setSpeed] = useState(10);
  // Simple black/white theme - remove color theme selection
  const theme = 'simple' as const;

  // Stats
  const [generation, setGeneration] = useState(0);
  const [aliveCount, setAliveCount] = useState(0);
  const [density, setDensity] = useState(0);
  // Performance monitoring
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showBenchmarkMode, setShowBenchmarkMode] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<'single' | '3x3' | '5x5'>('single');
  const [drawMode, setDrawMode] = useState<'draw' | 'erase' | null>(null); // null = no tool selected

  // Pattern management
  const [savedPatterns, setSavedPatterns] = useState<
    Array<{ name: string; grid: Uint8Array; width: number; height: number }>
  >([]);
  const [patternName, setPatternName] = useState('');
  const { metrics, reset: resetPerformance } = usePerformanceMonitor({
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
          initialDensity: 0.3,
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
    frameIntervalRef.current = 1000 / speed;
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

    // FPS calculation is now handled by the performance monitor

    // Update simulation at target FPS
    if (currentTime - lastStepTimeRef.current >= frameIntervalRef.current) {
      game.step();
      renderer.updateGrid(game.getState().grid);
      updateStats(game);
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

  // Disable tile dimming when simulation is running
  // Update highlighting based on tool selection and simulation state
  useEffect(() => {
    if (renderer) {
      // Enable highlighting if a tool is selected AND simulation isn't running
      const shouldHighlight = drawMode !== null && !isRunning;
      renderer.setHighlightEditableTile(shouldHighlight);
      renderer.render();
    }
  }, [drawMode, isRunning, renderer]);

  // Handle ESC key to exit drawing mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && drawMode !== null) {
        setDrawMode(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawMode]);

  // Control handlers
  const handleRun = () => setIsRunning(true);
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
      game.randomize(0.3); // Reset to initial randomized state
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };

  const handleGridSizeChange = (newSize: number) => {
    setIsRunning(false); // Stop simulation when changing grid size
    setGridSize(newSize);
    // Effect will recreate simulation and renderer with new size
  };
  const handleCellSizeChange = (newSize: number) => {
    setCellSize(newSize);
    if (renderer) {
      renderer.setCellSize(newSize);
      renderer.render();
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
    // Only allow drawing if a tool is selected and simulation isn't running
    if (!game || !renderer || isRunning || drawMode === null) return;

    setIsDrawing(true);

    const coords = getGridCoordinates(event.clientX, event.clientY);
    if (coords) {
      const [gridX, gridY] = coords;
      drawCells(gridX, gridY);
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

  // Load saved patterns from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gameOfLifePatterns');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert arrays back to Uint8Array
        const patterns = parsed.map(
          (p: { name: string; grid: number[]; width: number; height: number }) => ({
            ...p,
            grid: new Uint8Array(p.grid),
          })
        );
        setSavedPatterns(patterns);
      }
    } catch (err) {
      console.warn('Failed to load saved patterns:', err);
    }
  }, []);

  // Save patterns to localStorage when they change
  useEffect(() => {
    if (savedPatterns.length > 0) {
      try {
        // Convert Uint8Array to regular array for JSON serialization
        const serializable = savedPatterns.map((p) => ({
          ...p,
          grid: Array.from(p.grid),
        }));
        localStorage.setItem('gameOfLifePatterns', JSON.stringify(serializable));
      } catch (err) {
        console.warn('Failed to save patterns:', err);
      }
    }
  }, [savedPatterns]);

  // Helper function to flip grid horizontally
  const flipHorizontal = (grid: Uint8Array, width: number, height: number): Uint8Array => {
    const flipped = new Uint8Array(grid.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = y * width + x;
        const dstX = width - 1 - x;
        const dstIndex = y * width + dstX;
        flipped[dstIndex] = grid[srcIndex];
      }
    }
    return flipped;
  };

  // Helper function to flip grid vertically
  const flipVertical = (grid: Uint8Array, width: number, height: number): Uint8Array => {
    const flipped = new Uint8Array(grid.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIndex = y * width + x;
        const dstY = height - 1 - y;
        const dstIndex = dstY * width + x;
        flipped[dstIndex] = grid[srcIndex];
      }
    }
    return flipped;
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

          <div className="experiment-actions">
            <Link to="/" className="experiment-link">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="experiment-detail">
        <div className="experiment-detail-header">
          <h1>Conway&apos;s Game of Life</h1>
          <p className="hero-subtitle">WebGPU Experiment - Naive Implementation</p>

          <div className="experiment-meta">
            <span className="text-muted">
              Status: {isInitialized ? 'Ready' : 'Initializing...'}
            </span>
            <span className="text-muted">Complexity: Beginner</span>
            <span className="text-muted">WebGPU Required</span>
          </div>
        </div>

        <div className="game-of-life-container">
          <div className="game-of-life-canvas-container">
            <canvas
              ref={canvasRef}
              className="game-of-life-canvas"
              style={{ cursor: drawMode !== null ? 'crosshair' : 'default' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
            />
          </div>

          <div className="game-of-life-controls">
            <div className="control-group">
              <h3>Simulation Controls</h3>
              <div className="button-group transport-controls">
                <button
                  className="button transport-stop"
                  onClick={handleStop}
                  disabled={!isInitialized || !isRunning}
                  title="Stop simulation"
                >
                  ▢
                </button>
                <button
                  className="button transport-step"
                  onClick={handleStep}
                  disabled={!isInitialized || isRunning}
                  title="Step one generation"
                >
                  ▷|
                </button>
                <button
                  className="button transport-run"
                  onClick={handleRun}
                  disabled={!isInitialized || isRunning}
                  title="Run simulation"
                >
                  ▷
                </button>
                <button
                  className="button transport-reset"
                  onClick={handleReset}
                  disabled={!isInitialized}
                  title="Reset to initial state"
                >
                  ↻
                </button>
              </div>
            </div>

            <div className="control-group">
              <h3>Grid Configuration</h3>
              <div className="slider-group">
                <label htmlFor="gridSize">
                  Grid Size: {gridSize}x{gridSize}
                </label>
                <input
                  type="range"
                  id="gridSize"
                  min="16"
                  max="256"
                  step="16"
                  value={gridSize}
                  onChange={(e) => handleGridSizeChange(parseInt(e.target.value))}
                  disabled={!isInitialized}
                />
              </div>
              <div className="slider-group">
                <label htmlFor="cellSize">Cell Size: {cellSize}px</label>
                <input
                  type="range"
                  id="cellSize"
                  min="2"
                  max="16"
                  step="1"
                  value={cellSize}
                  onChange={(e) => handleCellSizeChange(parseInt(e.target.value))}
                  disabled={!isInitialized}
                />
              </div>
              <div className="slider-group">
                <label htmlFor="speed">Speed: {speed} FPS</label>
                <input
                  type="range"
                  id="speed"
                  min="1"
                  max="60"
                  step="1"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  disabled={!isInitialized}
                />
              </div>

              <div className="control-group">
                <h3>Drawing Tools</h3>
                <div className="button-group">
                  <button
                    className={`button secondary ${drawMode === 'draw' ? 'active' : ''}`}
                    onClick={() => setDrawMode(drawMode === 'draw' ? null : 'draw')}
                    disabled={!isInitialized || isRunning}
                    title="Draw mode (click and drag to add cells). Press ESC to exit."
                  >
                    ✏️ {drawMode === 'draw' ? 'Drawing' : 'Draw'}
                  </button>
                  <button
                    className={`button secondary ${drawMode === 'erase' ? 'active' : ''}`}
                    onClick={() => setDrawMode(drawMode === 'erase' ? null : 'erase')}
                    disabled={!isInitialized || isRunning}
                    title="Erase mode (click and drag to remove cells). Press ESC to exit."
                  >
                    🗑️ {drawMode === 'erase' ? 'Erasing' : 'Erase'}
                  </button>
                </div>

                <div className="button-group">
                  <button
                    className={`button secondary ${brushSize === 'single' ? 'active' : ''}`}
                    onClick={() => setBrushSize('single')}
                    disabled={!isInitialized || isRunning || drawMode === null}
                    title="Single cell brush"
                  >
                    ● Single
                  </button>
                  <button
                    className={`button secondary ${brushSize === '3x3' ? 'active' : ''}`}
                    onClick={() => setBrushSize('3x3')}
                    disabled={!isInitialized || isRunning || drawMode === null}
                    title="3x3 brush"
                  >
                    ◼ 3×3
                  </button>
                  <button
                    className={`button secondary ${brushSize === '5x5' ? 'active' : ''}`}
                    onClick={() => setBrushSize('5x5')}
                    disabled={!isInitialized || isRunning || drawMode === null}
                    title="5x5 brush"
                  >
                    ◼ 5×5
                  </button>
                </div>

                <div className="slider-group">
                  <label htmlFor="density">Random Density: {Math.round(density * 100)}%</label>
                  <input
                    type="range"
                    id="density"
                    min="0"
                    max="100"
                    step="5"
                    value={density * 100}
                    onChange={(e) => setDensity(parseInt(e.target.value) / 100)}
                    disabled={!isInitialized || isRunning}
                  />
                </div>

                <div className="button-group">
                  <button
                    className="button secondary"
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
                    🗑️ Clear
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (game) {
                        game.randomize(density);
                        if (renderer) {
                          renderer.updateGrid(game.getState().grid);
                          renderer.render();
                          updateStats(game);
                        }
                      }
                    }}
                    disabled={!isInitialized || isRunning}
                    title={`Randomize grid (${Math.round(density * 100)}% density)`}
                  >
                    🎲 Random
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (game && renderer) {
                        const state = game.getState();
                        const { width, height } = state;
                        const grid = state.grid;

                        // Invert each cell
                        for (let y = 0; y < height; y++) {
                          for (let x = 0; x < width; x++) {
                            const index = y * width + x;
                            game.setCell(x, y, grid[index] === 0);
                          }
                        }

                        renderer.updateGrid(game.getState().grid);
                        renderer.render();
                        updateStats(game);
                      }
                    }}
                    disabled={!isInitialized || isRunning}
                    title="Invert pattern (dead ↔ alive)"
                  >
                    🔄 Invert
                  </button>
                </div>

                <div className="button-group">
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (game && renderer) {
                        const state = game.getState();
                        const { width, height } = state;

                        // Only rotate square grids
                        if (width !== height) {
                          alert(
                            'Rotation only works for square grids (grid size must be equal in both dimensions)'
                          );
                          return;
                        }

                        const grid = state.grid;
                        const size = width;

                        // Rotate 90 degrees clockwise for square grid
                        const rotated = new Uint8Array(grid.length);
                        for (let y = 0; y < size; y++) {
                          for (let x = 0; x < size; x++) {
                            const srcIndex = y * size + x;
                            const dstX = size - 1 - y;
                            const dstY = x;
                            const dstIndex = dstY * size + dstX;
                            rotated[dstIndex] = grid[srcIndex];
                          }
                        }

                        // Update game state
                        for (let y = 0; y < size; y++) {
                          for (let x = 0; x < size; x++) {
                            const index = y * size + x;
                            game.setCell(x, y, rotated[index] === 1);
                          }
                        }

                        renderer.updateGrid(game.getState().grid);
                        renderer.render();
                        updateStats(game);
                      }
                    }}
                    disabled={!isInitialized || isRunning}
                    title="Rotate 90° clockwise (square grids only)"
                  >
                    ↻ Rotate
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (game && renderer) {
                        const state = game.getState();
                        const { width, height } = state;
                        const grid = state.grid;

                        // Flip horizontally
                        const flipped = flipHorizontal(grid, width, height);

                        // Update game state
                        for (let y = 0; y < height; y++) {
                          for (let x = 0; x < width; x++) {
                            const index = y * width + x;
                            game.setCell(x, y, flipped[index] === 1);
                          }
                        }

                        renderer.updateGrid(game.getState().grid);
                        renderer.render();
                        updateStats(game);
                      }
                    }}
                    disabled={!isInitialized || isRunning}
                    title="Flip horizontally"
                  >
                    ↔ Flip H
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (game && renderer) {
                        const state = game.getState();
                        const { width, height } = state;
                        const grid = state.grid;

                        // Flip vertically
                        const flipped = flipVertical(grid, width, height);

                        // Update game state
                        for (let y = 0; y < height; y++) {
                          for (let x = 0; x < width; x++) {
                            const index = y * width + x;
                            game.setCell(x, y, flipped[index] === 1);
                          }
                        }

                        renderer.updateGrid(game.getState().grid);
                        renderer.render();
                        updateStats(game);
                      }
                    }}
                    disabled={!isInitialized || isRunning}
                    title="Flip vertically"
                  >
                    ↕ Flip V
                  </button>
                </div>
              </div>

              <div className="control-group">
                <h3>Pattern Management</h3>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Pattern name"
                    value={patternName}
                    onChange={(e) => setPatternName(e.target.value)}
                    disabled={!isInitialized || isRunning}
                    className="pattern-input"
                  />
                  <button
                    className="button secondary"
                    onClick={() => {
                      if (game && patternName.trim()) {
                        const state = game.getState();
                        const newPattern = {
                          name: patternName.trim(),
                          grid: new Uint8Array(state.grid),
                          width: state.width,
                          height: state.height,
                        };
                        setSavedPatterns([...savedPatterns, newPattern]);
                        setPatternName('');
                      }
                    }}
                    disabled={!isInitialized || isRunning || !patternName.trim()}
                    title="Save current pattern"
                  >
                    💾 Save
                  </button>
                </div>

                {savedPatterns.length > 0 && (
                  <div className="saved-patterns">
                    <h4>Saved Patterns:</h4>
                    <div className="pattern-list">
                      {savedPatterns.map((pattern, index) => (
                        <div key={index} className="pattern-item">
                          <span className="pattern-name">{pattern.name}</span>
                          <div className="pattern-actions">
                            <button
                              className="button small"
                              onClick={() => {
                                if (game && renderer) {
                                  // Check if pattern matches current grid size
                                  if (pattern.width !== gridSize || pattern.height !== gridSize) {
                                    alert(
                                      `Pattern size (${pattern.width}x${pattern.height}) doesn't match current grid (${gridSize}x${gridSize}). Please resize grid first.`
                                    );
                                    return;
                                  }

                                  // Load pattern
                                  for (let i = 0; i < pattern.grid.length; i++) {
                                    const x = i % gridSize;
                                    const y = Math.floor(i / gridSize);
                                    game.setCell(x, y, pattern.grid[i] === 1);
                                  }

                                  renderer.updateGrid(game.getState().grid);
                                  renderer.render();
                                  updateStats(game);
                                }
                              }}
                              disabled={!isInitialized || isRunning}
                              title="Load pattern"
                            >
                              📂 Load
                            </button>
                            <button
                              className="button small danger"
                              onClick={() => {
                                const newPatterns = [...savedPatterns];
                                newPatterns.splice(index, 1);
                                setSavedPatterns(newPatterns);
                              }}
                              title="Delete pattern"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="builtin-patterns">
                  <h4>Built-in Patterns:</h4>
                  <div className="button-group">
                    {builtInPatterns.map((pattern, index) => (
                      <button
                        key={index}
                        className="button secondary"
                        onClick={() => {
                          if (game && renderer) {
                            // Clear the grid first
                            game.clear();

                            // Calculate position to center the pattern
                            const centerX = Math.floor((gridSize - pattern.width) / 2);
                            const centerY = Math.floor((gridSize - pattern.height) / 2);

                            // Place the pattern
                            for (let y = 0; y < pattern.height; y++) {
                              for (let x = 0; x < pattern.width; x++) {
                                if (pattern.cells[y][x] === 1) {
                                  const targetX = centerX + x;
                                  const targetY = centerY + y;
                                  if (
                                    targetX >= 0 &&
                                    targetX < gridSize &&
                                    targetY >= 0 &&
                                    targetY < gridSize
                                  ) {
                                    game.setCell(targetX, targetY, true);
                                  }
                                }
                              }
                            }

                            renderer.updateGrid(game.getState().grid);
                            renderer.render();
                            updateStats(game);
                          }
                        }}
                        disabled={!isInitialized || isRunning}
                        title={`Place ${pattern.name} pattern (${pattern.width}x${pattern.height})`}
                      >
                        {pattern.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="control-group">
            <h3>Performance Monitoring</h3>
            <div className="button-group">
              <button
                className={`button secondary ${showPerformancePanel ? 'active' : ''}`}
                onClick={() => setShowPerformancePanel(!showPerformancePanel)}
                disabled={!isInitialized}
              >
                {showPerformancePanel ? 'Hide Metrics' : 'Show Metrics'}
              </button>
              <button
                className={`button secondary ${showBenchmarkMode ? 'active' : ''}`}
                onClick={() => setShowBenchmarkMode(!showBenchmarkMode)}
                disabled={!isInitialized}
              >
                {showBenchmarkMode ? 'Hide Benchmark' : 'Benchmark Mode'}
              </button>
              <button
                className="button secondary"
                onClick={resetPerformance}
                disabled={!isInitialized}
              >
                Reset Metrics
              </button>
            </div>
          </div>
        </div>

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
            <div className="stat-value">{metrics.fps}</div>
            <div className="stat-label">FPS</div>
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

        {showPerformancePanel && (
          <div className="performance-panel mt-4">
            <PerformanceVisualization
              metrics={metrics}
              title="Game of Life Performance"
              showDetails={true}
              showWarnings={true}
            />
          </div>
        )}

        {showBenchmarkMode && (
          <div className="benchmark-panel mt-4">
            <BenchmarkMode
              currentSettings={{
                gridSize,
                cellSize,
                speed,
                theme,
              }}
              onBenchmarkComplete={(results) => {
                console.warn('Benchmark completed:', results);
              }}
            />
          </div>
        )}

        <div className={`status-panel ${isRunning ? 'running' : 'paused'}`}>
          <h4>Status: {isRunning ? 'Running' : 'Paused'}</h4>
          <p>
            {isRunning
              ? 'Simulation is running. Click Stop to pause.'
              : 'Simulation is stopped. Click Run to begin or Step to advance one generation.'}
          </p>
          <p className="mt-1 text-muted">Click on the grid to toggle cells (when paused).</p>
        </div>

        <div className="experiment-content mt-4">
          <section className="experiment-section">
            <h2>About This Experiment</h2>
            <p>
              This is a naive implementation of Conway&apos;s Game of Life using WebGPU for
              rendering. The simulation runs on the CPU while rendering uses WebGPU textures and
              shaders.
            </p>
            <p>
              This demonstrates basic WebGPU concepts: texture creation, shader programming, and
              real-time rendering of simulation data.
            </p>
          </section>

          <section className="experiment-section">
            <h2>WebGPU Features Used</h2>
            <ul>
              <li>Texture creation and updates for grid data</li>
              <li>Simple vertex/fragment shaders for cell rendering</li>
              <li>Uniform buffers for color configuration</li>
              <li>Nearest-neighbor sampling for crisp cell edges</li>
              <li>Canvas context configuration and rendering</li>
            </ul>
          </section>

          <section className="experiment-section">
            <h2>Optimization Roadmap</h2>
            <ul>
              <li>
                <strong>Phase 1</strong>: Move simulation to compute shaders (GPU)
              </li>
              <li>
                <strong>Phase 2</strong>: Implement double buffering with storage textures
              </li>
              <li>
                <strong>Phase 3</strong>: Optimize memory access patterns
              </li>
              <li>
                <strong>Phase 4</strong>: Add Web Workers for CPU simulation
              </li>
            </ul>
          </section>
        </div>

        <div className="experiment-actions">
          <Link to="/" className="experiment-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GameOfLifePage;
