import React from 'react';

export interface FileSaveLoadProps {
  onSaveInitial: () => void;
  onSaveCurrent: () => void;
  onLoad: () => void;
  disabled?: boolean;
  initialDisabled?: boolean;
  className?: string;
  compact?: boolean;
}

const FileSaveLoad: React.FC<FileSaveLoadProps> = ({
  onSaveInitial,
  onSaveCurrent,
  onLoad,
  disabled = false,
  initialDisabled = false,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`control-group ${compact ? 'compact' : 'compact-patterns'} ${className}`}>
      <div className="button-group compact">
        <button
          className="button small"
          onClick={onSaveInitial}
          disabled={disabled || initialDisabled}
          title="Save initial position to PNG file"
        >
          💾 Initial
        </button>
        <button
          className="button small"
          onClick={onSaveCurrent}
          disabled={disabled}
          title="Save current state to PNG file"
        >
          💾 Current
        </button>
        <button
          className="button small"
          onClick={onLoad}
          disabled={disabled}
          title="Load pattern from PNG file"
        >
          📂 Load
        </button>
      </div>
    </div>
  );
};

export default FileSaveLoad;
