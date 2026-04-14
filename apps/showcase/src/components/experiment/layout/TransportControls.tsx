import React from 'react';

export interface TransportControlsProps {
  isRunning: boolean;
  isInitialized: boolean;
  onPlayPause: () => void;
  onStep?: () => void;
  onReset?: () => void;
  showStep?: boolean;
  showReset?: boolean;
  className?: string;
}

const TransportControls: React.FC<TransportControlsProps> = ({
  isRunning,
  isInitialized,
  onPlayPause,
  onStep,
  onReset,
  showStep = true,
  showReset = true,
  className = '',
}) => {
  return (
    <div className={`transport-controls ${className}`}>
      <button
        className="tool-button"
        onClick={onPlayPause}
        disabled={!isInitialized}
        title={isRunning ? 'Pause simulation' : 'Run simulation'}
      >
        {isRunning ? '⏸️' : '▶️'}
      </button>

      {showStep && onStep && (
        <button
          className="tool-button"
          onClick={onStep}
          disabled={!isInitialized || isRunning}
          title="Step one generation"
        >
          ⏭️
        </button>
      )}

      {showReset && onReset && (
        <button
          className="tool-button"
          onClick={onReset}
          disabled={!isInitialized}
          title="Reset to initial state"
        >
          🔄
        </button>
      )}
    </div>
  );
};

export default TransportControls;
