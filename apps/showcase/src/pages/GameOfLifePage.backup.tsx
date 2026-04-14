import React, { useEffect, useRef, useState } from 'react';
import { GameOfLife } from '../experiments/game-of-life/simulation/game-of-life';
import { GameOfLifeRenderer } from '../experiments/game-of-life/rendering/webgpu-renderer';
import { usePerformanceMonitor } from '../experiments/game-of-life/performance';

import {
  ExperimentLayout,
  TransportControls,
  FullscreenToggle,
  ToolStrip,
  ToolSlider,
  FileSaveLoad,
  useExperimentState,
} from '../components/experiment';

// Game of Life specific tools component
import GameOfLifeTools from '../components/experiment/game-of-life/GameOfLifeTools';

const GameOfLifePage = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<GameOfLife | null>(null);
  const [renderer, setRenderer] = useState<GameOfLifeRenderer | null>(null);
  
  // Use the experiment state hook
  const [experimentState, experimentActions] = useExperimentState({
    initialSpeed: 30,
    initialGridSize: 256,
    initialCellSize: 1,
  });

  // Destructure state and actions
  const {
    isRunning,
    isInitialized,
    error,
    speed,
    gridSize,
    cellSize,
    generation,
    aliveCount,
    density,
    simulationFps,
    showAnalyticsModal,
    showBenchmarkModal,
  } = experimentState;

  const {
    setIsRunning,
    setIsInitialized,
    setError,
    setSpeed,
    setGridSize,
    setCellSize,
    setGeneration,
    setAliveCount,
    setDensity,
    toggleAnalyticsModal,
    toggleBenchmarkModal,
    toggleFullscreen,
  } = experimentActions;

  // Game of Life specific state
  const [startingPositionGrid, setStartingPositionGrid] = useState<Uint8Array | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState<'single' | '3x3' | '5x5'>('single');
  const [drawMode, setDrawMode] = useState<'draw' | 'erase' | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<{
    name: string;
    width: number;
    height: number;
    cells: number[][];
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Performance monitoring
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
  const animationFrameRef = useRef<number>(0);

  // Built-in patterns
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

  // Initialize WebGPU
  useEffect(() => {
    const initWebGPU = async () => {
      if (!canvasRef.current) return;

      try {
        const newGame = new GameOfLife({
          width: gridSize,
          height: gridSize,
          initialDensity: 0.4,
          wrapEdges: true,
        });
        const newRenderer = new GameOfLifeRenderer({
          canvas: canvasRef.current,
          width: gridSize,
          height: gridSize,
          cellSize,
          aliveColor: [0, 1, 0, 1],
          deadColor: [0.1, 0.1, 0.1, 1],
        });

        await newRenderer.initialize();
        newRenderer.updateGrid(newGame.getState().grid);
        newRenderer.render();

        setGame(newGame);
        setRenderer(newRenderer);
        setIsInitialized(true);
        setError(null);

        // Initial random state
        newGame.randomize(0.4);
        newRenderer.updateGrid(newGame.getState().grid);
        newRenderer.render();
        updateStats(newGame);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize WebGPU');
        setIsInitialized(false);
      }
    };

    initWebGPU();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gridSize]);

  // Animation loop
  useEffect(() => {
    if (!isRunning || !game || !renderer) return;

    const animate = (timestamp: number) => {
      if (!game || !renderer) return;

      // Calculate time since last step
      const deltaTime = timestamp - lastStepTimeRef.current;
      const targetFrameTime = speed === 61 ? 0 : 1000 / speed;

      if (deltaTime >= targetFrameTime) {
        game.step();
        renderer.updateGrid(game.getState().grid);
        renderer.render();
        updateStats(game);

        lastStepTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, game, renderer, speed]);

  // Update stats helper
  const updateStats = (gameInstance: GameOfLife) => {
    const state = gameInstance.getState();
    setGeneration(state.generation);
    
    const alive = state.grid.reduce((sum, cell) => sum + (cell === 1 ? 1 : 0), 0);
    setAliveCount(alive);
    setDensity(alive / (state.width * state.height));
  };

  // Handle step
  const handleStep = () => {
    if (game && renderer && !isRunning) {
      game.step();
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (game && renderer) {
      game.randomize(0.4);
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
      setGeneration(0);
    }
  };

  // Handle grid size change
  const handleGridSizeChange = (newSize: number) => {
    if (newSize >= 1024) {
      setGridSize(1024);
    } else {
      setGridSize(newSize);
    }
  };

  // Handle cell size change
  const handleCellSizeChange = (newSize: number) => {
    setCellSize(newSize);
    if (renderer) {
      renderer.setCellSize(newSize);
      renderer.render();
    }
  };

  // Calculate grid size from canvas
  const calculateGridSizeFromCanvas = () => {
    if (!canvasRef.current) return 0;
    const canvasSize = Math.min(canvasRef.current.width, canvasRef.current.height);
    return Math.floor(canvasSize / cellSize);
  };

  // Save to file
  const handleSaveToFile = async (saveStartingPosition = false) => {
    if (!game || !renderer) return;

    try {
      const state = game.getState();
      const type = saveStartingPosition ? 'initial' : 'current';
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toISOString().split('T')[1].replace(/[:.]/g, '-').slice(0, -1);
      const filename = `gol-${type}-${dateStr}Z${timeStr}.png`;

      const gridToSave = saveStartingPosition && startingPositionGrid 
        ? startingPositionGrid 
        : new Uint8Array(state.grid);

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
        data[pixelIndex] = value;
        data[pixelIndex + 1] = value;
        data[pixelIndex + 2] = value;
        data[pixelIndex + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert to blob
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

  // Load from file
  const handleLoadFromFile = async () => {
    if (!game || !renderer) return;

    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        try {
          const reader = new FileReader();
          const imageDataUrl = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = imageDataUrl;
          });

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

          const width = img.width;
          const grid = new Uint8Array(width * img.height);
          
          for (let i = 0; i < grid.length; i++) {
            const pixelIndex = i * 4;
            const r = pixelData[pixelIndex];
            const g = pixelData[pixelIndex + 1];
            const b = pixelData[pixelIndex + 2];
            const avg = (r + g + b) / 3;
            grid[i] = avg > 128 ? 1 : 0;
          }

          if (width !== gridSize || img.height !== gridSize) {
            const resize = confirm(
              `Pattern size (${width}x${img.height}) doesn't match current grid (${gridSize}x${gridSize}).\n\n` +
              `Options:\n` +
              `• Cancel: Keep current grid size\n` +
              `• OK: Resize grid to ${width}x${img.height}`
            );
            
            if (resize) {
              setGridSize(Math.max(width, img.height));
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
    gameInstance: GameOfLife,
    rendererInstance: GameOfLifeRenderer,
    grid: Uint8Array,
    width: number
  ) => {
    gameInstance.clear();
    
    for (let i = 0; i < grid.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      gameInstance.setCell(x, y, grid[i] === 1);
    }

    rendererInstance.updateGrid(gameInstance.getState().grid);
    rendererInstance.render();
    updateStats(gameInstance);
  };

  // Handle run (save starting position)
  const handleRun = () => {
    if (game) {
      const state = game.getState();
      setStartingPositionGrid(new Uint8Array(state.grid));
    }
    setIsRunning(true);
  };

  // Handle stop
  const handleStop = () => {
    setIsRunning(false);
  };

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (isRunning) {
      handleStop();
    } else {
      handleRun();
    }
  };

  // Generate noise
  const generateNoise = (type: 'uniform' | 'clustered' | 'sparse' | 'center' | 'edges') => {
    if (!game || !renderer || isRunning) return;

    game.clear();
    const state = game.getState();
    const { width, height } = state;
    const centerX = width / 2;
    const centerY = height / 2;

    switch (type) {
      case 'uniform':
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (Math.random() < 0.3) {
              game.setCell(x, y, true);
            }
          }
        }
        break;

      case 'clustered':
        const clusters = Math.floor((width * height) / 100);
        for (let i = 0; i < clusters; i++) {
          const clusterX = Math.floor(Math.random() * width);
          const clusterY = Math.floor(Math.random() * height);
          const clusterSize = 3 + Math.floor(Math.random() * 4);

          for (let dy = -clusterSize; dy <= clusterSize; dy++) {
            for (let dx = -clusterSize; dx <= clusterSize; dx++) {
              if (Math.random() < 0.7) {
                const x = clusterX + dx;
                const y = clusterY + dy;
                if (x >= 0 && x < width && y >= 0 && y < height) {
                  game.setCell(x, y, true);
                }
              }
            }
          }
        }
        break;

      case 'sparse':
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (Math.random() < 0.1) {
              game.setCell(x, y, true);
            }
          }
        }
        break;

      case 'center':
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dx = (x - centerX) / centerX;
            const dy = (y - centerY) / centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const probability = Math.max(0, 0.5 * (1 - distance));
            if (Math.random() < probability) {
              game.setCell(x, y, true);
            }
          }
        }
        break;

      case 'edges':
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dx = (x - centerX) / centerX;
            const dy = (y - centerY) / centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
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

  // Handle mouse events for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!game || !renderer || isRunning || (!drawMode && !selectedPattern)) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    setIsDrawing(true);
    drawAtPosition(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !game || !renderer || isRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    drawAtPosition(x, y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  const drawAtPosition = (x: number, y: number) => {
    if (!game || !renderer) return;

    if (selectedPattern) {
      placePattern(x, y, selectedPattern);
      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    } else if (drawMode) {
      const isAlive = drawMode === 'draw';
      const size = brushSize === 'single' ? 0 : brushSize === '3x3' ? 1 : 2;

      for (let dy = -size; dy <= size; dy++) {
        for (let dx = -size; dx <= size; dx++) {
          const cellX = x + dx;
          const cellY = y + dy;
          if (cellX >= 0 && cellX < gridSize && cellY >= 0 && cellY < gridSize) {
            game.setCell(cellX, cellY, isAlive);
          }
        }
      }

      renderer.updateGrid(game.getState().grid);
      renderer.render();
      updateStats(game);
    }
  };

  const placePattern = (
    centerX: number,
    centerY: number,
    pattern: { width: number; height: number; cells: number[][] }
  ) => {
    if (!game) return;

    const startX = centerX - Math.floor(pattern.width / 2);
    const startY = centerY - Math.floor(pattern.height / 2);

    for (let y = 0; y < pattern.height; y++) {
      for (let x = 0; x < pattern.width; x++) {
        const cellX = startX + x;
        const cellY = startY + y;
        if (
          cellX >= 0 &&
          cellX < gridSize &&
          cellY >= 0 &&
          cellY < gridSize &&
          pattern.cells[y][x] === 1
        ) {
          game.setCell(cellX, cellY, true);
        }
      }
    }
  };

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  // Handle fullscreen
  const handleEnterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
    setIsFullscreen(true);
  };

  const handleExitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
    setIsFullscreen(false);
  };

  // Render error state
  if (error) {
    return (
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
    );
  }

  // Sub-nav actions
  const subNavActions = (
    <>
      <button
        className={`button secondary ${showAnalyticsModal ? 'active' : ''}`}
        onClick={toggleAnalyticsModal}
        disabled={!isInitialized}
      >
        {showAnalyticsModal ? 'Hide Analytics' : 'Analytics'}
      </button>
      <button
        className={`button secondary ${showBenchmarkModal ? 'active' : ''}`}
        onClick={toggleBenchmarkModal}
        disabled={!isInitialized}
      >
        {showBenchmarkModal ? 'Hide Benchmark' : 'Benchmark'}
      </button>
      <FullscreenToggle
        isFullscreen={isFullscreen}
        onToggle={isFullscreen ? handleExitFullscreen : handleEnterFullscreen}
        disabled={!isInitialized}
      />
    </>
  );

  return (
    <ExperimentLayout
      title="Conway's Game of Life"
      subtitle="WebGPU Experiment - Naive Implementation"
      subNavContent={
        <>
          <TransportControls
            isRunning={isRunning}
            isInitialized={isInitialized}
            onPlayPause={handlePlayPause}
            onStep={handleStep}
            onReset={handleReset}
          />
          <div className="sub-nav-actions">
            {subNavActions}
          </div>
        </>
      }
    >
      {/* Canvas */}
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
        <ToolStrip isVisible={!isRunning}>
          {/* Grid Configuration */}
          <div className="control-group compact-sliders">
            <ToolSlider
              label="Grid"
              value={gridSize >= 1024 ? 1024 : gridSize}
              min={16}
              max={1024}
              step={16}
              onChange={handleGridSizeChange}
              disabled={!isInitialized}
              formatValue={(value) => value >= 1024 ? 'max' : `${value}×${value}`}
              compact
            />
            {gridSize >= 1024 && (
              <div className="slider-hint">
                Canvas size: {calculateGridSizeFromCanvas()}×{calculateGridSizeFromCanvas()}
              </div>
            )}
            
            <ToolSlider
              label="Cell"
              value={cellSize}
              min={1}
              max={16}
              step={1}
              onChange={handleCellSizeChange}
              disabled={!isInitialized}
              formatValue={(value) => `${value}px`}
              compact
            />
            
            <ToolSlider
              label="Speed"
              value={speed}
              min={1}
              max={61}
              step={1}
              onChange={setSpeed}
              disabled={!isInitialized}
              formatValue={(value) => value === 61 ? 'unlimited' : `${value}fps`}
              compact
            />
            {speed === 61 && <div className="slider-hint">Process every frame</div>}
          </div>

          {/* Game of Life specific tools */}
          <GameOfLifeTools
            isInitialized={isInitialized}
            isRunning={isRunning}
            drawMode={drawMode}
            setDrawMode={setDrawMode}
            brushSize={brushSize}
            setBrushSize={setBrushSize}
            selectedPattern={selectedPattern}
            setSelectedPattern={setSelectedPattern}
            builtInPatterns={builtInPatterns}
            generateNoise={generateNoise}
          />

          {/* File Save/Load */}
          <FileSaveLoad
            onSaveInitial={() => handleSaveToFile(true)}
            onSaveCurrent={() => handleSaveToFile(false)}
            onLoad={handleLoadFromFile}
            disabled={!isInitialized || isRunning}
            initialDisabled={!startingPositionGrid}
            compact
          />
        </ToolStrip>
      )}

      {/* Analytics Modal */}
      {showAnalyticsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Simulation Analytics</h3>
              <button
                className="modal-close"
                onClick={toggleAnalyticsModal}
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
                  <div className="stat-value">{simulationFps.toFixed(1)}</div>
                  <div className="stat-label">Simulation FPS</div>
                </div>
              </div>
              
              <div className="info-panel">
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
            <div className="modal-footer">
              <button className="button secondary" onClick={toggleAnalyticsModal}>
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
              <h3>Performance Benchmark</h3>
              <button
                className="modal-close"
                onClick={toggleBenchmarkModal}
                title="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="performance-panel">
                <h4>Current Performance</h4>
                <div className="metric-grid">
                  <div className="metric">
                    <div className="metric-value">{metrics.fps.toFixed(1)}</div>
                    <div className="metric-label">FPS</div>
                  </div>
                  <div className="metric">
                    <div className="metric-value">{metrics.frameTime.toFixed(1)}ms</div>
                    <div className="metric-label">Frame Time</div>
                  </div>
                <div className="metric">
                  <div className="metric-value">
                    {metrics.memoryUsage ? metrics.memoryUsage.toFixed(1) : 'N/A'}%
                  </div>
                  <div className="metric-label">Memory</div>
                </div>
              </div>
              
              {metrics.isPerformanceWarning && (
                <div className="warnings">
                  <h5>⚠️ Performance Warning</h5>
                  <p>Performance is below optimal levels. Consider reducing grid size or cell size.</p>
                </div>
              )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="button secondary" onClick={toggleBenchmarkModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FPS Counter */}
      <div className="fps-counter">
        {metrics.fps.toFixed(1)} FPS
      </div>
    </ExperimentLayout>
  );
};

export default GameOfLifePage;