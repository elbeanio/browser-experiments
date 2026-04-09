# Browser Experiments

A collection of browser visualization experiments focusing on WebGPU performance optimization.

## For Humans

### Overview

This project explores browser graphics capabilities through a series of experiments, starting with Conway's Game of Life implemented with WebGPU. The goal is to learn WebGPU while building progressively optimized implementations.

### Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Run development server:**

   ```bash
   pnpm dev
   ```
   
   Server runs on http://localhost:5173 (to avoid conflict with beads UI on port 3000)

3. **Build for production:**

   ```bash
   pnpm build
   ```

4. **Preview production build:**

   ```bash
   pnpm preview
   ```

5. **Type checking:**
    ```bash
    pnpm typecheck
    ```

### Project Structure

```
browser_experiments/
├── apps/showcase/              # Single static site with all experiments
│   ├── src/
│   │   ├── components/         # Shared React components
│   │   ├── pages/             # Page components (Home, Experiments)
│   │   ├── experiments/       # Individual experiment implementations
│   │   │   └── game-of-life/  # First experiment
│   │   │       ├── simulation/ # Game logic
│   │   │       └── rendering/  # WebGPU rendering
│   │   └── main.tsx           # Application entry point
│   ├── index.html             # Main HTML file
│   └── vite.config.ts         # Build configuration
├── packages/core/             # Shared WebGPU utilities
└── docs/                      # Documentation
```

### Development Workflow

1. Check `bd ready` for available work
2. Claim an issue with `bd update <id> --claim`
3. Implement the feature
4. Test changes manually (see "Testing" below)
5. Close the issue with `bd close <id>`

### Deployment

This project builds to a static site that can be deployed to:
- GitHub Pages (free)
- Cloudflare Pages (free)
- Netlify (free)
- Vercel (free)

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

### Testing

**Always test changes manually before considering work complete:**

- Run the experiment in browser
- Verify rendering is correct
- Test UI controls work
- Check for performance issues
- Look for visual regressions

## For Agents (AI Assistants)

### Project Structure & Conventions

#### Monorepo Setup

- Uses pnpm workspaces for package management
- Root `package.json` defines workspaces: `['packages/*', 'apps/*']`
- TypeScript with strict mode enabled
- Vite for building and development

#### Package Structure

- `apps/showcase`: Single static site with all experiments
- `packages/core`: Shared WebGPU utilities (available for future use)

#### Directory Structure Rules

- **No generic "utils" directories** - everything must have clear purpose
- Group by domain/feature, not by technical layer
- Use descriptive names: `webgpu/`, `simulation/`, `rendering/`, not `helpers/`

### Technology Stack

#### Core Technologies

- **WebGPU**: Primary rendering API (no fallback for learning)
- **TypeScript**: Strict mode with no explicit `any`
- **React**: For UI only (kept out of render loops)
- **Vite**: Build tool and dev server
- **Vitest**: Unit and integration tests
- **Playwright**: E2E and visual tests (to be added)

#### Key Patterns

1. **Separation of concerns**: React for UI, WebGPU for rendering
2. **Incremental optimization**: Start naive, optimize progressively
3. **Manual testing required**: User must verify changes work
4. **Clear documentation**: Each experiment has README with agent instructions

### Common Tasks & Patterns

#### Creating a New Experiment

1. Create directory in `apps/` with experiment name
2. Add `package.json` with workspace dependencies
3. Implement in phases: naive → optimized
4. Add experiment to showcase home page
5. Create experiment README with agent instructions

#### WebGPU Patterns

- Use `@browser-experiments/core` utilities for device initialization
- Implement error handling for WebGPU failures
- Clean up resources (buffers, textures) when done
- Use compute shaders for parallel processing

#### Testing Strategy

- **Unit tests**: Simulation logic, utility functions
- **Integration tests**: Component interactions
- **Visual tests**: Screenshot comparison (to be implemented)
- **Performance tests**: Frame timing, memory usage

### Performance Optimization Guidelines

#### WebGPU Optimization

