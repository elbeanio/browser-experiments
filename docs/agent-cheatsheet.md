# Agent Cheat Sheet

## Quick Reference

### Beads Commands (Always use --json)
```bash
bd ready --json                    # Find available work
bd show <id> --json               # View issue details
bd update <id> --claim --json     # Claim work
bd close <id> --json              # Complete work
bd create "title" --json          # Create new issue
bd list --status open --json      # List open issues
```

### Project Commands
```bash
pnpm install                      # Install dependencies
pnpm dev                          # Run dev servers
pnpm test                         # Run tests
pnpm typecheck                    # Type checking
pnpm build                        # Build all packages
```

### Directory Structure
```
browser_experiments/
├── packages/                    # Shared libraries
│   ├── core/                   # WebGPU utilities
│   └── ui/                     # React components (placeholder)
├── apps/                       # Experiments
│   ├── showcase/              # Home page (to be built)
│   └── game-of-life/          # First experiment (completed)
├── docs/                       # Documentation
│   ├── experiment-template.md  # Template for new experiments
│   └── agent-cheatsheet.md    # This file
└── tests/                      # Test utilities
```

## Critical Rules

### 1. User Testing Required
- **NEVER** mark work complete without user verification
- Changes must be tested in browser by user
- Performance must be validated (FPS, memory)

### 2. Incremental Development
- Start with naive implementation
- Optimize in subsequent phases
- Each phase should be testable and complete

### 3. No Generic Utils
- Group by domain/feature, not technical layer
- Use descriptive names: `webgpu/`, `simulation/`, `rendering/`
- Avoid: `helpers/`, `utils/`, `common/`

### 4. Separation of Concerns
- React for UI only
- WebGPU for rendering
- Keep render loops out of React components

## Common Patterns

### WebGPU Device Initialization
```typescript
import { createWebGPUDevice } from '@browser-experiments/core';

async function initialize() {
  const device = await createWebGPUDevice();
  // Handle errors: device may be null if WebGPU not supported
}
```

### React + WebGPU Integration
```typescript
// Use refs for canvas, not state
const canvasRef = useRef<HTMLCanvasElement>(null);

// Initialize WebGPU in useEffect
useEffect(() => {
  if (!canvasRef.current) return;
  
  const renderer = new WebGPURenderer({ canvas: canvasRef.current });
  renderer.initialize().then(() => {
    // Start render loop
  });
  
  return () => renderer.dispose();
}, []);
```

### Error Handling
```typescript
try {
  await initializeWebGPU();
} catch (error) {
  if (error instanceof WebGPUError) {
    // Show user-friendly error
  } else {
    // Handle unexpected errors
  }
}
```

## Workflow Checklist

### Starting Work
- [ ] Check `bd ready` for available issues
- [ ] Read experiment README and root README
- [ ] Claim issue with `bd update <id> --claim`
- [ ] Understand dependencies and blockers

### During Implementation
- [ ] Follow existing patterns and conventions
- [ ] Test frequently in browser
- [ ] Add console logs for LLM monitoring
- [ ] Update documentation as needed

### Before Completion
- [ ] User must test changes in browser
- [ ] Verify performance (FPS, memory)
- [ ] Update experiment README
- [ ] Create follow-up issues for optimization

### Completing Work
- [ ] Close issue with `bd close <id>`
- [ ] Check for newly unblocked work
- [ ] Provide session summary

## Issue Types & Priorities

### Issue Types
- `bug`: Something broken
- `feature`: New functionality  
- `task`: Work item (tests, docs, refactoring)
- `epic`: Large feature with subtasks
- `chore`: Maintenance (dependencies, tooling)

### Priorities (0-4)
- `0`: Critical (security, data loss, broken builds)
- `1`: High (major features, important bugs)
- `2`: Medium (default, nice-to-have)
- `3`: Low (polish, optimization)
- `4`: Backlog (future ideas)

## Creating Good Issues

### Title Format
- Start with verb: "Implement", "Fix", "Add", "Create"
- Be specific: "Add FPS counter to Game of Life" not "Add counter"

### Description Template
```
## Goal
What needs to be accomplished

## Implementation Details
- Specific tasks to complete
- Files to modify/create
- Dependencies to consider

## For Agents
- Key patterns to follow
- Testing requirements
- Common pitfalls to avoid

## Testing
- How to verify completion
- What user should test
- Performance expectations
```

### Dependencies
- Use `--deps discovered-from:<id>` for work discovered during implementation
- Use `--deps blocks:<id>` for work that blocks other work

## Performance Guidelines

### WebGPU Optimization
1. **Minimize buffer updates**: Update only changed regions
2. **Batch operations**: Combine draw calls where possible
3. **Use appropriate precision**: f32 vs f16 based on needs
4. **Optimize workgroup sizes**: Match GPU architecture

### Memory Management
- Track WebGPU resource creation
- Implement dispose() methods for cleanup
- Monitor JavaScript heap size
- Use object pooling for frequent allocations

### Profiling
- Measure frame time (target < 16ms for 60fps)
- Track FPS consistency
- Monitor CPU vs GPU utilization
- Log performance metrics for comparison

## Troubleshooting

### WebGPU Not Available
1. Check browser version (Chrome 113+, Firefox 121+, Safari 17.4+)
2. Verify secure context (HTTPS or localhost)
3. Check browser flags (chrome://flags/#enable-unsafe-webgpu)
4. Provide fallback or informative error

### Build Errors
1. Run `pnpm install` to ensure dependencies
2. Check TypeScript errors with `pnpm typecheck`
3. Verify workspace package references
4. Check Vite configuration

### Test Failures
1. Run tests locally to reproduce
2. Check test setup and mocks
3. Verify WebGPU mocking in tests
4. Update tests to match implementation

## Session Completion Protocol

**CRITICAL**: Before ending session, complete ALL:
1. [ ] File issues for remaining work
2. [ ] Run quality gates (tests, lint, build)
3. [ ] Update issue status (close finished work)
4. [ ] Push to remote (if configured)
5. [ ] Clean up (stop servers, clear caches)
6. [ ] Verify all changes committed AND pushed
7. [ ] Provide context for next session