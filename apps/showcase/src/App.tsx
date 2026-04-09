import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import GameOfLifePage from './pages/GameOfLifePage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/experiments/game-of-life" element={<GameOfLifePage />} />
            <Route path="*" element={
              <div className="container text-center mt-4">
                <h1>404 - Page Not Found</h1>
                <p className="text-muted mt-2">The page you're looking for doesn't exist.</p>
                <Link to="/" className="mt-3 inline-block">Return to Home</Link>
              </div>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;