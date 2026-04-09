import { render, screen } from '../../tests/test-utils';
import Header from '../Header';

describe('Header', () => {
  it('renders the logo and navigation links', () => {
    render(<Header />);
    
    // Check logo
    expect(screen.getByText('Browser Experiments')).toBeInTheDocument();
    
    // Check navigation links
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Game of Life' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'GitHub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WebGPU Docs' })).toBeInTheDocument();
  });

  it('has correct href attributes for external links', () => {
    render(<Header />);
    
    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/yourusername/browser_experiments');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    
    const webgpuLink = screen.getByRole('link', { name: 'WebGPU Docs' });
    expect(webgpuLink).toHaveAttribute('href', 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API');
    expect(webgpuLink).toHaveAttribute('target', '_blank');
    expect(webgpuLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});