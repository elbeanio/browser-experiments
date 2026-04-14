import React, { ReactNode } from 'react';

export interface ExperimentLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerContent?: ReactNode;
  subNavContent?: ReactNode;
  className?: string;
}

const ExperimentLayout: React.FC<ExperimentLayoutProps> = ({
  title,
  subtitle,
  children,
  headerContent,
  subNavContent,
  className = '',
}) => {
  return (
    <div className={`game-of-life-fullscreen ${className}`}>
      {/* Header with title and optional content */}
      <div className="game-of-life-header">
        <div className="header-title">
          <h1>{title}</h1>
          {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        </div>
        {headerContent && <div className="header-content">{headerContent}</div>}
      </div>

      {/* Sub-nav bar for transport controls and actions */}
      {subNavContent && (
        <div className="sub-nav-bar">
          <div className="sub-nav-content">{subNavContent}</div>
        </div>
      )}

      {/* Main content - typically a canvas */}
      {children}
    </div>
  );
};

export default ExperimentLayout;
