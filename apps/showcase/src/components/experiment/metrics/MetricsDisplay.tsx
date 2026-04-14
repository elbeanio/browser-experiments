import React from 'react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number | null;
  isPerformanceWarning: boolean;
  warnings?: string[];
}

export interface ExperimentMetrics {
  generation?: number;
  aliveCount?: number;
  density?: number;
  gridSize?: number;
  cellSize?: number;
  speed?: number;
  status?: 'running' | 'paused' | 'stopped';
}

export interface MetricsDisplayProps {
  /** Performance metrics from usePerformanceMonitor or similar */
  performanceMetrics?: PerformanceMetrics;
  /** Experiment-specific metrics */
  experimentMetrics?: ExperimentMetrics;
  /** Whether to show performance warnings */
  showWarnings?: boolean;
  /** Whether to show detailed metrics (default: compact) */
  detailed?: boolean;
  /** Position of the metrics display */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Custom CSS class */
  className?: string;
  /** Callback when warning is clicked */
  onWarningClick?: () => void;
  /** Whether metrics are currently updating */
  isUpdating?: boolean;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  performanceMetrics,
  experimentMetrics,
  showWarnings = true,
  position = 'top-right',
  className = '',
  onWarningClick,
  isUpdating = false,
}) => {
  const positionClasses = {
    'top-right': 'metrics-top-right',
    'top-left': 'metrics-top-left',
    'bottom-right': 'metrics-bottom-right',
    'bottom-left': 'metrics-bottom-left',
  };

  const hasPerformanceMetrics = performanceMetrics && (
    performanceMetrics.fps > 0 || 
    performanceMetrics.frameTime > 0 || 
    performanceMetrics.memoryUsage !== null
  );

  const hasExperimentMetrics = experimentMetrics && (
    experimentMetrics.generation !== undefined ||
    experimentMetrics.aliveCount !== undefined ||
    experimentMetrics.density !== undefined
  );

  if (!hasPerformanceMetrics && !hasExperimentMetrics) {
    return null;
  }

  const renderPerformanceMetrics = () => {
    if (!performanceMetrics) return null;

    return (
      <div className="performance-metrics">
        <div className="metric-row">
          <span className="metric-label">FPS:</span>
          <span className={`metric-value ${performanceMetrics.fps < 30 ? 'metric-warning' : ''}`}>
            {performanceMetrics.fps.toFixed(1)}
          </span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Frame:</span>
          <span className={`metric-value ${performanceMetrics.frameTime > 33 ? 'metric-warning' : ''}`}>
            {performanceMetrics.frameTime.toFixed(1)}ms
          </span>
        </div>
        {performanceMetrics.memoryUsage !== null && (
          <div className="metric-row">
            <span className="metric-label">Memory:</span>
            <span className={`metric-value ${performanceMetrics.memoryUsage > 80 ? 'metric-warning' : ''}`}>
              {performanceMetrics.memoryUsage.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderExperimentMetrics = () => {
    if (!experimentMetrics) return null;

    return (
      <div className="experiment-metrics">
        {experimentMetrics.generation !== undefined && (
          <div className="metric-row">
            <span className="metric-label">Gen:</span>
            <span className="metric-value">{experimentMetrics.generation}</span>
          </div>
        )}
        {experimentMetrics.aliveCount !== undefined && (
          <div className="metric-row">
            <span className="metric-label">Alive:</span>
            <span className="metric-value">{experimentMetrics.aliveCount.toLocaleString()}</span>
          </div>
        )}
        {experimentMetrics.density !== undefined && (
          <div className="metric-row">
            <span className="metric-label">Density:</span>
            <span className="metric-value">{(experimentMetrics.density * 100).toFixed(1)}%</span>
          </div>
        )}
        {experimentMetrics.gridSize !== undefined && (
          <div className="metric-row">
            <span className="metric-label">Grid:</span>
            <span className="metric-value">{experimentMetrics.gridSize}×{experimentMetrics.gridSize}</span>
          </div>
        )}
        {experimentMetrics.cellSize !== undefined && (
          <div className="metric-row">
            <span className="metric-label">Cell:</span>
            <span className="metric-value">{experimentMetrics.cellSize}px</span>
          </div>
        )}
        {experimentMetrics.speed !== undefined && (
          <div className="metric-row">
            <span className="metric-label">Speed:</span>
            <span className="metric-value">{experimentMetrics.speed} FPS</span>
          </div>
        )}
        {experimentMetrics.status !== undefined && (
          <div className="metric-row">
            <span className="metric-label">Status:</span>
            <span className={`metric-value status-${experimentMetrics.status}`}>
              {experimentMetrics.status === 'running' ? '▶️' : '⏸️'} {experimentMetrics.status}
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderWarnings = () => {
    if (!showWarnings || !performanceMetrics?.isPerformanceWarning) return null;

    const warnings = performanceMetrics.warnings || [];
    if (warnings.length === 0 && !performanceMetrics.isPerformanceWarning) return null;

    return (
      <div 
        className="metrics-warnings" 
        onClick={onWarningClick}
        style={{ cursor: onWarningClick ? 'pointer' : 'default' }}
      >
        <div className="warning-icon">⚠️</div>
        <div className="warning-content">
          <div className="warning-title">Performance Warning</div>
          {warnings.length > 0 ? (
            <div className="warning-messages">
              {warnings.map((warning, index) => (
                <div key={index} className="warning-message">{warning}</div>
              ))}
            </div>
          ) : (
            <div className="warning-message">Performance is below optimal levels</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`metrics-display ${positionClasses[position]} ${className} ${isUpdating ? 'updating' : ''}`}>
      {renderWarnings()}
      <div className="metrics-content">
        {renderPerformanceMetrics()}
        {renderExperimentMetrics()}
      </div>
    </div>
  );
};

export default MetricsDisplay;