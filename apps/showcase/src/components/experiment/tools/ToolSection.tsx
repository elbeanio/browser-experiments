import React, { ReactNode } from 'react';

export interface ToolSectionProps {
  label: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

const ToolSection: React.FC<ToolSectionProps> = ({
  label,
  children,
  className = '',
  compact = false,
}) => {
  return (
    <div className={`control-group ${compact ? 'compact' : ''} tool-section ${className}`}>
      <div className="tool-section-label">{label}</div>
      <div className="tool-grid">{children}</div>
    </div>
  );
};

export default ToolSection;
