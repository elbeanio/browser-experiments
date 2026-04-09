# Performance Monitoring for Game of Life

This module provides comprehensive performance monitoring for the Game of Life experiment within the unified static site architecture.

## Features

### 1. Real-time Performance Metrics
- **FPS (Frames Per Second)**: Current frame rate
- **Frame Time**: Time taken to render each frame (ms)
- **Frame Time Statistics**: Min, max, and average frame times
- **Memory Usage**: JavaScript heap usage (when browser supports it)
- **Performance Score**: Overall performance rating (0-100)

### 2. Performance Visualization
- Visual performance score indicator
- Color-coded metrics (green=good, yellow=fair, red=poor)
- Frame time consistency visualization
- Memory usage indicators

### 3. Benchmark Mode
- Run timed benchmarks to compare performance
- Compare different settings (grid size, cell size, speed)
- Export benchmark results as JSON
- Visual comparison with previous runs

### 4. Performance Warnings
- Automatic detection of performance issues
- Warnings for low FPS (<30), high frame time (>33ms), high memory usage (>80%)
- Visual indicators for performance problems

## Components

### `usePerformanceMonitor` Hook

The main hook that collects and manages performance metrics.

```typescript
import { usePerformanceMonitor } from './performance';

const { metrics, reset, startBenchmark, isSupported, memorySupported } = usePerformanceMonitor({
  enabled: true,
  updateInterval: 1000,
  frameTimeHistorySize: 60,
  warningThresholds: {
    lowFps: 30,
    highFrameTime: 33,
    highMemoryUsage: 80,
  },
});
```

#### Parameters
- `enabled`: Enable/disable monitoring (default: `true`)
- `updateInterval`: How often to update metrics in ms (default: `1000`)
- `frameTimeHistorySize`: Number of frame times to keep for statistics (default: `60`)
- `warningThresholds`: Thresholds for performance warnings

#### Return Value
- `metrics`: Current performance metrics
- `reset()`: Reset all metrics
- `startBenchmark(duration)`: Run a benchmark for specified duration (ms)
- `isSupported`: Whether performance API is supported
- `memorySupported`: Whether memory API is supported

### `PerformanceVisualization` Component

Visualizes performance metrics in a user-friendly format.

```typescript
import { PerformanceVisualization } from './performance';

<PerformanceVisualization
  metrics={metrics}
  title="Game of Life Performance"
  showDetails={true}
  showWarnings={true}
/>
```

#### Props
- `metrics`: Performance metrics from `usePerformanceMonitor`
- `title`: Component title (default: "Performance Metrics")
- `showDetails`: Show detailed metrics (default: `true`)
- `showWarnings`: Show performance warnings (default: `true`)
- `className`: Additional CSS class

### `BenchmarkMode` Component

Provides benchmarking functionality with comparison tools.

```typescript
import { BenchmarkMode } from './performance';

<BenchmarkMode
  currentSettings={{
    gridSize: 64,
    cellSize: 4,
    speed: 10,
    theme: 'green',
  }}
  onBenchmarkComplete={(results) => {
    console.log('Benchmark completed:', results);
  }}
/>
```

#### Props
- `currentSettings`: Current simulation settings
- `onBenchmarkComplete`: Callback when benchmark completes
- `className`: Additional CSS class

## Browser Support

### Performance API
- **Supported**: All modern browsers
- **Metrics**: FPS, frame timing, performance score

### Memory API
- **Supported**: Chrome, Edge (Chromium)
- **Limited Support**: Firefox, Safari (basic memory info)
- **Not Supported**: Some mobile browsers

## Integration with Game of Life

The performance monitoring is integrated into the Game of Life page with:

1. **Enhanced Stats Grid**: Shows FPS, frame time, and memory usage alongside existing stats
2. **Toggleable Panels**: Performance visualization and benchmark mode can be shown/hidden
3. **Performance Controls**: Buttons to show/hide metrics, run benchmarks, reset metrics
4. **Automatic Monitoring**: Performance is monitored automatically when the simulation runs

## Usage Example

```typescript
// In GameOfLifePage.tsx
import { usePerformanceMonitor, PerformanceVisualization, BenchmarkMode } from './performance';

const GameOfLifePage = () => {
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [showBenchmarkMode, setShowBenchmarkMode] = useState(false);
  
  const { metrics, reset: resetPerformance } = usePerformanceMonitor({
    enabled: true,
    warningThresholds: {
      lowFps: 30,
      highFrameTime: 33,
      highMemoryUsage: 80,
    },
  });
  
  return (
    <div>
      {/* Performance controls */}
      <button onClick={() => setShowPerformancePanel(!showPerformancePanel)}>
        {showPerformancePanel ? 'Hide Metrics' : 'Show Metrics'}
      </button>
      
      <button onClick={() => setShowBenchmarkMode(!showBenchmarkMode)}>
        {showBenchmarkMode ? 'Hide Benchmark' : 'Benchmark Mode'}
      </button>
      
      <button onClick={resetPerformance}>
        Reset Metrics
      </button>
      
      {/* Enhanced stats */}
      <div className="stats-grid">
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
      
      {/* Performance panels */}
      {showPerformancePanel && (
        <PerformanceVisualization metrics={metrics} />
      )}
      
      {showBenchmarkMode && (
        <BenchmarkMode
          currentSettings={currentSettings}
          onBenchmarkComplete={handleBenchmarkComplete}
        />
      )}
    </div>
  );
};
```

## Performance Considerations

1. **Overhead**: The performance monitor adds minimal overhead (typically <1% CPU)
2. **Memory**: Uses minimal memory for frame time history
3. **Browser APIs**: Leverages native browser APIs for accurate measurements
4. **Toggleable**: Can be disabled when not needed to reduce overhead

## Testing

Run performance monitor tests:

```bash
npm test -- --testPathPattern=performance-monitor
```

## Future Enhancements

1. **GPU Memory Monitoring**: Add WebGPU memory usage tracking
2. **Network Performance**: Monitor asset loading times
3. **Custom Metrics**: Allow custom performance metrics
4. **Historical Data**: Store and visualize performance history over time
5. **Export Formats**: Support CSV and other export formats