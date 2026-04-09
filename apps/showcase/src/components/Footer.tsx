const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-links">
            <a 
              href="https://github.com/yourusername/browser_experiments" 
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository
            </a>
            <a 
              href="https://www.w3.org/TR/webgpu/" 
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              WebGPU Specification
            </a>
            <a 
              href="https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API" 
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              MDN Documentation
            </a>
            <a 
              href="https://webgpufundamentals.org/" 
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              WebGPU Fundamentals
            </a>
          </div>
          
          <div className="copyright">
            <p>© {currentYear} Browser Experiments. Built with WebGPU, TypeScript, and React.</p>
            <p className="mt-1">This project is for educational purposes and exploring browser graphics capabilities.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;