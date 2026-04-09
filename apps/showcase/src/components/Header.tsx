import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <NavLink to="/" className="logo">
            <div className="logo-icon">BE</div>
            <span>Browser Experiments</span>
          </NavLink>
          
          <nav className="nav-links">
            <NavLink 
              to="/" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              Home
            </NavLink>
            <NavLink 
              to="/experiments/game-of-life" 
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              Game of Life
            </NavLink>
            <a 
              href="https://github.com/yourusername/browser_experiments" 
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a 
              href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API" 
              className="nav-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              WebGPU Docs
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;