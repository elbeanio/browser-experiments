import React from 'react';
import { ToolSection, ToolButton } from '..';

interface GameOfLifeToolsProps {
  isInitialized: boolean;
  isRunning: boolean;
  drawMode: 'draw' | 'erase' | null;
  setDrawMode: (mode: 'draw' | 'erase' | null) => void;
  brushSize: 'single' | '3x3' | '5x5';
  setBrushSize: (size: 'single' | '3x3' | '5x5') => void;
  selectedPattern: {
    name: string;
    width: number;
    height: number;
    cells: number[][];
  } | null;
  setSelectedPattern: (pattern: {
    name: string;
    width: number;
    height: number;
    cells: number[][];
  } | null) => void;
  builtInPatterns: Array<{
    name: string;
    width: number;
    height: number;
    cells: number[][];
  }>;
  generateNoise: (type: 'uniform' | 'clustered' | 'sparse' | 'center' | 'edges') => void;
}

const GameOfLifeTools: React.FC<GameOfLifeToolsProps> = ({
  isInitialized,
  isRunning,
  drawMode,
  setDrawMode,
  brushSize,
  setBrushSize,
  selectedPattern,
  setSelectedPattern,
  builtInPatterns,
  generateNoise,
}) => {
  return (
    <>
      {/* Freehand Tools */}
      <ToolSection label="Freehand Tools">
        {/* Row 1: Drawing tools */}
        <ToolButton
          icon="✏️"
          title="Draw cells (click and drag)"
          onClick={() => setDrawMode(drawMode === 'draw' ? null : 'draw')}
          disabled={!isInitialized || isRunning}
          active={drawMode === 'draw'}
        />
        <ToolButton
          icon="🧽"
          title="Erase cells (click and drag)"
          onClick={() => setDrawMode(drawMode === 'erase' ? null : 'erase')}
          disabled={!isInitialized || isRunning}
          active={drawMode === 'erase'}
        />
        <ToolButton
          icon="🧹"
          title="Clear all cells"
          onClick={() => {
            if (window.confirm('Clear the entire grid?')) {
              // Clear logic will be handled by parent
              setDrawMode(null);
              setSelectedPattern(null);
            }
          }}
          disabled={!isInitialized || isRunning}
        />
        <div className="tool-spacer"></div>

        {/* Row 2: Brush sizes */}
        <ToolButton
          icon="•"
          title="Single cell brush"
          onClick={() => setBrushSize('single')}
          disabled={!isInitialized || isRunning || drawMode === null}
          active={brushSize === 'single' && drawMode !== null}
        />
        <ToolButton
          icon="3×3"
          title="3×3 brush"
          onClick={() => setBrushSize('3x3')}
          disabled={!isInitialized || isRunning || drawMode === null}
          active={brushSize === '3x3' && drawMode !== null}
        />
        <ToolButton
          icon="5×5"
          title="5×5 brush"
          onClick={() => setBrushSize('5x5')}
          disabled={!isInitialized || isRunning || drawMode === null}
          active={brushSize === '5x5' && drawMode !== null}
        />
        <div className="tool-spacer"></div>
      </ToolSection>

      {/* Pattern Brushes */}
      <ToolSection label="Pattern Brushes">
        {/* Row 1: Glider, Blinker, Toad, Pulsar */}
        <ToolButton
          icon="🛸"
          title="Glider (3×3)"
          onClick={() => {
            if (selectedPattern?.name === 'Glider') {
              setSelectedPattern(null);
            } else {
              setSelectedPattern(builtInPatterns.find((p) => p.name === 'Glider') || null);
              setDrawMode(null);
            }
          }}
          disabled={!isInitialized || isRunning}
          active={selectedPattern?.name === 'Glider'}
        />
        <ToolButton
          icon="💡"
          title="Blinker (3×1)"
          onClick={() => {
            if (selectedPattern?.name === 'Blinker') {
              setSelectedPattern(null);
            } else {
              setSelectedPattern(builtInPatterns.find((p) => p.name === 'Blinker') || null);
              setDrawMode(null);
            }
          }}
          disabled={!isInitialized || isRunning}
          active={selectedPattern?.name === 'Blinker'}
        />
        <ToolButton
          icon="🐸"
          title="Toad (4×2)"
          onClick={() => {
            if (selectedPattern?.name === 'Toad') {
              setSelectedPattern(null);
            } else {
              setSelectedPattern(builtInPatterns.find((p) => p.name === 'Toad') || null);
              setDrawMode(null);
            }
          }}
          disabled={!isInitialized || isRunning}
          active={selectedPattern?.name === 'Toad'}
        />
        <ToolButton
          icon="💓"
          title="Pulsar (13×13)"
          onClick={() => {
            if (selectedPattern?.name === 'Pulsar') {
              setSelectedPattern(null);
            } else {
              setSelectedPattern(builtInPatterns.find((p) => p.name === 'Pulsar') || null);
              setDrawMode(null);
            }
          }}
          disabled={!isInitialized || isRunning}
          active={selectedPattern?.name === 'Pulsar'}
        />

        {/* Row 2: Beacon and Clear */}
        <ToolButton
          icon="🏮"
          title="Beacon (4×4)"
          onClick={() => {
            if (selectedPattern?.name === 'Beacon') {
              setSelectedPattern(null);
            } else {
              setSelectedPattern(builtInPatterns.find((p) => p.name === 'Beacon') || null);
              setDrawMode(null);
            }
          }}
          disabled={!isInitialized || isRunning}
          active={selectedPattern?.name === 'Beacon'}
        />
        <ToolButton
          icon="🎲"
          title="Random uniform noise (30% density)"
          onClick={() => generateNoise('uniform')}
          disabled={!isInitialized || isRunning}
        />
        <ToolButton
          icon="🎯"
          title="Center-dense noise (higher density in middle)"
          onClick={() => generateNoise('center')}
          disabled={!isInitialized || isRunning}
        />
        <ToolButton
          icon="🏁"
          title="Edge-dense noise (higher density at edges)"
          onClick={() => generateNoise('edges')}
          disabled={!isInitialized || isRunning}
        />
      </ToolSection>

      {/* Noise Generation */}
      <ToolSection label="Noise Generation">
        <ToolButton
          icon="🌌"
          title="Clustered noise (groups of cells)"
          onClick={() => generateNoise('clustered')}
          disabled={!isInitialized || isRunning}
        />
        <ToolButton
          icon="✨"
          title="Sparse noise (10% density)"
          onClick={() => generateNoise('sparse')}
          disabled={!isInitialized || isRunning}
        />
        <div className="tool-spacer"></div>
        <div className="tool-spacer"></div>
      </ToolSection>
    </>
  );
};

export default GameOfLifeTools;