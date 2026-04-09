import { useState, useEffect, useRef, useCallback } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number; // ms
  frameTimeMin: number;
  frameTimeMax: number;
  frameTimeAvg: number;
  memoryUsage: number | null; // MB
  memoryTotal: number | null; // MB
  memoryUsed: number | null; // MB
  memoryLimit: number | null; // MB
  heapSize: number | null; // MB
  heapUsed: number | null; // MB
  heapLimit: number | null; // MB
  isPerformanceWarning: boolean;
  performanceScore: number; // 0-100
}

export interface PerformanceMonitorOptions {
  enabled?: boolean;
  updateInterval?: number; // ms
  frameTimeHistorySize?: number;
  warningThresholds?: {
    lowFps?: number;
    highFrameTime?: number;
    highMemoryUsage?: number; // percentage
  };
}

const DEFAULT_OPTIONS: Required<PerformanceMonitorOptions> = {
  enabled: true,
  updateInterval: 1000,
  frameTimeHistorySize: 60,
  warningThresholds: {
    lowFps: 30,
    highFrameTime: 33, // 30fps = 33ms per frame
    highMemoryUsage: 80, // percentage
  },
};

export const usePerformanceMonitor = (options: PerformanceMonitorOptions = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    frameTimeMin: 0,
    frameTimeMax: 0,
    frameTimeAvg: 0,
    memoryUsage: null,
    memoryTotal: null,
    memoryUsed: null,
    memoryLimit: null,
    heapSize: null,
    heapUsed: null,
    heapLimit: null,
    isPerformanceWarning: false,
    performanceScore: 100,
  });

  const frameCountRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const memoryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calculate performance score (0-100)
  const calculatePerformanceScore = useCallback((currentMetrics: Partial<PerformanceMetrics>): number => {
    let score = 100;

    // Deduct for low FPS
    if (currentMetrics.fps !== undefined && opts.warningThresholds.lowFps) {
      if (currentMetrics.fps < opts.warningThresholds.lowFps) {
        const fpsPenalty = Math.min(50, (opts.warningThresholds.lowFps - currentMetrics.fps) * 2);
        score -= fpsPenalty;
      }
    }

    // Deduct for high frame time
    if (currentMetrics.frameTimeAvg !== undefined && opts.warningThresholds.highFrameTime) {
      if (currentMetrics.frameTimeAvg > opts.warningThresholds.highFrameTime) {
        const frameTimePenalty = Math.min(30, (currentMetrics.frameTimeAvg - opts.warningThresholds.highFrameTime));
        score -= frameTimePenalty;
      }
    }

    // Deduct for high memory usage
    if (currentMetrics.memoryUsage !== undefined && currentMetrics.memoryUsage !== null && opts.warningThresholds.highMemoryUsage) {
      if (currentMetrics.memoryUsage > opts.warningThresholds.highMemoryUsage) {
        const memoryPenalty = Math.min(20, (currentMetrics.memoryUsage - opts.warningThresholds.highMemoryUsage));
        score -= memoryPenalty;
      }
    }

    return Math.max(0, Math.round(score));
  }, [opts.warningThresholds]);

  // Check for performance warnings
  const checkPerformanceWarnings = useCallback((currentMetrics: Partial<PerformanceMetrics>): boolean => {
    const warnings = [];

    if (currentMetrics.fps !== undefined && opts.warningThresholds.lowFps && currentMetrics.fps < opts.warningThresholds.lowFps) {
      warnings.push(`Low FPS: ${currentMetrics.fps} < ${opts.warningThresholds.lowFps}`);
    }

    if (currentMetrics.frameTimeAvg !== undefined && opts.warningThresholds.highFrameTime && currentMetrics.frameTimeAvg > opts.warningThresholds.highFrameTime) {
      warnings.push(`High frame time: ${currentMetrics.frameTimeAvg.toFixed(1)}ms > ${opts.warningThresholds.highFrameTime}ms`);
    }

    if (currentMetrics.memoryUsage !== undefined && currentMetrics.memoryUsage !== null && opts.warningThresholds.highMemoryUsage && currentMetrics.memoryUsage > opts.warningThresholds.highMemoryUsage) {
      warnings.push(`High memory usage: ${currentMetrics.memoryUsage.toFixed(1)}% > ${opts.warningThresholds.highMemoryUsage}%`);
    }

    return warnings.length > 0;
  }, [opts.warningThresholds]);

  // Get memory metrics from browser APIs
  const getMemoryMetrics = useCallback((): Partial<PerformanceMetrics> => {
    const metrics: Partial<PerformanceMetrics> = {};

    // Try to get memory info from performance.memory (Chrome/Edge only)
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory?: MemoryInfo }).memory;
      if (memory) {
        metrics.memoryUsed = Math.round(memory.usedJSHeapSize / (1024 * 1024) * 100) / 100; // MB
        metrics.memoryTotal = Math.round(memory.totalJSHeapSize / (1024 * 1024) * 100) / 100; // MB
        metrics.memoryLimit = Math.round(memory.jsHeapSizeLimit / (1024 * 1024) * 100) / 100; // MB
      }
      
      if (metrics.memoryTotal && metrics.memoryUsed) {
        metrics.memoryUsage = Math.round((metrics.memoryUsed / metrics.memoryTotal) * 1000) / 10; // percentage
      }
    }

    // Try to get heap size from performance.measureUserAgentSpecificMemory (experimental)
    if ('measureUserAgentSpecificMemory' in performance) {
      // This is async and requires user permission, so we'll just note it's available
      metrics.heapSize = null; // Would need async call
      metrics.heapUsed = null;
      metrics.heapLimit = null;
    }

    return metrics;
  }, []);

  // Frame timing callback
  const frameCallback = useCallback((timestamp: number) => {
    if (lastFrameTimeRef.current > 0) {
      const frameTime = timestamp - lastFrameTimeRef.current;
      
      // Add to history
      frameTimesRef.current.push(frameTime);
      if (frameTimesRef.current.length > opts.frameTimeHistorySize) {
        frameTimesRef.current.shift();
      }

      // Update frame count for FPS calculation
      frameCountRef.current++;
    }
    
    lastFrameTimeRef.current = timestamp;
    
    // Continue animation loop
    if (opts.enabled) {
      animationFrameRef.current = requestAnimationFrame(frameCallback);
    }
  }, [opts.enabled, opts.frameTimeHistorySize]);

  // Update metrics periodically
  const updateMetrics = useCallback(() => {
    const now = performance.now();
    
    // Calculate FPS
    if (now - lastUpdateRef.current >= opts.updateInterval) {
      const elapsed = now - lastUpdateRef.current;
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);
      
      // Calculate frame time statistics
      let frameTime = 0;
      let frameTimeMin = 0;
      let frameTimeMax = 0;
      let frameTimeAvg = 0;
      
      if (frameTimesRef.current.length > 0) {
        frameTime = frameTimesRef.current[frameTimesRef.current.length - 1] || 0;
        frameTimeMin = Math.min(...frameTimesRef.current);
        frameTimeMax = Math.max(...frameTimesRef.current);
        frameTimeAvg = frameTimesRef.current.reduce((sum, ft) => sum + ft, 0) / frameTimesRef.current.length;
      }

      // Get memory metrics
      const memoryMetrics = getMemoryMetrics();

      // Calculate performance score
      const currentMetrics = {
        fps,
        frameTime,
        frameTimeMin,
        frameTimeMax,
        frameTimeAvg,
        ...memoryMetrics,
      };

      const performanceScore = calculatePerformanceScore(currentMetrics);
      const isPerformanceWarning = checkPerformanceWarnings(currentMetrics);

      // Update state
      setMetrics(prev => ({
        ...prev,
        fps,
        frameTime,
        frameTimeMin,
        frameTimeMax,
        frameTimeAvg,
        ...memoryMetrics,
        performanceScore,
        isPerformanceWarning,
      }));

      // Reset counters
      frameCountRef.current = 0;
      lastUpdateRef.current = now;
    }
  }, [opts.updateInterval, getMemoryMetrics, calculatePerformanceScore, checkPerformanceWarnings]);

  // Start/stop monitoring
  useEffect(() => {
    if (!opts.enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
        memoryIntervalRef.current = null;
      }
      return;
    }

    // Initialize
    lastUpdateRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();
    frameTimesRef.current = [];
    frameCountRef.current = 0;

    // Start frame timing
    animationFrameRef.current = requestAnimationFrame(frameCallback);

    // Start periodic updates
    const updateInterval = Math.max(100, opts.updateInterval);
    memoryIntervalRef.current = setInterval(updateMetrics, updateInterval);

    // Initial update
    updateMetrics();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (memoryIntervalRef.current) {
        clearInterval(memoryIntervalRef.current);
        memoryIntervalRef.current = null;
      }
    };
  }, [opts.enabled, opts.updateInterval, frameCallback, updateMetrics]);

  // Reset metrics
  const reset = useCallback(() => {
    frameTimesRef.current = [];
    frameCountRef.current = 0;
    lastUpdateRef.current = performance.now();
    lastFrameTimeRef.current = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      fps: 0,
      frameTime: 0,
      frameTimeMin: 0,
      frameTimeMax: 0,
      frameTimeAvg: 0,
      performanceScore: 100,
      isPerformanceWarning: false,
    }));
  }, []);

  // Start benchmarking mode
  const startBenchmark = useCallback((duration: number = 10000): Promise<PerformanceMetrics> => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const benchmarkMetrics: PerformanceMetrics[] = [];
      
      const benchmarkInterval = setInterval(() => {
        updateMetrics();
        benchmarkMetrics.push({ ...metrics });
        
        if (performance.now() - startTime >= duration) {
          clearInterval(benchmarkInterval);
          
          // Calculate average metrics
          const avgMetrics: PerformanceMetrics = benchmarkMetrics.reduce((acc, curr) => ({
            fps: acc.fps + curr.fps,
            frameTime: acc.frameTime + curr.frameTime,
            frameTimeMin: Math.min(acc.frameTimeMin, curr.frameTimeMin),
            frameTimeMax: Math.max(acc.frameTimeMax, curr.frameTimeMax),
            frameTimeAvg: acc.frameTimeAvg + curr.frameTimeAvg,
            memoryUsage: acc.memoryUsage !== null && curr.memoryUsage !== null ? acc.memoryUsage + curr.memoryUsage : null,
            memoryTotal: acc.memoryTotal !== null && curr.memoryTotal !== null ? acc.memoryTotal + curr.memoryTotal : null,
            memoryUsed: acc.memoryUsed !== null && curr.memoryUsed !== null ? acc.memoryUsed + curr.memoryUsed : null,
            memoryLimit: acc.memoryLimit !== null && curr.memoryLimit !== null ? acc.memoryLimit + curr.memoryLimit : null,
            heapSize: acc.heapSize !== null && curr.heapSize !== null ? acc.heapSize + curr.heapSize : null,
            heapUsed: acc.heapUsed !== null && curr.heapUsed !== null ? acc.heapUsed + curr.heapUsed : null,
            heapLimit: acc.heapLimit !== null && curr.heapLimit !== null ? acc.heapLimit + curr.heapLimit : null,
            isPerformanceWarning: acc.isPerformanceWarning || curr.isPerformanceWarning,
            performanceScore: acc.performanceScore + curr.performanceScore,
          }), {
            fps: 0,
            frameTime: 0,
            frameTimeMin: Infinity,
            frameTimeMax: 0,
            frameTimeAvg: 0,
            memoryUsage: null,
            memoryTotal: null,
            memoryUsed: null,
            memoryLimit: null,
            heapSize: null,
            heapUsed: null,
            heapLimit: null,
            isPerformanceWarning: false,
            performanceScore: 0,
          });
          
          const count = benchmarkMetrics.length;
          const result: PerformanceMetrics = {
            fps: Math.round(avgMetrics.fps / count),
            frameTime: Math.round((avgMetrics.frameTime / count) * 100) / 100,
            frameTimeMin: avgMetrics.frameTimeMin === Infinity ? 0 : avgMetrics.frameTimeMin,
            frameTimeMax: avgMetrics.frameTimeMax,
            frameTimeAvg: Math.round((avgMetrics.frameTimeAvg / count) * 100) / 100,
            memoryUsage: avgMetrics.memoryUsage !== null ? Math.round((avgMetrics.memoryUsage / count) * 10) / 10 : null,
            memoryTotal: avgMetrics.memoryTotal !== null ? Math.round((avgMetrics.memoryTotal / count) * 100) / 100 : null,
            memoryUsed: avgMetrics.memoryUsed !== null ? Math.round((avgMetrics.memoryUsed / count) * 100) / 100 : null,
            memoryLimit: avgMetrics.memoryLimit !== null ? Math.round((avgMetrics.memoryLimit / count) * 100) / 100 : null,
            heapSize: avgMetrics.heapSize !== null ? Math.round((avgMetrics.heapSize / count) * 100) / 100 : null,
            heapUsed: avgMetrics.heapUsed !== null ? Math.round((avgMetrics.heapUsed / count) * 100) / 100 : null,
            heapLimit: avgMetrics.heapLimit !== null ? Math.round((avgMetrics.heapLimit / count) * 100) / 100 : null,
            isPerformanceWarning: avgMetrics.isPerformanceWarning,
            performanceScore: Math.round(avgMetrics.performanceScore / count),
          };
          
          resolve(result);
        }
      }, opts.updateInterval);
    });
  }, [metrics, opts.updateInterval, updateMetrics]);

  return {
    metrics,
    reset,
    startBenchmark,
    isSupported: 'performance' in window,
    memorySupported: 'memory' in performance,
  };
};