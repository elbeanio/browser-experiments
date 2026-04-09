# [Experiment Name]

## Overview

Brief description of what this experiment demonstrates and the WebGPU concepts it explores.

**Key Features:**
- Feature 1
- Feature 2
- Feature 3

**WebGPU Concepts:**
- Concept 1 (e.g., compute shaders, storage textures)
- Concept 2 (e.g., render pipelines, uniform buffers)
- Concept 3 (e.g., texture sampling, mipmapping)

## Implementation Details

### Architecture

```
[High-level architecture diagram description]
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │   Simulation    │    │   Rendering     │
│   (React)       │◄──►│   (CPU/GPU)     │◄──►│   (WebGPU)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Files

| File | Purpose | Key Components |
|------|---------|----------------|
| `src/simulation/` | Simulation logic | Core algorithms, state management |
| `src/rendering/` | WebGPU rendering | Shaders, pipelines, textures |
| `src/main.ts` | Application entry | UI integration, event handling |
| `index.html` | User interface | Controls, layout, styling |

### Performance Characteristics

#### Current Implementation
- **Frame time**: [X]ms average
- **Memory usage**: [Y]MB typical
- **GPU utilization**: [Z]% average
- **Bottlenecks**: [Identify main bottlenecks]

#### Optimization Opportunities
1. **Phase 1**: [First optimization target]
2. **Phase 2**: [Second optimization target]
3. **Phase 3**: [Third optimization target]

## For Agents

### Testing Strategy

#### Manual Testing (Required)
1. **Run in browser**: `cd apps/[experiment] && npm run dev`
2. **Verify rendering**: Check visual output is correct
3. **Test controls**: All UI controls should work
4. **Performance check**: Monitor FPS, no memory leaks
5. **Error handling**: Test edge cases and error states

#### Automated Testing
- **Unit tests**: `npm test` in experiment directory
- **Type checking**: `npm run typecheck`
- **Build verification**: `npm run build` should succeed

### Common Issues

#### WebGPU-Specific
- **Device creation fails**: Check browser support, secure context
- **Shader compilation errors**: Validate WGSL syntax, check browser console
- **Texture size limits**: Large textures may exceed device limits
- **Buffer alignment**: Ensure buffer sizes are multiples of 4

#### Performance Issues
- **High CPU usage**: Consider moving to compute shaders
- **Memory leaks**: Implement proper cleanup in dispose() methods
- **Janky animation**: Use requestAnimationFrame with delta time
- **Slow texture updates**: Consider partial updates or compression

#### Integration Issues
- **React/WebGPU timing**: Ensure WebGPU initialized before React renders
- **State synchronization**: Keep simulation and rendering states in sync
- **Event handling**: Canvas events may need special handling

### Key Integration Points

#### Using Core Utilities
```typescript
import { createWebGPUDevice, createTexture2D } from '@browser-experiments/core';
```

#### Project Structure
- Follow monorepo conventions (pnpm workspaces)
- Use existing patterns from other experiments
- No generic "utils" directories
- Group by domain/feature

#### Adding to Showcase
1. Update `apps/showcase` to include new experiment
2. Add experiment card with description and link
3. Update navigation if needed

### Development Workflow

#### Starting Development
1. Check `bd ready` for available work
2. Claim issue: `bd update <id> --claim --json`
3. Read this README and experiment-specific documentation
4. Examine existing similar implementations

#### During Implementation
1. **Incremental approach**: Build naive first, optimize later
2. **Visual feedback**: Add console logs for LLM monitoring
3. **Regular testing**: Test in browser frequently
4. **Documentation**: Update README as you go

#### Before Completion
1. **User testing**: Changes must be verified by user
2. **Performance validation**: Check FPS, memory usage
3. **Documentation update**: Ensure README reflects implementation
4. **Create follow-up issues**: For optimization phases

## Usage

### Controls

| Control | Function | Default |
|---------|----------|---------|
| Control 1 | Description | Default value |
| Control 2 | Description | Default value |
| Control 3 | Description | Default value |

### Interaction
- Interaction method 1
- Interaction method 2
- Interaction method 3

### Statistics Display
- Statistic 1: Description
- Statistic 2: Description
- Statistic 3: Description

## Browser Compatibility

- **Chrome**: 113+ (Windows, macOS, Linux)
- **Edge**: 113+ (Windows, macOS)
- **Firefox**: 121+ (Windows, macOS, Linux)
- **Safari**: 17.4+ (macOS, iOS)

**Requirements:**
- Secure context (HTTPS or localhost)
- WebGPU enabled in browser flags (if needed)
- Sufficient GPU memory for textures

## Development

### Running Locally
```bash
cd apps/[experiment-name]
npm run dev
```

### Building
```bash
npm run build
```

### Testing
```bash
npm test              # Run tests
npm run typecheck     # Type checking
```

### Adding Dependencies
```bash
# From project root
pnpm add [package] --filter @browser-experiments/[experiment]
```

## Next Steps

### Optimization Roadmap
1. **Phase 1**: [Description of first optimization]
2. **Phase 2**: [Description of second optimization]
3. **Phase 3**: [Description of third optimization]

### Future Enhancements
- Enhancement 1
- Enhancement 2
- Enhancement 3

## References

- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [WGSL Specification](https://www.w3.org/TR/WGSL/)
- [MDN WebGPU Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)
- [Project Documentation](../README.md)