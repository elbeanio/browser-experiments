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
  const [selectedPattern, setSelectedPattern] = useState<{
    name: string;
    width: number;
    height: number;
    cells: number[][];
  } | null>(null);

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

  // Update highlighting based on tool selection and simulation state
  useEffect(() => {
    if (renderer) {
      // Enable highlighting if a tool or pattern is selected AND simulation isn't running
      const shouldHighlight = (drawMode !== null || selectedPattern !== null) && !isRunning;
      renderer.setHighlightEditableTile(shouldHighlight);
      renderer.render();
    }
  }, [drawMode, selectedPattern, isRunning, renderer]);

  // Handle ESC key to exit drawing mode or pattern placement
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (drawMode !== null) {
          setDrawMode(null);
        }
        if (selectedPattern !== null) {
          setSelectedPattern(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawMode, selectedPattern]);

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

  // Save current pattern
  const handleSavePattern = () => {
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
  };

  // Load a saved pattern
  const handleLoadPattern = (pattern: {
    name: string;
    grid: Uint8Array;
    width: number;
    height: number;
  }) => {
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
      case 'uniform':
        // Uniform random distribution (30% density)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (Math.random() < 0.3) {
              game.setCell(x, y, true);
            }
          }
        }
        break;

      case 'clustered':
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

      case 'sparse':
        // Sparse noise - very low density (10%)
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (Math.random() < 0.1) {
              game.setCell(x, y, true);
            }
          }
        }
        break;

      case 'center':
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

      case 'edges':
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

    renderer.updateGrid(game.getState().grid);
    renderer.render();
    updateStats(game);
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
        </div>

        <div className="game-of-life-container">
          <div className="game-of-life-canvas-container">
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
          </div>

          <div className="game-of-life-controls compact">
            {/* Transport Controls */}
            <div className="control-group">
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
            </div>

            {/* Grid Configuration - Compact */}
            <div className="control-group compact-sliders">
              <div className="slider-group compact">
                <label htmlFor="gridSize">
                  Grid: {gridSize}×{gridSize}
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
              <div className="slider-group compact">
                <label htmlFor="cellSize">Cell: {cellSize}px</label>
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
              <div className="slider-group compact">
                <label htmlFor="speed">Speed: {speed}fps</label>
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
            </div>

            {/* Freehand Drawing Tools - 4x2 grid */}
            <div className="control-group tool-section">
              <div className="tool-grid">
                <button
                  className={`tool-button ${drawMode === 'draw' ? 'active' : ''}`}
                  onClick={() => setDrawMode(drawMode === 'draw' ? null : 'draw')}
                  disabled={!isInitialized || isRunning}
                  title="Draw (click and drag to add cells)"
                >
                  ✏️
                </button>
                <button
                  className={`tool-button ${drawMode === 'erase' ? 'active' : ''}`}
                  onClick={() => setDrawMode(drawMode === 'erase' ? null : 'erase')}
                  disabled={!isInitialized || isRunning}
                  title="Erase (click and drag to remove cells)"
                >
                  🗑️
                </button>
                <button
                  className={`tool-button ${brushSize === 'single' ? 'active' : ''}`}
                  onClick={() => setBrushSize('single')}
                  disabled={!isInitialized || isRunning || drawMode === null}
                  title="Single cell brush"
                >
                  ●
                </button>
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
                <div className="tool-spacer"></div>
              </div>
              <div className="tool-section-label">Freehand Tools</div>
            </div>

            {/* Pattern Brushes - 4x2 grid */}
            <div className="control-group tool-section">
              <div className="tool-grid">
                {/* Row 1 - Built-in patterns */}
                {builtInPatterns.slice(0, 4).map((pattern, index) => (
                  <button
                    key={index}
                    className={`tool-button ${selectedPattern?.name === pattern.name ? 'active' : ''}`}
                    onClick={() => {
                      if (selectedPattern?.name === pattern.name) {
                        setSelectedPattern(null);
                      } else {
                        setSelectedPattern(pattern);
                        setDrawMode(null);
                      }
                    }}
                    disabled={!isInitialized || isRunning}
                    title={`${pattern.name} (${pattern.width}×${pattern.height})`}
                  >
                    {pattern.name === 'Glider' && '🛸'}
                    {pattern.name === 'Blinker' && '💡'}
                    {pattern.name === 'Toad' && '🐸'}
                    {pattern.name === 'Beacon' && '🏮'}
                  </button>
                ))}

                {/* Row 2 - More patterns and actions */}
                {builtInPatterns.slice(4, 5).map((pattern, index) => (
                  <button
                    key={index + 4}
                    className={`tool-button ${selectedPattern?.name === pattern.name ? 'active' : ''}`}
                    onClick={() => {
                      if (selectedPattern?.name === pattern.name) {
                        setSelectedPattern(null);
                      } else {
                        setSelectedPattern(pattern);
                        setDrawMode(null);
                      }
                    }}
                    disabled={!isInitialized || isRunning}
                    title={`${pattern.name} (${pattern.width}×${pattern.height})`}
                  >
                    {pattern.name === 'Pulsar' && '💓'}
                  </button>
                ))}
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
                  onClick={() => generateNoise('clustered')}
                  disabled={!isInitialized || isRunning}
                  title="Clustered noise (groups of cells)"
                >
                  🌌
                </button>

                {/* Row 3 - More noise types */}
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
                <button
                  className="tool-button"
                  onClick={() => generateNoise('edges')}
                  disabled={!isInitialized || isRunning}
                  title="Edge-dense noise (higher density at edges)"
                >
                  🏁
                </button>
                <div className="tool-spacer"></div>
              </div>
              <div className="tool-section-label">Pattern Brushes</div>
            </div>

            {/* Pattern Save/Load - Compact */}
            <div className="control-group compact-patterns">
              <div className="input-group compact">
                <input
                  type="text"
                  placeholder="Save pattern..."
                  value={patternName}
                  onChange={(e) => setPatternName(e.target.value)}
                  disabled={!isInitialized || isRunning}
                  className="pattern-input compact"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && patternName.trim()) {
                      handleSavePattern();
                    }
                  }}
                />
                <button
                  className="button small"
                  onClick={handleSavePattern}
                  disabled={!isInitialized || isRunning || !patternName.trim()}
                  title="Save current pattern"
                >
                  💾
                </button>
              </div>

              {savedPatterns.length > 0 && (
                <div className="dropdown-group compact">
                  <select
                    className="pattern-dropdown compact"
                    disabled={!isInitialized || isRunning}
                    onChange={(e) => {
                      const index = parseInt(e.target.value);
                      if (index >= 0 && savedPatterns[index]) {
                        handleLoadPattern(savedPatterns[index]);
                      }
                    }}
                    value=""
                  >
                    <option value="">Load pattern...</option>
                    {savedPatterns.map((pattern, index) => (
                      <option key={index} value={index}>
                        {pattern.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
