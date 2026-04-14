import React from 'react';

export interface ToolButtonProps {
  icon: React.ReactNode;
  label?: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const ToolButton: React.FC<ToolButtonProps> = ({
  icon,
  label,
  title,
  onClick,
  disabled = false,
  active = false,
  className = '',
  size = 'medium',
}) => {
  const sizeClass = `tool-button-${size}`;
  const activeClass = active ? 'active' : '';

  return (
    <button
      className={`tool-button ${sizeClass} ${activeClass} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {icon}
      {label && <span className="tool-button-label">{label}</span>}
    </button>
  );
};

export default ToolButton;
