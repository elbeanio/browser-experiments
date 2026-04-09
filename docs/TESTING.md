# Testing Infrastructure for Browser Experiments

This document outlines the testing setup and patterns for the browser experiments showcase project.

## Overview

The project uses **Vitest** as the test runner with **Testing Library** for React component testing. Tests are organized within the `apps/showcase/` directory structure.

## Test Structure

```
browser_experiments/
├── tests/                    # Global test setup
│   └── setup.ts             # Test configuration and mocks
├── apps/showcase/
│   ├── src/
│   │   ├── tests/           # Test utilities
│   │   │   └── test-utils.tsx
│   │   ├── components/
│   │   │   ├── __tests__/   # Component tests
│   │   │   │   └── Component.test.tsx
│   │   │   └── Component.tsx
│   │   └── experiments/
│   │       └── game-of-life/
│   │           ├── simulation/
│   │           │   └── game-of-life.ts
│   │           └── __tests__/
│   │               └── game-of-life.test.ts
└── .github/workflows/
    └── test.yml             # CI/CD test workflow
```

## Running Tests

### Local Development

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### CI/CD Pipeline

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests targeting `main`
- Manual trigger via GitHub Actions

## Test Patterns

### 1. Pure Function/Class Testing (Game of Life Example)

For simulation logic and pure functions:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GameOfLife } from './game-of-life';

describe('GameOfLife', () => {
  let game: GameOfLife;

  beforeEach(() => {
    game = new GameOfLife({ width: 10, height: 10 });
  });

  it('should initialize with correct dimensions', () => {
    const state = game.getState();
    expect(state.width).toBe(10);
    expect(state.height).toBe(10);
  });

  it('should implement Conway\'s rules correctly', () => {
    // Test specific rules
    game.setCell(1, 1, true);
    game.step();
    expect(game.getCell(1, 1)).toBe(false); // Underpopulation
  });
});
```

### 2. React Component Testing

For React components with Testing Library:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../tests/test-utils';
import Component from '../Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    render(<Component />);
    const button = screen.getByRole('button', { name: 'Click me' });
    // Test click handlers, etc.
  });
});
```

### 3. Test Utilities

Custom test utilities are available in `apps/showcase/src/tests/test-utils.tsx`:

```typescript
import { render } from './test-utils';

// Custom render with providers (Router, etc.)
render(<Component />);
```

## Mocking

### Browser APIs

Common browser APIs are mocked in `tests/setup.ts`:
- `ResizeObserver`
- `matchMedia`
- `requestAnimationFrame`

### Custom Mocks

Create mocks in test files when needed:

```typescript
// Mock a module
vi.mock('../some-module', () => ({
  default: vi.fn(() => 'mocked value'),
}));

// Mock a function
const mockFn = vi.fn();
```

## Test Coverage

Coverage reports are generated with `pnpm test:coverage`. Coverage configuration is in `vitest.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/test-utils/**'],
}
```

## Adding Tests for New Experiments

### 1. Create Test Directory

```bash
mkdir -p apps/showcase/src/experiments/new-experiment/__tests__
```

### 2. Write Simulation Tests

For the core logic (similar to Game of Life):

```typescript
// apps/showcase/src/experiments/new-experiment/__tests__/simulation.test.ts
import { describe, it, expect } from 'vitest';
import { Simulation } from '../simulation/simulation';

describe('Simulation', () => {
  it('should work correctly', () => {
    // Test the simulation logic
  });
});
```

### 3. Write Component Tests

For React components:

```typescript
// apps/showcase/src/experiments/new-experiment/__tests__/Component.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../../tests/test-utils';
import ExperimentComponent from '../components/ExperimentComponent';

describe('ExperimentComponent', () => {
  it('renders the experiment controls', () => {
    render(<ExperimentComponent />);
    // Test component rendering and interactions
  });
});
```

## Best Practices

### 1. Test Organization
- Keep tests close to the code they test
- Use `__tests__` directories for better organization
- Name test files as `*.test.ts` or `*.test.tsx`

### 2. Test Quality
- Test behavior, not implementation
- Use descriptive test names
- One assertion per test case (when possible)
- Use `beforeEach` for common setup

### 3. Performance
- Mock expensive operations
- Use `vi.useFakeTimers()` for timer-based tests
- Keep tests focused and fast

### 4. Maintainability
- Update tests when changing functionality
- Remove or update broken tests promptly
- Use TypeScript for type safety in tests

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Ensure test files have correct import paths
   - Check TypeScript configuration

2. **React testing library errors**
   - Make sure components are wrapped with necessary providers
   - Use `screen` queries appropriately

3. **Timing issues**
   - Use `await` for async operations
   - Mock timers with `vi.useFakeTimers()`

4. **Coverage not reporting**
   - Check `vitest.config.ts` coverage settings
   - Ensure tests are actually running

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [GitHub Actions](https://docs.github.com/en/actions)