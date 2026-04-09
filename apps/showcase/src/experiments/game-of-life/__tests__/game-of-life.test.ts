import { GameOfLife } from '../simulation/game-of-life';

describe('GameOfLife', () => {
  describe('initialization', () => {
    it('should create a game with valid dimensions', () => {
      const game = new GameOfLife({ width: 10, height: 10 });
      const state = game.getState();
      
      expect(state.width).toBe(10);
      expect(state.height).toBe(10);
      expect(state.generation).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.wrapEdges).toBe(true);
    });

    it('should throw error for invalid dimensions', () => {
      expect(() => new GameOfLife({ width: 0, height: 10 })).toThrow();
      expect(() => new GameOfLife({ width: 10, height: -5 })).toThrow();
    });

    it('should throw error for invalid initial density', () => {
      expect(() => new GameOfLife({ width: 10, height: 10, initialDensity: -0.1 })).toThrow();
      expect(() => new GameOfLife({ width: 10, height: 10, initialDensity: 1.1 })).toThrow();
    });

    it('should accept custom wrapEdges option', () => {
      const game = new GameOfLife({ width: 10, height: 10, wrapEdges: false });
      expect(game.getState().wrapEdges).toBe(false);
    });
  });

  describe('cell operations', () => {
    let game: GameOfLife;

    beforeEach(() => {
      game = new GameOfLife({ width: 5, height: 5 });
      game.clear(); // Start with empty grid
    });

    it('should set and get cell state', () => {
      game.setCell(2, 2, true);
      expect(game.getCell(2, 2)).toBe(true);
      
      game.setCell(2, 2, false);
      expect(game.getCell(2, 2)).toBe(false);
    });

    it('should ignore out of bounds setCell when wrapEdges is false', () => {
      const gameNoWrap = new GameOfLife({ width: 5, height: 5, wrapEdges: false });
      gameNoWrap.clear();
      
      // These should be ignored
      gameNoWrap.setCell(-1, 2, true);
      gameNoWrap.setCell(5, 2, true);
      gameNoWrap.setCell(2, -1, true);
      gameNoWrap.setCell(2, 5, true);
      
      // Grid should still be empty
      const stats = gameNoWrap.getStats();
      expect(stats.alive).toBe(0);
    });

    it('should toggle cell state', () => {
      expect(game.getCell(2, 2)).toBe(false);
      
      game.toggleCell(2, 2);
      expect(game.getCell(2, 2)).toBe(true);
      
      game.toggleCell(2, 2);
      expect(game.getCell(2, 2)).toBe(false);
    });

    it('should wrap cell coordinates when wrapEdges is true', () => {
      const gameWrap = new GameOfLife({ width: 5, height: 5, wrapEdges: true });
      gameWrap.clear();
      
      // Set cell at wrapped position
      gameWrap.setCell(-1, -1, true); // Should wrap to (4, 4)
      expect(gameWrap.getCell(4, 4)).toBe(true);
      
      // Set cell at position beyond width
      gameWrap.setCell(5, 2, true); // Should wrap to (0, 2)
      expect(gameWrap.getCell(0, 2)).toBe(true);
    });
  });

  describe('grid operations', () => {
    let game: GameOfLife;

    beforeEach(() => {
      game = new GameOfLife({ width: 3, height: 3 });
      game.clear();
    });

    it('should clear the grid', () => {
      game.setCell(1, 1, true);
      expect(game.getStats().alive).toBe(1);
      
      game.clear();
      expect(game.getStats().alive).toBe(0);
      expect(game.getState().generation).toBe(0);
    });

    it('should randomize the grid', () => {
      game.randomize(0.5);
      const newStats = game.getStats();
      
      // With 9 cells and 0.5 density, we expect around 4-5 alive cells
      // (allowing for random variation)
      expect(newStats.alive).toBeGreaterThan(0);
      expect(newStats.alive).toBeLessThan(9);
      expect(game.getState().generation).toBe(0);
    });

    it('should get grid as 2D array', () => {
      game.setCell(0, 0, true);
      game.setCell(2, 2, true);
      
      const grid2D = game.getGrid2D();
      
      expect(grid2D).toHaveLength(3);
      expect(grid2D[0]).toHaveLength(3);
      expect(grid2D[0][0]).toBe(1); // (0,0) is alive
      expect(grid2D[2][2]).toBe(1); // (2,2) is alive
      expect(grid2D[1][1]).toBe(0); // (1,1) is dead
    });

    it('should get grid statistics', () => {
      game.setCell(0, 0, true);
      game.setCell(1, 1, true);
      
      const stats = game.getStats();
      
      expect(stats.alive).toBe(2);
      expect(stats.dead).toBe(7); // 9 total cells - 2 alive
      expect(stats.density).toBeCloseTo(2/9);
      expect(stats.generation).toBe(0);
    });
  });

  describe('Game of Life rules', () => {
    it('should implement Conway\'s rules correctly', () => {
      // Test 1: Live cell with 0 neighbors dies (underpopulation)
      const game1 = new GameOfLife({ width: 3, height: 3 });
      game1.clear();
      game1.setCell(1, 1, true);
      
      game1.step();
      expect(game1.getCell(1, 1)).toBe(false);
      expect(game1.getState().generation).toBe(1);

      // Test 2: Live cell with 1 neighbor dies (underpopulation)
      const game2 = new GameOfLife({ width: 3, height: 3 });
      game2.clear();
      game2.setCell(1, 1, true);
      game2.setCell(0, 0, true);
      
      game2.step();
      expect(game2.getCell(1, 1)).toBe(false);

      // Test 3: Live cell with 2 neighbors survives
      const game3 = new GameOfLife({ width: 3, height: 3 });
      game3.clear();
      // Create a blinker pattern (horizontal)
      game3.setCell(0, 1, true);
      game3.setCell(1, 1, true);
      game3.setCell(2, 1, true);
      
      game3.step();
      // Should become vertical blinker
      expect(game3.getCell(1, 0)).toBe(true);
      expect(game3.getCell(1, 1)).toBe(true);
      expect(game3.getCell(1, 2)).toBe(true);

      // Test 4: Live cell with 3 neighbors survives
      const game4 = new GameOfLife({ width: 3, height: 3 });
      game4.clear();
      // Create a block pattern (2x2)
      game4.setCell(0, 0, true);
      game4.setCell(1, 0, true);
      game4.setCell(0, 1, true);
      game4.setCell(1, 1, true);
      
      game4.step();
      // Block should be stable
      expect(game4.getCell(0, 0)).toBe(true);
      expect(game4.getCell(1, 0)).toBe(true);
      expect(game4.getCell(0, 1)).toBe(true);
      expect(game4.getCell(1, 1)).toBe(true);

      // Test 5: Dead cell with exactly 3 neighbors becomes alive (reproduction)
      const game5 = new GameOfLife({ width: 3, height: 3 });
      game5.clear();
      // Create L-shape that should create a new cell
      game5.setCell(0, 0, true);
      game5.setCell(1, 0, true);
      game5.setCell(0, 1, true);
      
      game5.step();
      // Should create a 2x2 block
      expect(game5.getCell(1, 1)).toBe(true); // New cell born
    });

    it('should handle glider pattern correctly', () => {
      const game = new GameOfLife({ width: 10, height: 10 });
      game.clear();
      
      // Add a glider
      game.addGlider(1, 1);
      
      // Verify initial glider pattern (glider at 1,1)
      // Pattern: [[0,1,0], [0,0,1], [1,1,1]]
      // So cells at: (2,1), (3,2), (1,3), (2,3), (3,3)
      expect(game.getCell(2, 1)).toBe(true); // (1,0) in pattern
      expect(game.getCell(3, 2)).toBe(true); // (2,1) in pattern
      expect(game.getCell(1, 3)).toBe(true); // (0,2) in pattern
      expect(game.getCell(2, 3)).toBe(true); // (1,2) in pattern
      expect(game.getCell(3, 3)).toBe(true); // (2,2) in pattern
      
      // Step through a few generations
      game.step();
      expect(game.getState().generation).toBe(1);
      
      game.step();
      expect(game.getState().generation).toBe(2);
      
      // Glider should still exist (moved)
      const finalStats = game.getStats();
      expect(finalStats.alive).toBe(5); // Glider has 5 cells
    });
  });

  describe('pattern operations', () => {
    let game: GameOfLife;

    beforeEach(() => {
      game = new GameOfLife({ width: 10, height: 10 });
      game.clear();
    });

    it('should add glider pattern', () => {
      game.addGlider(2, 2);
      
      // Check glider shape (3x3 pattern starting at 2,2)
      // Pattern: [[0,1,0], [0,0,1], [1,1,1]]
      // So cells at: (3,2), (4,3), (2,4), (3,4), (4,4)
      expect(game.getCell(3, 2)).toBe(true); // (1,0) in pattern
      expect(game.getCell(4, 3)).toBe(true); // (2,1) in pattern
      expect(game.getCell(2, 4)).toBe(true); // (0,2) in pattern
      expect(game.getCell(3, 4)).toBe(true); // (1,2) in pattern
      expect(game.getCell(4, 4)).toBe(true); // (2,2) in pattern
    });

    it('should add blinker pattern', () => {
      game.addBlinker(3, 3);
      
      // Check blinker shape (horizontal line of 3)
      expect(game.getCell(3, 3)).toBe(true);
      expect(game.getCell(4, 3)).toBe(true);
      expect(game.getCell(5, 3)).toBe(true);
    });

    it('should add custom pattern', () => {
      const customPattern = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1],
      ];
      
      game.addPattern(2, 2, customPattern);
      
      // Check custom pattern
      expect(game.getCell(2, 2)).toBe(true); // Top-left
      expect(game.getCell(4, 2)).toBe(true); // Top-right
      expect(game.getCell(3, 3)).toBe(true); // Center
      expect(game.getCell(2, 4)).toBe(true); // Bottom-left
      expect(game.getCell(4, 4)).toBe(true); // Bottom-right
    });
  });

  describe('simulation control', () => {
    it('should start and stop simulation', () => {
      const game = new GameOfLife({ width: 5, height: 5 });
      
      expect(game.getState().isRunning).toBe(false);
      
      game.setRunning(true);
      expect(game.getState().isRunning).toBe(true);
      
      game.setRunning(false);
      expect(game.getState().isRunning).toBe(false);
    });
  });
});