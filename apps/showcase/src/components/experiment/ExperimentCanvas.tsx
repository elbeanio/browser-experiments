import React, { ReactNode } from 'react';
import CanvasManager, { CanvasContext } from './canvas/CanvasManager';
import MetricsDisplay, { PerformanceMetrics, ExperimentMetrics } from './metrics/MetricsDisplay';
import ToolStrip from './tools/ToolStrip';
import ExperimentLayout from './layout/ExperimentLayout';
import TransportControls from './layout/TransportControls';

export interface ExperimentCanvasProps {
  /** Experiment title */
  title: string;
  /** Experiment subtitle */
  subtitle?: string;
  /** Canvas width */
  canvasWidth?: number;
  /** Canvas height */
  canvasHeight?: number;
  /** Whether to use WebGPU context */
  useWebGPU?: boolean;
  /** Performance metrics to display */
  performanceMetrics?: PerformanceMetrics;
  /** Experiment-specific metrics */
  experimentMetrics?: ExperimentMetrics;
  /** Whether simulation is running */
  isRunning: boolean;
  /** Current simulation speed (FPS) */
  speed: number;
  /** Callback when play/pause is toggled */
  onTogglePlayPause: () => void;
  /** Callback when step button is clicked */
  onStep: () => void;
  /** Callback when reset button is clicked */
  onReset: () => void;
  /** Callback when canvas is ready */
  onCanvasReady?: (canvas: HTMLCanvasElement, context: CanvasContext) => void;
  /** Callback when canvas is resized */
  onCanvasResize?: (width: number, height: number) => void;
  /** Callback for render loop */
  onRender?: (context: CanvasContext, timestamp: number) => void;
  /** Toolstrip content (experiment-specific tools) */
  toolstripContent?: ReactNode;
  /** Header content (additional header elements) */
  headerContent?: ReactNode;
  /** Sub-nav content (additional controls) */
  subNavContent?: ReactNode;
  /** Whether to show metrics display */
  showMetrics?: boolean;
  /** Whether to show toolstrip */
  showToolstrip?: boolean;
  /** Toolstrip position */
  toolstripPosition?: 'right' | 'bottom';
  /** Whether toolstrip is visible */
  toolstripVisible?: boolean;
  /** Additional CSS class */
  className?: string;
}

const ExperimentCanvas: React.FC<ExperimentCanvasProps> = ({
  title,
  subtitle,
  canvasWidth = 1024,
  canvasHeight = 768,
  useWebGPU = false,
  performanceMetrics,
  experimentMetrics,
  isRunning,
  speed,
  onTogglePlayPause,
  onStep,
  onReset,
  onCanvasReady,
  onCanvasResize,
  onRender,
  toolstripContent,
  headerContent,
  subNavContent,
  showMetrics = true,
  showToolstrip = true,
  toolstripPosition = 'right',
  toolstripVisible = true,
  className = '',
}) => {
  // Combine transport controls with fullscreen toggle
  const transportControls = (
    <>
      <TransportControls
        isRunning={isRunning}
        isInitialized={true} // Assuming initialized when using this component
        onPlayPause={onTogglePlayPause}
        onStep={onStep}
        onReset={onReset}
      />
      {/* FullscreenToggle would need isFullscreen and onToggle props */}
      {/* For now, we'll omit it since it requires additional state management */}
    </>
  );

  return (
    <ExperimentLayout
      title={title}
      subtitle={subtitle}
      headerContent={headerContent}
      subNavContent={subNavContent || transportControls}
      className={className}
    >
      {/* Main canvas area */}
      <div className="experiment-canvas-container">
        <CanvasManager
          width={canvasWidth}
          height={canvasHeight}
          useWebGPU={useWebGPU}
          isRunning={isRunning}
          targetFps={speed}
          onCanvasReady={onCanvasReady}
          onResize={onCanvasResize}
          onRender={onRender}
          canvasAttributes={{
            className: 'experiment-canvas',
          }}
        />

        {/* Metrics display */}
        {showMetrics && (
          <MetricsDisplay
            performanceMetrics={performanceMetrics}
            experimentMetrics={experimentMetrics}
            position="top-right"
          />
        )}
      </div>

      {/* Toolstrip */}
      {showToolstrip && (
        <ToolStrip
          isVisible={toolstripVisible}
          position={toolstripPosition}
        >
          {toolstripContent}
        </ToolStrip>
      )}
    </ExperimentLayout>
  );
};

export default ExperimentCanvas;