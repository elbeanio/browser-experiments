// Conway's Game of Life simulation (CPU-based, naive implementation)

export interface GameOfLifeOptions {
  width: number;
  height: number;
  initialDensity?: number; // 0 to 1
  wrapEdges?: boolean;
}

export interface GameOfLifeState {
  grid: Uint8Array;
  width: number;
  height: number;
  generation: number;
  isRunning: boolean;
  wrapEdges: boolean;
}

export class GameOfLife {
  private state: GameOfLifeState;
  private currentGrid: Uint8Array;
  private nextGrid: Uint8Array;

  constructor(options: GameOfLifeOptions) {
    const {
      width,
      height,
      initialDensity = 0.3,
      wrapEdges = true,
    } = options;

    if (width <= 0 || height <= 0) {
      throw new Error(`Grid dimensions must be positive, got ${width}x${height}`);
    }

    if (initialDensity < 0 || initialDensity > 1) {
      throw new Error(`Initial density must be between 0 and 1, got ${initialDensity}`);
    }

    const gridSize = width * height;
    this.currentGrid = new Uint8Array(gridSize);
    this.nextGrid = new Uint8Array(gridSize);

    this.state = {
      grid: this.currentGrid,
      width,
      height,
      generation: 0,
      isRunning: false,
      wrapEdges,
    };

    this.randomize(initialDensity);
  }

  /**
   * Get current simulation state
   */
  getState(): GameOfLifeState {
    return { ...this.state };
  }

  /**
   * Randomize the grid with given density
   */
  randomize(density: number = 0.3): void {
    const { width, height } = this.state;
    const gridSize = width * height;

    for (let i = 0; i < gridSize; i++) {
      this.currentGrid[i] = Math.random() < density ? 1 : 0;
    }

    this.state.generation = 0;
    this.state.grid = this.currentGrid;
  }

  /**
   * Clear the grid (all cells dead)
   */
  clear(): void {
    this.currentGrid.fill(0);
    this.state.generation = 0;
    this.state.grid = this.currentGrid;
  }

  /**
   * Set a specific cell state
   */
  setCell(x: number, y: number, alive: boolean): void {
    const { width, height } = this.state;
    
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }

    const index = y * width + x;
    this.currentGrid[index] = alive ? 1 : 0;
    this.state.grid = this.currentGrid;
  }

  /**
   * Toggle a cell state
   */
  toggleCell(x: number, y: number): void {
    const { width, height } = this.state;
    
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return;
    }

    const index = y * width + x;
    this.currentGrid[index] = this.currentGrid[index] ? 0 : 1;
    this.state.grid = this.currentGrid;
  }

  /**
   * Get cell state
   */
  getCell(x: number, y: number): boolean {
    const { width, height, wrapEdges } = this.state;
    
    if (wrapEdges) {
      x = (x + width) % width;
      y = (y + height) % height;
    } else if (x < 0 || x >= width || y < 0 || y >= height) {
      return false;
    }

    const index = y * width + x;
    return this.currentGrid[index] === 1;
  }

  /**
   * Count live neighbors for a cell
   */
  private countNeighbors(x: number, y: number): number {
    const { width, height, wrapEdges } = this.state;
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        let nx = x + dx;
        let ny = y + dy;

        if (wrapEdges) {
          nx = (nx + width) % width;
          ny = (ny + height) % height;
        } else if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
          continue;
        }

        if (this.getCell(nx, ny)) {
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Compute next generation
   */
  step(): void {
    const { width, height } = this.state;

    // Compute next generation
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const alive = this.currentGrid[index] === 1;
        const neighbors = this.countNeighbors(x, y);

        // Conway's Game of Life rules:
        // 1. Any live cell with 2 or 3 live neighbors survives
        // 2. Any dead cell with exactly 3 live neighbors becomes alive
        // 3. All other cells die or stay dead
        if (alive && (neighbors === 2 || neighbors === 3)) {
          this.nextGrid[index] = 1;
        } else if (!alive && neighbors === 3) {
          this.nextGrid[index] = 1;
        } else {
          this.nextGrid[index] = 0;
        }
      }
    }

    // Swap grids
    [this.currentGrid, this.nextGrid] = [this.nextGrid, this.currentGrid];
    
    // Update state
    this.state.generation++;
    this.state.grid = this.currentGrid;
  }

  /**
   * Start/stop simulation
   */
  setRunning(running: boolean): void {
    this.state.isRunning = running;
  }

  /**
   * Get grid as 2D array for debugging
   */
  getGrid2D(): number[][] {
    const { width, height } = this.state;
    const result: number[][] = [];

    for (let y = 0; y < height; y++) {
      const row: number[] = [];
      for (let x = 0; x < width; x++) {
        row.push(this.currentGrid[y * width + x]);
      }
      result.push(row);
    }

    return result;
  }

  /**
   * Get grid statistics
   */
  getStats(): {
    alive: number;
    dead: number;
    density: number;
    generation: number;
  } {
    const { width, height, generation } = this.state;
    const gridSize = width * height;
    
    let alive = 0;
    for (let i = 0; i < gridSize; i++) {
      if (this.currentGrid[i] === 1) alive++;
    }

    const dead = gridSize - alive;
    const density = alive / gridSize;

    return {
      alive,
      dead,
      density,
      generation,
    };
  }

  /**
   * Create a glider pattern at position
   */
  addGlider(x: number, y: number): void {
    const glider = [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1],
    ];

    this.addPattern(x, y, glider);
  }

  /**
   * Create a blinker pattern at position
   */
  addBlinker(x: number, y: number): void {
    const blinker = [
      [1, 1, 1],
    ];

    this.addPattern(x, y, blinker);
  }

  /**
   * Add any pattern to the grid
   */
  addPattern(x: number, y: number, pattern: number[][]): void {
    for (let py = 0; py < pattern.length; py++) {
      for (let px = 0; px < pattern[py].length; px++) {
        if (pattern[py][px]) {
          this.setCell(x + px, y + py, true);
        }
      }
    }
  }
}