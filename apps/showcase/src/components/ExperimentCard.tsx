import React from 'react';
import { Link } from 'react-router-dom';
import { Experiment } from '../types';

interface ExperimentCardProps {
  experiment: Experiment;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({ experiment }) => {
  return (
    <div className="experiment-card">
      <div className="experiment-card-header">
        <div className="experiment-card-title">
          <h3>{experiment.name}</h3>
          <span className={`status-badge status-${experiment.status}`}>
            {experiment.status}
          </span>
        </div>
        <p className="text-muted">{experiment.tagline}</p>
      </div>
      
      <div className="experiment-card-body">
        <p className="experiment-card-description">
          {experiment.description}
        </p>
        
        <div className="experiment-card-features">
          <h4>WebGPU Features</h4>
          <ul>
            {experiment.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="experiment-card-footer">
        <div className="experiment-meta">
          <span className="text-muted">Complexity: {experiment.complexity}</span>
          <span className="text-muted">Last updated: {experiment.lastUpdated}</span>
        </div>
        
        <Link to={`/experiment/${experiment.id}`} className="experiment-link">
          View Experiment
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default ExperimentCard;