1. **Minimize buffer updates**: Update only changed data
2. **Use appropriate buffer types**: Storage vs uniform vs vertex
3. **Optimize workgroup sizes**: Match GPU architecture
4. **Reduce precision where possible**: Use smaller data types
5. **Batch operations**: Minimize draw/compute dispatches

#### Memory Management

- Track WebGPU buffer/texture memory
- Implement object pooling for frequently created resources
- Clean up unused resources promptly
- Monitor JavaScript heap usage

#### Profiling

- Measure frame time (target: 16ms for 60fps)
- Track FPS and frame time variance
- Monitor CPU vs GPU time breakdown
- Log performance metrics for comparison

### Common Issues & Solutions

#### WebGPU Device Creation Fails

- Check browser support (Chrome/Edge 113+, Firefox 121+, Safari 17.4+)
- Verify secure context (HTTPS or localhost)
- Handle fallback or show informative error

#### Performance Issues

1. **High CPU usage**: Move computation to GPU with compute shaders
2. **High GPU time**: Optimize shaders, reduce draw calls
3. **Memory leaks**: Implement proper cleanup in useEffect/unmount
4. **Janky animation**: Use requestAnimationFrame with delta time

#### Visual Artifacts

- Check texture formats and sampling
- Verify shader precision (float vs half-float)
- Validate buffer data layout matches shader expectations
- Test on different GPUs if possible

### Documentation Requirements

#### Documentation Structure
- **Root README** (this file): Project overview and agent guidelines
- **Experiment READMEs**: `apps/[experiment]/README.md` - Specific to each experiment
- **Documentation templates**: `docs/experiment-template.md` - Template for new experiments
- **Agent cheat sheet**: `docs/agent-cheatsheet.md` - Quick reference for agents

#### Experiment README Template
See `docs/experiment-template.md` for complete template. Key sections:
- **Overview**: What the experiment demonstrates
- **Implementation Details**: Architecture, key files, performance
- **For Agents**: Testing strategy, common issues, integration points
- **Usage**: Controls, interaction, statistics
- **Development**: Running locally, building, testing

#### Code Comments

- Document non-obvious WebGPU patterns
- Explain performance-critical sections
- Note browser compatibility considerations
- Reference relevant WebGPU spec sections

### Workflow for Agents

#### Starting a Session
1. **Check available work**: `bd ready --json`
2. **Review project context**: Read this README and relevant experiment READMEs
3. **Claim an issue**: `bd update <id> --claim --json`
4. **Understand dependencies**: Check `bd show <id> --json` for blockers

#### During Implementation
1. **Follow conventions**: Use existing patterns, no generic utils
2. **Separate concerns**: React for UI, WebGPU for rendering
3. **Implement incrementally**: Naive first, optimize later
4. **Add visual feedback**: Console logs, status indicators for LLMs
5. **Test locally**: Build should succeed, type check should pass

#### Before Completion
1. **Manual testing required**: User must verify changes work in browser
2. **Performance check**: Monitor FPS, memory usage
3. **Documentation**: Update READMEs with implementation details
4. **Create follow-up issues**: For optimization phases or discovered work

#### Completing Work
1. **Close issue**: `bd close <id> --reason "description of what was done" --json`
2. **Check for newly unblocked work**: `bd ready --json`
3. **Continue or hand off**: Either claim next issue or provide session summary

#### Creating New Issues
When discovering work during implementation:
```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 1 --deps discovered-from:<parent-id> --json
```

#### Session Completion Protocol
**CRITICAL**: Before ending a session, complete ALL steps:
1. File issues for remaining work
2. Run quality gates (tests, lint, build)
3. Update issue status (close finished work)
4. Push to remote (if git remote configured)
5. Clean up (stop servers, clear caches)
6. Verify all changes are committed AND pushed
7. Provide context for next session

### Important Notes

- **User testing is required**: Never mark work complete without user verification
- **Incremental development**: Build naive first, optimize later
- **Clear naming**: Avoid generic names, be descriptive
- **Performance focus**: Always consider optimization opportunities
- **Documentation**: Update READMEs as implementation evolves
