import { useState, useCallback } from 'react';

interface UseExperimentStateProps {
  initialSpeed?: number;
  initialGridSize?: number;
  initialCellSize?: number;
}

interface ExperimentState {
  isRunning: boolean;
  isInitialized: boolean;
  error: string | null;
  speed: number;
  gridSize: number;
  cellSize: number;
  generation: number;
  aliveCount: number;
  density: number;
  simulationFps: number;
  showAnalyticsModal: boolean;
  showBenchmarkModal: boolean;
  isFullscreen: boolean;
}

interface ExperimentActions {
  setIsRunning: (running: boolean) => void;
  setIsInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  setSpeed: (speed: number) => void;
  setGridSize: (gridSize: number) => void;
  setCellSize: (cellSize: number) => void;
  setGeneration: (generation: number) => void;
  setAliveCount: (aliveCount: number) => void;
  setDensity: (density: number) => void;
  setSimulationFps: (fps: number) => void;
  toggleAnalyticsModal: () => void;
  toggleBenchmarkModal: () => void;
  toggleFullscreen: () => void;
  handleRun: () => void;
  handleStop: () => void;
  handleTogglePlayPause: () => void;
}

const useExperimentState = ({
  initialSpeed = 30,
  initialGridSize = 256,
  initialCellSize = 1,
}: UseExperimentStateProps = {}): [ExperimentState, ExperimentActions] => {
  const [isRunning, setIsRunning] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(initialSpeed);
  const [gridSize, setGridSize] = useState(initialGridSize);
  const [cellSize, setCellSize] = useState(initialCellSize);
  const [generation, setGeneration] = useState(0);
  const [aliveCount, setAliveCount] = useState(0);
  const [density, setDensity] = useState(0);
  const [simulationFps, setSimulationFps] = useState(0);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleAnalyticsModal = useCallback(() => {
    setShowAnalyticsModal(prev => !prev);
  }, []);

  const toggleBenchmarkModal = useCallback(() => {
    setShowBenchmarkModal(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleRun = useCallback(() => {
    setIsRunning(true);
  }, []);

  const handleStop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleTogglePlayPause = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const state: ExperimentState = {
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
    isFullscreen,
  };

  const actions: ExperimentActions = {
    setIsRunning,
    setIsInitialized,
    setError,
    setSpeed,
    setGridSize,
    setCellSize,
    setGeneration,
    setAliveCount,
    setDensity,
    setSimulationFps,
    toggleAnalyticsModal,
    toggleBenchmarkModal,
    toggleFullscreen,
    handleRun,
    handleStop,
    handleTogglePlayPause,
  };

  return [state, actions];
};

export default useExperimentState;