import React, { ReactNode } from 'react';

export interface ToolStripProps {
  children: ReactNode;
  isVisible?: boolean;
  position?: 'right' | 'bottom';
  className?: string;
}

const ToolStrip: React.FC<ToolStripProps> = ({
  children,
  isVisible = true,
  position = 'right',
  className = '',
}) => {
  if (!isVisible) return null;

  const positionClass = position === 'bottom' ? 'toolstrip-bottom' : 'toolstrip-right';

  return (
    <div className={`game-of-life-toolstrip ${positionClass} ${className}`}>
      <div className="toolstrip-content">{children}</div>
    </div>
  );
};

export default ToolStrip;
