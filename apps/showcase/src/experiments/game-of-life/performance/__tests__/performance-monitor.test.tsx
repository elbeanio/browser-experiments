import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { usePerformanceMonitor } from '../usePerformanceMonitor';

describe('usePerformanceMonitor', () => {
  it('should initialize with default metrics', () => {
    const { result } = renderHook(() => usePerformanceMonitor());
    
    expect(result.current.metrics).toMatchObject({
      fps: 0,
      frameTime: 0,
      frameTimeMin: 0,
      frameTimeMax: 0,
      frameTimeAvg: 0,
      performanceScore: 100,
      isPerformanceWarning: false,
    });
    
    expect(result.current.isSupported).toBe(true);
  });

  it('should provide reset function', () => {
    const { result } = renderHook(() => usePerformanceMonitor());
    
    expect(typeof result.current.reset).toBe('function');
  });

  it('should provide startBenchmark function', () => {
    const { result } = renderHook(() => usePerformanceMonitor());
    
    expect(typeof result.current.startBenchmark).toBe('function');
  });

  it('should handle disabled monitoring', () => {
    const { result } = renderHook(() => 
      usePerformanceMonitor({ enabled: false })
    );
    
    expect(result.current.metrics).toBeDefined();
  });
});