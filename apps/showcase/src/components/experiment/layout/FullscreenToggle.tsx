import React from 'react';

export interface FullscreenToggleProps {
  isFullscreen: boolean;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

const FullscreenToggle: React.FC<FullscreenToggleProps> = ({
  isFullscreen,
  onToggle,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      className={`button secondary ${isFullscreen ? 'active' : ''} ${className}`}
      onClick={onToggle}
      disabled={disabled}
      title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Enter fullscreen'}
    >
      {isFullscreen ? '⤓' : '⤢'}
    </button>
  );
};

export default FullscreenToggle;
