import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { experiments } from '../types';

const ExperimentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const experiment = experiments.find(exp => exp.id === id);
  
  if (!experiment) {
    return (
      <div className="container text-center mt-4">
        <h1>Experiment Not Found</h1>
        <p className="text-muted mt-2">The experiment you're looking for doesn't exist.</p>
        <Link to="/" className="mt-3 inline-block">Return to Home</Link>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className="experiment-detail">
        <div className="experiment-detail-header">
          <div className="experiment-card-title">
            <h1>{experiment.name}</h1>
            <span className={`status-badge status-${experiment.status}`}>
              {experiment.status}
            </span>
          </div>
          <p className="hero-subtitle">{experiment.tagline}</p>
          
          <div className="experiment-meta mt-2">
            <span className="text-muted">Complexity: {experiment.complexity}</span>
            <span className="text-muted">Last updated: {experiment.lastUpdated}</span>
          </div>
        </div>
        
        <div className="experiment-content">
          <section className="experiment-section">
            <h2>Overview</h2>
            <p>{experiment.details.overview}</p>
          </section>
          
          <section className="experiment-section">
            <h2>Implementation Details</h2>
            <ul>
              {experiment.details.implementation.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
          
          <section className="experiment-section">
            <h2>Performance Characteristics</h2>
            <ul>
              {experiment.details.performance.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
          
          <section className="experiment-section">
            <h2>Optimization Roadmap</h2>
            <ul>
              {experiment.details.optimization.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
          
          <section className="experiment-section">
            <h2>Browser Support</h2>
            <ul>
              {experiment.details.browserSupport.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
          
          <section className="experiment-section">
            <h2>WebGPU Features Used</h2>
            <ul>
              {experiment.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </section>
        </div>
        
        <div className="experiment-actions">
          <Link to="/" className="experiment-link">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Experiments
          </Link>
          
          {experiment.status === 'completed' && (
            <a 
              href={`/apps/${experiment.id}/`} 
              className="experiment-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Run Experiment
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
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExperimentPage;