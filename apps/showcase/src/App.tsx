import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import GameOfLifePage from './pages/GameOfLifePage';
import './App.css';

function App() {
  // GitHub Pages deployment base path
  const basename = import.meta.env.PROD ? '/browser-experiments' : '/';

  return (
    <BrowserRouter basename={basename}>
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/experiments/game-of-life" element={<GameOfLifePage />} />
            <Route
              path="*"
              element={
                <div className="container text-center mt-4">
                  <h1>404 - Page Not Found</h1>
                  <p className="text-muted mt-2">
                    The page you&apos;re looking for doesn&apos;t exist.
                  </p>
                  <Link to="/" className="mt-3 inline-block">
                    Return to Home
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
