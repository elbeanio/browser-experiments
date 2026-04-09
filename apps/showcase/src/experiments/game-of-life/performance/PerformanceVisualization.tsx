import React from 'react';
import { PerformanceMetrics } from './usePerformanceMonitor';

interface PerformanceVisualizationProps {
  metrics: PerformanceMetrics;
  title?: string;
  showDetails?: boolean;
  showWarnings?: boolean;
  className?: string;
}

export const PerformanceVisualization: React.FC<PerformanceVisualizationProps> = ({
  metrics,
  title = 'Performance Metrics',
  showDetails = true,
  showWarnings = true,
  className = '',
}) => {
  // Format memory values
  const formatMemory = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)} MB`;
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  // Get performance score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  // Get performance score label
  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  // Get frame time color
  const getFrameTimeColor = (frameTime: number): string => {
    if (frameTime <= 16.7) return 'var(--color-success)'; // 60fps
    if (frameTime <= 33.3) return 'var(--color-warning)'; // 30fps
    return 'var(--color-error)';
  };

  // Get FPS color
  const getFpsColor = (fps: number): string => {
    if (fps >= 60) return 'var(--color-success)';
    if (fps >= 30) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  // Get memory usage color
  const getMemoryColor = (usage: number | null): string => {
    if (usage === null) return 'var(--color-text-muted)';
    if (usage <= 50) return 'var(--color-success)';
    if (usage <= 80) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  return (
    <div className={`performance-visualization ${className}`}>
      <div className="performance-header">
        <h3>{title}</h3>
        <div className="performance-score">
          <div 
            className="score-circle"
            style={{
              '--score-color': getScoreColor(metrics.performanceScore),
            } as React.CSSProperties}
          >
            <span className="score-value">{metrics.performanceScore}</span>
            <span className="score-label">Score</span>
          </div>
          <div className="score-details">
            <span className={`score-label-text ${getScoreLabel(metrics.performanceScore).toLowerCase()}`}>
              {getScoreLabel(metrics.performanceScore)}
            </span>
            {showWarnings && metrics.isPerformanceWarning && (
              <span className="performance-warning">⚠️ Performance Issues Detected</span>
            )}
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        {/* Frame Timing Metrics */}
        <div className="metric-group">
          <h4>Frame Timing</h4>
          <div className="metric-row">
            <span className="metric-label">FPS:</span>
            <span className="metric-value" style={{ color: getFpsColor(metrics.fps) }}>
              {metrics.fps}
            </span>
          </div>
          <div className="metric-row">
            <span className="metric-label">Frame Time:</span>
            <span className="metric-value" style={{ color: getFrameTimeColor(metrics.frameTime) }}>
              {metrics.frameTime.toFixed(1)}ms
            </span>
          </div>
          {showDetails && (
            <>
              <div className="metric-row">
                <span className="metric-label">Min:</span>
                <span className="metric-value">
                  {metrics.frameTimeMin.toFixed(1)}ms
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Max:</span>
                <span className="metric-value">
                  {metrics.frameTimeMax.toFixed(1)}ms
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Avg:</span>
                <span className="metric-value">
                  {metrics.frameTimeAvg.toFixed(1)}ms
                </span>
              </div>
            </>
          )}
        </div>

        {/* Memory Metrics */}
        <div className="metric-group">
          <h4>Memory Usage</h4>
          {metrics.memoryUsage !== null ? (
            <>
              <div className="metric-row">
                <span className="metric-label">Usage:</span>
                <span className="metric-value" style={{ color: getMemoryColor(metrics.memoryUsage) }}>
                  {formatPercentage(metrics.memoryUsage)}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Used:</span>
                <span className="metric-value">
                  {formatMemory(metrics.memoryUsed)}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Total:</span>
                <span className="metric-value">
                  {formatMemory(metrics.memoryTotal)}
                </span>
              </div>
              {showDetails && metrics.memoryLimit !== null && (
                <div className="metric-row">
                  <span className="metric-label">Limit:</span>
                  <span className="metric-value">
                    {formatMemory(metrics.memoryLimit)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="metric-row">
              <span className="metric-label text-muted">
                Memory API not available in this browser
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Frame Time Visualization */}
      {showDetails && (
        <div className="frame-time-visualization">
          <h4>Frame Time Consistency</h4>
          <div className="frame-time-bar">
            <div 
              className="frame-time-fill"
              style={{
                width: `${Math.min(100, (metrics.frameTime / 33.3) * 100)}%`,
                backgroundColor: getFrameTimeColor(metrics.frameTime),
              }}
            />
            <div className="frame-time-markers">
              <span className="marker" style={{ left: '0%' }}>0ms</span>
              <span className="marker" style={{ left: '50%' }}>16.7ms (60fps)</span>
              <span className="marker" style={{ left: '100%' }}>33.3ms (30fps)</span>
            </div>
          </div>
          <div className="frame-time-label">
            Current: {metrics.frameTime.toFixed(1)}ms
          </div>
        </div>
      )}

      <style>{`
        .performance-visualization {
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-md);
        }

        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .performance-header h3 {
          margin: 0;
          color: var(--color-primary);
          font-size: 1.1rem;
        }

        .performance-score {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }

        .score-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: conic-gradient(var(--score-color) 0% ${metrics.performanceScore}%, var(--color-secondary) ${metrics.performanceScore}% 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .score-circle::before {
          content: '';
          position: absolute;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: var(--color-bg-card);
        }

        .score-value {
          font-size: 1.2rem;
          font-weight: bold;
          color: var(--color-text);
          position: relative;
          z-index: 1;
        }

        .score-label {
          font-size: 0.7rem;
          color: var(--color-text-muted);
          position: relative;
          z-index: 1;
        }

        .score-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .score-label-text {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .score-label-text.good {
          color: var(--color-success);
        }

        .score-label-text.fair {
          color: var(--color-warning);
        }

        .score-label-text.poor {
          color: var(--color-error);
        }

        .performance-warning {
          font-size: 0.8rem;
          color: var(--color-warning);
          background: rgba(245, 158, 11, 0.1);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
        }

        .metric-group {
          background: var(--color-bg);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
        }

        .metric-group h4 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--color-text);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
          font-size: 0.85rem;
        }

        .metric-row:last-child {
          margin-bottom: 0;
        }

        .metric-label {
          color: var(--color-text-muted);
        }

        .metric-value {
          font-weight: 600;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .frame-time-visualization {
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
        }

        .frame-time-visualization h4 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--color-text);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .frame-time-bar {
          height: 20px;
          background: var(--color-bg);
          border-radius: var(--radius-sm);
          position: relative;
          overflow: hidden;
          margin-bottom: var(--spacing-sm);
        }

        .frame-time-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: var(--radius-sm);
        }

        .frame-time-markers {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
        }

        .frame-time-markers .marker {
          position: absolute;
          top: 100%;
          margin-top: var(--spacing-xs);
          font-size: 0.7rem;
          color: var(--color-text-muted);
          transform: translateX(-50%);
        }

        .frame-time-label {
          text-align: center;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  );
};