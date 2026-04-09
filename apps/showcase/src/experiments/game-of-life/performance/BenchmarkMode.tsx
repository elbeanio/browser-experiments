import React, { useState } from 'react';
import { PerformanceMetrics, usePerformanceMonitor } from './usePerformanceMonitor';

export interface BenchmarkResult {
  id: string;
  timestamp: number;
  settings: {
    gridSize: number;
    cellSize: number;
    speed: number;
    theme: string;
  };
  metrics: PerformanceMetrics;
}

interface BenchmarkModeProps {
  onBenchmarkComplete?: (results: BenchmarkResult[]) => void;
  currentSettings: {
    gridSize: number;
    cellSize: number;
    speed: number;
    theme: string;
  };
  className?: string;
}

export const BenchmarkMode: React.FC<BenchmarkModeProps> = ({
  onBenchmarkComplete,
  currentSettings,
  className = '',
}) => {
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkDuration, setBenchmarkDuration] = useState(10000); // 10 seconds
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [currentBenchmark, setCurrentBenchmark] = useState<{
    startTime: number;
    progress: number;
  } | null>(null);

  const { startBenchmark, reset } = usePerformanceMonitor({
    enabled: true,
    updateInterval: 500,
  });

  const startNewBenchmark = async () => {
    if (isBenchmarking) return;

    setIsBenchmarking(true);
    reset();
    
    const startTime = Date.now();
    setCurrentBenchmark({
      startTime,
      progress: 0,
    });

    // Update progress
    const progressInterval = setInterval(() => {
      if (currentBenchmark) {
        const elapsed = Date.now() - currentBenchmark.startTime;
        const progress = Math.min(100, (elapsed / benchmarkDuration) * 100);
        setCurrentBenchmark(prev => prev ? { ...prev, progress } : null);
      }
    }, 100);

    try {
      const result = await startBenchmark(benchmarkDuration);
      
      const benchmarkResult: BenchmarkResult = {
        id: `benchmark-${Date.now()}`,
        timestamp: Date.now(),
        settings: currentSettings,
        metrics: result,
      };

      setBenchmarkResults(prev => [benchmarkResult, ...prev].slice(0, 10)); // Keep last 10
      
      if (onBenchmarkComplete) {
        onBenchmarkComplete([benchmarkResult]);
      }
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      clearInterval(progressInterval);
      setIsBenchmarking(false);
      setCurrentBenchmark(null);
    }
  };

  const clearResults = () => {
    setBenchmarkResults([]);
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(benchmarkResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-of-life-benchmark-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getComparison = (result1: BenchmarkResult, result2: BenchmarkResult) => {
    const improvements = [];
    const regressions = [];

    // FPS comparison
    const fpsDiff = result2.metrics.fps - result1.metrics.fps;
    if (Math.abs(fpsDiff) >= 1) {
      if (fpsDiff > 0) {
        improvements.push(`FPS: +${fpsDiff.toFixed(1)}`);
      } else {
        regressions.push(`FPS: ${fpsDiff.toFixed(1)}`);
      }
    }

    // Frame time comparison
    const frameTimeDiff = result2.metrics.frameTimeAvg - result1.metrics.frameTimeAvg;
    if (Math.abs(frameTimeDiff) >= 0.5) {
      if (frameTimeDiff < 0) {
        improvements.push(`Frame time: ${frameTimeDiff.toFixed(1)}ms`);
      } else {
        regressions.push(`Frame time: +${frameTimeDiff.toFixed(1)}ms`);
      }
    }

    // Performance score comparison
    const scoreDiff = result2.metrics.performanceScore - result1.metrics.performanceScore;
    if (Math.abs(scoreDiff) >= 1) {
      if (scoreDiff > 0) {
        improvements.push(`Score: +${scoreDiff}`);
      } else {
        regressions.push(`Score: ${scoreDiff}`);
      }
    }

    return { improvements, regressions };
  };

  return (
    <div className={`benchmark-mode ${className}`}>
      <div className="benchmark-header">
        <h3>Benchmark Mode</h3>
        <div className="benchmark-status">
          {isBenchmarking ? (
            <span className="status-badge status-in-progress">Running</span>
          ) : (
            <span className="status-badge status-planned">Ready</span>
          )}
        </div>
      </div>

      <div className="benchmark-controls">
        <div className="control-group">
          <label htmlFor="benchmarkDuration">
            Duration: {benchmarkDuration / 1000}s
          </label>
          <input
            type="range"
            id="benchmarkDuration"
            min="3000"
            max="30000"
            step="1000"
            value={benchmarkDuration}
            onChange={(e) => setBenchmarkDuration(parseInt(e.target.value))}
            disabled={isBenchmarking}
          />
          <div className="value-display">
            <span>3s</span>
            <span>30s</span>
          </div>
        </div>

        <div className="button-group">
          <button
            className={`button ${isBenchmarking ? 'secondary' : ''}`}
            onClick={startNewBenchmark}
            disabled={isBenchmarking}
          >
            {isBenchmarking ? 'Running Benchmark...' : 'Start Benchmark'}
          </button>
          <button
            className="button secondary"
            onClick={clearResults}
            disabled={benchmarkResults.length === 0 || isBenchmarking}
          >
            Clear Results
          </button>
          <button
            className="button secondary"
            onClick={exportResults}
            disabled={benchmarkResults.length === 0 || isBenchmarking}
          >
            Export JSON
          </button>
        </div>
      </div>

      {currentBenchmark && (
        <div className="benchmark-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${currentBenchmark.progress}%` }}
            />
          </div>
          <div className="progress-label">
            {Math.round(currentBenchmark.progress)}% complete
          </div>
        </div>
      )}

      {benchmarkResults.length > 0 && (
        <div className="benchmark-results">
          <h4>Recent Benchmarks ({benchmarkResults.length})</h4>
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Grid</th>
                  <th>FPS</th>
                  <th>Frame Time</th>
                  <th>Memory</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkResults.map((result) => (
                  <tr key={result.id}>
                    <td>
                      {new Date(result.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      {result.settings.gridSize}x{result.settings.gridSize}
                    </td>
                    <td className={result.metrics.fps < 30 ? 'warning' : ''}>
                      {result.metrics.fps}
                    </td>
                    <td className={result.metrics.frameTimeAvg > 33 ? 'warning' : ''}>
                      {result.metrics.frameTimeAvg.toFixed(1)}ms
                    </td>
                    <td>
                      {result.metrics.memoryUsage !== null 
                        ? `${result.metrics.memoryUsage.toFixed(1)}%`
                        : 'N/A'}
                    </td>
                    <td className={`score-${Math.floor(result.metrics.performanceScore / 20)}`}>
                      {result.metrics.performanceScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {benchmarkResults.length >= 2 && (
            <div className="benchmark-comparison">
              <h5>Comparison with Previous Run</h5>
              {(() => {
                const comparison = getComparison(benchmarkResults[1], benchmarkResults[0]);
                return (
                  <div className="comparison-results">
                    {comparison.improvements.length > 0 && (
                      <div className="improvements">
                        <span className="comparison-label">Improvements:</span>
                {comparison.improvements.map((imp) => (
                  <span key={imp} className="improvement-item">✓ {imp}</span>
                ))}
              </div>
            )}
            {comparison.regressions.length > 0 && (
              <div className="regressions">
                <span className="comparison-label">Regressions:</span>
                {comparison.regressions.map((reg) => (
                  <span key={reg} className="regression-item">⚠️ {reg}</span>
                ))}
                      </div>
                    )}
                    {comparison.improvements.length === 0 && comparison.regressions.length === 0 && (
                      <div className="no-change">No significant changes detected</div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      <style>{`
        .benchmark-mode {
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-md);
        }

        .benchmark-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-lg);
        }

        .benchmark-header h3 {
          margin: 0;
          color: var(--color-primary);
          font-size: 1.1rem;
        }

        .benchmark-controls {
          margin-bottom: var(--spacing-lg);
        }

        .control-group {
          margin-bottom: var(--spacing-md);
        }

        .control-group label {
          display: block;
          margin-bottom: var(--spacing-sm);
          color: var(--color-text);
          font-size: 0.875rem;
        }

        .control-group input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-secondary);
          outline: none;
          -webkit-appearance: none;
        }

        .control-group input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-primary);
          cursor: pointer;
        }

        .value-display {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-xs);
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }

        .button-group {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }

        .button {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.2s;
          flex: 1;
          min-width: 120px;
        }

        .button:hover:not(:disabled) {
          background: var(--color-primary-hover);
        }

        .button.secondary {
          background: var(--color-secondary);
        }

        .button.secondary:hover:not(:disabled) {
          background: #334155;
        }

        .button:disabled {
          background: var(--color-secondary);
          cursor: not-allowed;
          opacity: 0.6;
        }

        .benchmark-progress {
          margin-bottom: var(--spacing-lg);
        }

        .progress-bar {
          height: 8px;
          background: var(--color-bg);
          border-radius: var(--radius-sm);
          overflow: hidden;
          margin-bottom: var(--spacing-xs);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary), #8b5cf6);
          transition: width 0.3s ease;
          border-radius: var(--radius-sm);
        }

        .progress-label {
          text-align: center;
          font-size: 0.85rem;
          color: var(--color-text-muted);
        }

        .benchmark-results {
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--color-border);
        }

        .benchmark-results h4 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--color-text);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .results-table {
          overflow-x: auto;
          margin-bottom: var(--spacing-lg);
        }

        .results-table table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8rem;
        }

        .results-table th {
          text-align: left;
          padding: var(--spacing-sm);
          background: var(--color-bg);
          color: var(--color-text-muted);
          font-weight: 600;
          border-bottom: 1px solid var(--color-border);
        }

        .results-table td {
          padding: var(--spacing-sm);
          border-bottom: 1px solid var(--color-border);
        }

        .results-table tr:last-child td {
          border-bottom: none;
        }

        .results-table .warning {
          color: var(--color-warning);
          font-weight: 600;
        }

        .results-table .score-4,
        .results-table .score-5 {
          color: var(--color-success);
          font-weight: 600;
        }

        .results-table .score-3 {
          color: var(--color-warning);
          font-weight: 600;
        }

        .results-table .score-0,
        .results-table .score-1,
        .results-table .score-2 {
          color: var(--color-error);
          font-weight: 600;
        }

        .benchmark-comparison {
          background: var(--color-bg);
          border-radius: var(--radius-md);
          padding: var(--spacing-md);
        }

        .benchmark-comparison h5 {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--color-text);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .comparison-results {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .improvements,
        .regressions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
          align-items: center;
        }

        .comparison-label {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          font-weight: 600;
        }

        .improvement-item {
          font-size: 0.8rem;
          color: var(--color-success);
          background: rgba(16, 185, 129, 0.1);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .regression-item {
          font-size: 0.8rem;
          color: var(--color-warning);
          background: rgba(245, 158, 11, 0.1);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .no-change {
          font-size: 0.8rem;
          color: var(--color-text-muted);
          text-align: center;
          padding: var(--spacing-sm);
        }
      `}</style>
    </div>
  );
};