import React from 'react';

export interface ToolSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
  compact?: boolean;
}

const ToolSlider: React.FC<ToolSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
  formatValue = (val) => val.toString(),
  className = '',
  compact = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <div className={`slider-group ${compact ? 'compact' : ''} ${className}`}>
      <label htmlFor={`slider-${label.replace(/\s+/g, '-').toLowerCase()}`}>
        {label}: {formatValue(value)}
      </label>
      <input
        type="range"
        id={`slider-${label.replace(/\s+/g, '-').toLowerCase()}`}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
};

export default ToolSlider;
