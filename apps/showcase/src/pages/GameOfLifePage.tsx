import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GameOfLife } from '../experiments/game-of-life/simulation/game-of-life';
import { GameOfLifeRenderer } from '../experiments/game-of-life/rendering/webgpu-renderer';
import { 
  usePerformanceMonitor, 
  PerformanceVisualization, 
  BenchmarkMode 
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
  const [theme, setTheme] = useState<'green' | 'blue' | 'purple'>('green');
  
  // Stats
  const [generation, setGeneration] = useState(0);
  const [aliveCount, setAliveCount] = useState(0);
  const [density, setDensity] = useState(0);
  // Performance monitoring
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showBenchmarkMode, setShowBenchmarkMode] = useState(false);
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

  // Color themes
  const themes = {
    green: {
      alive: [0, 1, 0, 1] as [number, number, number, number],
      dead: [0.1, 0.1, 0.1, 1] as [number, number, number, number],
    },
    blue: {
      alive: [0.2, 0.5, 1, 1] as [number, number, number, number],
      dead: [0.05, 0.05, 0.1, 1] as [number, number, number, number],
    },
    purple: {
      alive: [0.8, 0.2, 1, 1] as [number, number, number, number],
      dead: [0.1, 0.05, 0.15, 1] as [number, number, number, number],
    },
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
          aliveColor: themes[theme].alive,
          deadColor: themes[theme].dead,
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
  }, []); // Only run once on mount

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

  // Control handlers
  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
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
      game.clear();
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };
  const handleRandomize = () => {
    if (game && renderer) {
      game.randomize(0.3);
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };
  const handleAddGlider = () => {
    if (game && renderer) {
      const center = Math.floor(gridSize / 2);
      game.addGlider(center, center);
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };
  const handleAddBlinker = () => {
    if (game && renderer) {
      const center = Math.floor(gridSize / 2);
      game.addBlinker(center, center);
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };
  const handleClear = () => {
    if (game && renderer) {
      game.clear();
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };
  const handleGridSizeChange = (newSize: number) => {
    setGridSize(newSize);
    // Note: Would need to recreate simulation and renderer with new size
  };
  const handleCellSizeChange = (newSize: number) => {
    setCellSize(newSize);
    if (renderer) {
      renderer.setCellSize(newSize);
      renderer.render();
    }
  };
  const handleThemeChange = (newTheme: 'green' | 'blue' | 'purple') => {
    setTheme(newTheme);
    if (renderer) {
      renderer.updateColors(themes[newTheme].alive, themes[newTheme].dead);
      renderer.render();
    }
  };

  // Handle canvas click (toggle cells)
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!game || !renderer || isRunning || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      game.toggleCell(gridX, gridY);
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };

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
            <span className="text-muted">Status: {isInitialized ? 'Ready' : 'Initializing...'}</span>
            <span className="text-muted">Complexity: Beginner</span>
            <span className="text-muted">WebGPU Required</span>
          </div>
        </div>

        <div className="game-of-life-container">
          <div className="game-of-life-canvas-container">
            <canvas
              ref={canvasRef}
              className="game-of-life-canvas"
              onClick={handleCanvasClick}
            />
          </div>
          
          <div className="game-of-life-controls">
            <div className="control-group">
              <h3>Simulation Controls</h3>
              <div className="button-group">
                <button 
                  className="button" 
                  onClick={handleStart}
                  disabled={!isInitialized || isRunning}
                >
                  Start
                </button>
                <button 
                  className="button secondary" 
                  onClick={handlePause}
                  disabled={!isInitialized || !isRunning}
                >
                  Pause
                </button>
                <button 
                  className="button secondary" 
                  onClick={handleStep}
                  disabled={!isInitialized || isRunning}
                >
                  Step
                </button>
                <button 
                  className="button" 
                  onClick={handleReset}
                  disabled={!isInitialized}
                >
                  Reset
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
                <label htmlFor="cellSize">
                  Cell Size: {cellSize}px
                </label>
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
                <label htmlFor="speed">
                  Speed: {speed} FPS
                </label>
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
            
            <div className="control-group">
              <h3>Patterns</h3>
              <div className="button-group">
                <button 
                  className="button secondary" 
                  onClick={handleAddGlider}
                  disabled={!isInitialized || isRunning}
                >
                  Add Glider
                </button>
                <button 
                  className="button secondary" 
                  onClick={handleAddBlinker}
                  disabled={!isInitialized || isRunning}
                >
                  Add Blinker
                </button>
                <button 
                  className="button secondary" 
                  onClick={handleRandomize}
                  disabled={!isInitialized || isRunning}
                >
                  Randomize
                </button>
                <button 
                  className="button danger" 
                  onClick={handleClear}
                  disabled={!isInitialized || isRunning}
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="control-group">
              <h3>Colors</h3>
              <div className="button-group">
                <button 
                  className={`button secondary ${theme === 'green' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('green')}
                  disabled={!isInitialized}
                >
                  Green
                </button>
                <button 
                  className={`button secondary ${theme === 'blue' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('blue')}
                  disabled={!isInitialized}
                >
                  Blue
                </button>
                <button 
                  className={`button secondary ${theme === 'purple' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('purple')}
                  disabled={!isInitialized}
                >
                  Purple
                </button>
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
                console.log('Benchmark completed:', results);
              }}
            />
          </div>
        )}

        <div className={`status-panel ${isRunning ? 'running' : 'paused'}`}>
          <h4>Status: {isRunning ? 'Running' : 'Paused'}</h4>
          <p>
            {isRunning 
              ? 'Simulation is running. Click Pause to stop.' 
              : 'Simulation is paused. Click Start to begin or Step to advance one generation.'}
          </p>
          <p className="mt-1 text-muted">
            Click on the grid to toggle cells (when paused).
          </p>
        </div>

        <div className="experiment-content mt-4">
          <section className="experiment-section">
            <h2>About This Experiment</h2>
            <p>
               This is a naive implementation of Conway&apos;s Game of Life using WebGPU for rendering.
              The simulation runs on the CPU while rendering uses WebGPU textures and shaders.
            </p>
            <p>
              This demonstrates basic WebGPU concepts: texture creation, shader programming,
              and real-time rendering of simulation data.
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
              <li><strong>Phase 1</strong>: Move simulation to compute shaders (GPU)</li>
              <li><strong>Phase 2</strong>: Implement double buffering with storage textures</li>
              <li><strong>Phase 3</strong>: Optimize memory access patterns</li>
              <li><strong>Phase 4</strong>: Add Web Workers for CPU simulation</li>
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