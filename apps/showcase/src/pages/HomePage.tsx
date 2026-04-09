import { Link } from 'react-router-dom';

const HomePage = () => {
  const experiments = [
    {
      id: 'game-of-life',
      name: 'Conway\'s Game of Life',
      tagline: 'Classic cellular automaton with WebGPU rendering',
      description: 'A naive implementation of Conway\'s Game of Life using CPU simulation and WebGPU rendering. Demonstrates basic WebGPU texture updates and shader-based visualization.',
      status: 'completed' as const,
      complexity: 'beginner' as const,
      features: [
        'Texture-based grid rendering',
        'CPU simulation with WebGPU visualization',
        'Real-time controls and statistics',
        'Multiple color themes'
      ],
    },
    {
      id: 'plasma-effect',
      name: 'Plasma Effect',
      tagline: 'Real-time procedural graphics with compute shaders',
      description: 'A WebGPU compute shader implementation of classic plasma effects, demonstrating real-time procedural graphics and GPU computation.',
      status: 'planned' as const,
      complexity: 'intermediate' as const,
      features: [
        'Compute shader-based plasma generation',
        'Real-time parameter controls',
        'Multiple plasma algorithms',
        'Performance monitoring'
      ],
    },
    {
      id: 'fractal-explorer',
      name: 'Fractal Explorer',
      tagline: 'Interactive Mandelbrot/Julia set visualization',
      description: 'A GPU-accelerated fractal explorer with real-time zoom and pan, demonstrating advanced WebGPU compute shader patterns and interactive visualization.',
      status: 'planned' as const,
      complexity: 'advanced' as const,
      features: [
        'GPU-accelerated fractal computation',
        'Real-time zoom and pan',
        'Multiple fractal types',
        'Color palette customization'
      ],
    },
  ];

  return (
    <div className="container">
      <section className="hero">
        <h1>Browser Experiments</h1>
        <p className="hero-subtitle">
          A collection of WebGPU visualization experiments exploring browser graphics capabilities, 
          performance optimization, and interactive visualization techniques.
        </p>
      </section>
      
      <section className="experiments-section">
        <h2>Completed Experiments</h2>
        <div className="experiments-grid">
          {experiments
            .filter(exp => exp.status === 'completed')
            .map(experiment => (
              <div key={experiment.id} className="experiment-card">
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
                  </div>
                  
                  <Link to={`/experiments/${experiment.id}`} className="experiment-link">
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
            ))}
        </div>
      </section>
      
      <section className="experiments-section mt-4">
        <h2>Planned Experiments</h2>
        <div className="experiments-grid">
          {experiments
            .filter(exp => exp.status === 'planned')
            .map(experiment => (
              <div key={experiment.id} className="experiment-card">
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
                    <h4>Planned Features</h4>
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
                    <span className="text-muted">Status: Coming Soon</span>
                  </div>
                  
                  <button className="experiment-link" disabled>
                    Coming Soon
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
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>
      
      <section className="mt-4 p-4 bg-card rounded-lg">
        <h2>About This Project</h2>
        <p className="mt-2">
          This project explores the capabilities of WebGPU, the next-generation graphics API for the web. 
          Each experiment focuses on different aspects of WebGPU while maintaining a focus on performance 
          optimization and interactive visualization.
        </p>
        <div className="mt-3">
          <h3>Project Goals:</h3>
          <ul className="mt-1">
            <li>Learn WebGPU through incremental, practical implementations</li>
            <li>Explore performance optimization techniques for browser graphics</li>
            <li>Create reusable patterns and utilities for WebGPU development</li>
            <li>Build a comprehensive showcase of browser visualization capabilities</li>
            <li>Provide clear documentation for both humans and AI assistants</li>
          </ul>
        </div>
        <div className="mt-3">
          <h3>Technology Stack:</h3>
          <ul className="mt-1">
            <li><strong>WebGPU</strong>: Primary rendering and compute API</li>
            <li><strong>TypeScript</strong>: Type-safe development with strict mode</li>
            <li><strong>React</strong>: UI framework (kept separate from render loops)</li>
            <li><strong>Vite</strong>: Build tool and development server</li>
            <li><strong>pnpm Workspaces</strong>: Monorepo package management</li>
          </ul>
        </div>
        <div className="mt-3">
          <h3>Browser Compatibility:</h3>
          <ul className="mt-1">
            <li><strong>Chrome</strong>: 113+ (Windows, macOS, Linux)</li>
            <li><strong>Edge</strong>: 113+ (Windows, macOS)</li>
            <li><strong>Firefox</strong>: 121+ (Windows, macOS, Linux)</li>
            <li><strong>Safari</strong>: 17.4+ (macOS, iOS)</li>
            <li><strong>Requirements</strong>: Secure context (HTTPS or localhost)</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default HomePage;