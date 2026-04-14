/**
 * Example experiment demonstrating the reusable experiment framework
 * 
 * This template shows how to create a new experiment using the reusable components:
 * - ExperimentCanvas: Main layout with canvas, metrics, and toolstrip
 * - CanvasManager: Handles canvas setup, WebGPU/WebGL context, and animation loop
 * - MetricsDisplay: Shows performance and experiment metrics
 * - FileManager: Handles file save/load operations
 * - useExperimentState: Manages experiment state (running, speed, grid size, etc.)
 * - ToolStrip, ToolSection, ToolButton, ToolSlider: UI components for tools
 */

import { useState, useCallback } from 'react';
import {
  ExperimentCanvas,
  CanvasContext,
  useExperimentState,
  ToolSlider,
  ToolButton,
  ToolSection,
  FileManager,
  PerformanceMetrics,
  ExperimentMetrics,
} from './index';

interface ExampleExperimentProps {
  /** Custom title for the experiment */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
}

const ExampleExperiment: React.FC<ExampleExperimentProps> = ({
  title = 'Example Experiment',
  subtitle = 'Demonstrating reusable experiment framework',
}) => {
  // Use the experiment state hook for common state management
  const [experimentState, experimentActions] = useExperimentState({
    initialSpeed: 60,
    initialGridSize: 512,
    initialCellSize: 2,
  });

  // Destructure state and actions
  const {
    isRunning,
    isInitialized,
    speed,
    gridSize,
    cellSize,
    generation,
    aliveCount,
    density,
  } = experimentState;

  const {
    setIsInitialized,
    setSpeed,
    setGridSize,
    setCellSize,
    setGeneration,
    handleTogglePlayPause,
  } = experimentActions;

  // Experiment-specific state
  const [customData, setCustomData] = useState<Float32Array>(new Float32Array(0));

  // Performance metrics (would come from usePerformanceMonitor in real experiment)
  const performanceMetrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.7,
    memoryUsage: 45.2,
    isPerformanceWarning: false,
    warnings: [],
  };

  // Experiment metrics
  const experimentMetrics: ExperimentMetrics = {
    generation,
    aliveCount,
    density,
    gridSize,
    cellSize,
    speed,
    status: isRunning ? 'running' : 'paused',
  };

  // Handle canvas ready
  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement, context: CanvasContext) => {
    console.log('Canvas ready:', canvas, context);
    
    // Initialize experiment-specific resources
    // Example: Create WebGPU/WebGL buffers, textures, shaders
    
    // Mark as initialized
    setIsInitialized(true);
    
    // Initialize custom data
    const dataSize = gridSize * gridSize;
    const data = new Float32Array(dataSize);
    for (let i = 0; i < dataSize; i++) {
      data[i] = Math.random();
    }
    setCustomData(data);
  }, [gridSize, setIsInitialized]);

  // Handle canvas resize
  const handleCanvasResize = useCallback((width: number, height: number) => {
    console.log('Canvas resized:', width, height);
    // Update any resources that depend on canvas size
  }, []);

  // Render loop
  const handleRender = useCallback((context: CanvasContext) => {
    if (!isRunning || !isInitialized) return;
    
    // Example rendering logic
    if (context instanceof CanvasRenderingContext2D) {
      // 2D canvas rendering
      const ctx = context;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      
      // Draw something based on customData
      const cellWidth = ctx.canvas.width / gridSize;
      const cellHeight = ctx.canvas.height / gridSize;
      
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const value = customData[y * gridSize + x] || 0;
          ctx.fillStyle = `rgb(${value * 255}, ${value * 128}, ${value * 64})`;
          ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        }
      }
    } else if (context instanceof WebGL2RenderingContext || context instanceof WebGLRenderingContext) {
      // WebGL rendering
      const gl = context;
      gl.clear(gl.COLOR_BUFFER_BIT);
      // WebGL rendering logic here
    }
    // Note: WebGPU context (GPUCanvasContext) would need different handling
    
    // Update experiment metrics
    setGeneration(generation + 1);
    // Update other metrics as needed
  }, [isRunning, isInitialized, gridSize, customData, setGeneration]);

  // Handle step (manual advance)
  const handleStep = useCallback(() => {
    if (!isInitialized || isRunning) return;
    
    // Advance simulation by one step
    console.log('Manual step');
    setGeneration(generation + 1);
    
    // Update custom data (example: simple cellular automaton)
    const newData = new Float32Array(customData.length);
    for (let i = 0; i < customData.length; i++) {
      // Simple rule: average of neighbors
      const neighbors = [
        customData[i - 1] || 0,
        customData[i + 1] || 0,
        customData[i - gridSize] || 0,
        customData[i + gridSize] || 0,
      ];
      const avg = neighbors.reduce((sum, val) => sum + val, 0) / neighbors.length;
      newData[i] = avg;
    }
    setCustomData(newData);
  }, [isInitialized, isRunning, customData, gridSize, setGeneration]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (!isInitialized) return;
    
    // Reset simulation state
    setGeneration(0);
    
    // Reinitialize custom data with random values
    const dataSize = gridSize * gridSize;
    const data = new Float32Array(dataSize);
    for (let i = 0; i < dataSize; i++) {
      data[i] = Math.random();
    }
    setCustomData(data);
    
    console.log('Experiment reset');
  }, [isInitialized, gridSize, setGeneration]);

  // Handle grid size change
  const handleGridSizeChange = useCallback((newSize: number) => {
    setGridSize(newSize);
    
    // Reinitialize data with new size
    const dataSize = newSize * newSize;
    const data = new Float32Array(dataSize);
    for (let i = 0; i < dataSize; i++) {
      data[i] = Math.random();
    }
    setCustomData(data);
  }, [setGridSize]);



  // Handle file load
  const handleFileLoad = useCallback(async (data: ArrayBuffer, file: File) => {
    try {
      const text = new TextDecoder().decode(data);
      const loadedData = JSON.parse(text);
      
      // Validate loaded data
      if (!loadedData.gridSize || !loadedData.customData) {
        throw new Error('Invalid file format');
      }
      
      // Update experiment state from loaded data
      setGridSize(loadedData.gridSize);
      setCellSize(loadedData.cellSize || 1);
      setGeneration(loadedData.generation || 0);
      setCustomData(new Float32Array(loadedData.customData));
      
      console.log('Loaded experiment state from:', file.name);
    } catch (error) {
      console.error('Failed to load file:', error);
      throw error;
    }
  }, [setGridSize, setCellSize, setGeneration]);

  // Toolstrip content
  const toolstripContent = (
    <>
      {/* Example tool sections */}
      <ToolSection label="Simulation Controls">
        <ToolButton
          icon="🎲"
          title="Randomize"
          onClick={() => {
            const dataSize = gridSize * gridSize;
            const data = new Float32Array(dataSize);
            for (let i = 0; i < dataSize; i++) {
              data[i] = Math.random();
            }
            setCustomData(data);
          }}
          disabled={!isInitialized || isRunning}
        />
        <ToolButton
          icon="🌀"
          title="Apply Filter"
          onClick={() => {
            // Example filter operation
            const newData = new Float32Array(customData.length);
            for (let i = 0; i < customData.length; i++) {
              newData[i] = Math.sin(customData[i] * Math.PI * 2);
            }
            setCustomData(newData);
          }}
          disabled={!isInitialized || isRunning}
        />
      </ToolSection>

      <ToolSection label="Grid Settings">
        <div className="control-group">
          <div className="control-label">Grid Size: {gridSize}×{gridSize}</div>
        <ToolSlider
          label="Grid Size"
          min={64}
          max={1024}
          step={64}
          value={gridSize}
          onChange={handleGridSizeChange}
          disabled={!isInitialized || isRunning}
        />
        </div>

        <div className="control-group">
          <div className="control-label">Cell Size: {cellSize}px</div>
        <ToolSlider
          label="Cell Size"
          min={1}
          max={8}
          step={1}
          value={cellSize}
          onChange={setCellSize}
          disabled={!isInitialized || isRunning}
        />
        </div>
      </ToolSection>

      <ToolSection label="Simulation Speed">
        <div className="control-group">
          <div className="control-label">Speed: {speed === 61 ? 'Max' : `${speed} FPS`}</div>
        <ToolSlider
          label="Speed"
          min={1}
          max={61}
          step={5}
          value={speed}
          onChange={setSpeed}
          disabled={!isInitialized}
        />
        </div>
      </ToolSection>

      {/* File operations using FileManager */}
      <FileManager
        canSave={isInitialized}
        canLoad={isInitialized}
        onSave={async (blob, filename) => {
          // Download the blob
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}
        onLoad={handleFileLoad}
        headerLabel="File Operations"
      />
    </>
  );

  return (
    <ExperimentCanvas
      title={title}
      subtitle={subtitle}
      canvasWidth={1024}
      canvasHeight={768}
      useWebGPU={false} // Set to true for WebGPU experiments
      performanceMetrics={performanceMetrics}
      experimentMetrics={experimentMetrics}
      isRunning={isRunning}
      speed={speed}
      onTogglePlayPause={handleTogglePlayPause}
      onStep={handleStep}
      onReset={handleReset}
      onCanvasReady={handleCanvasReady}
      onCanvasResize={handleCanvasResize}
      onRender={handleRender}
      toolstripContent={toolstripContent}
      showMetrics={true}
      showToolstrip={true}
      toolstripPosition="right"
      toolstripVisible={true}
    />
  );
};

export default ExampleExperiment;