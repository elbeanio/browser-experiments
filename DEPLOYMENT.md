# Deployment Guide

## Static Site Deployment Options

This project builds to a static site that can be deployed to various platforms:

### GitHub Pages (Free)
1. **Build the site:**
   ```bash
   pnpm build
   ```

2. **Deploy from `apps/showcase/dist/` directory:**
   - Push to `gh-pages` branch
   - Use GitHub Actions for automatic deployment
   - Configure in repository Settings → Pages

3. **GitHub Actions workflow example:**
   ```yaml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm install -g pnpm
         - run: pnpm install
         - run: pnpm build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./apps/showcase/dist
   ```

### Cloudflare Pages (Free)
1. **Build command:**
   ```
   pnpm build
   ```

2. **Build output directory:**
   ```
   apps/showcase/dist
   ```

3. **Environment variables:** None required

4. **Framework preset:** Vite

### Netlify (Free)
1. **Build command:**
   ```
   pnpm build
   ```

2. **Publish directory:**
   ```
   apps/showcase/dist
   ```

3. **Environment variables:**
   ```
   NODE_VERSION = 20
   ```

### Vercel (Free)
1. **Framework preset:** Vite
2. **Build command:** `pnpm build`
3. **Output directory:** `apps/showcase/dist`
4. **Install command:** `pnpm install`

## Local Development

### Development Server
```bash
pnpm dev
```
- Runs on http://localhost:5173 (avoids conflict with beads UI on 3000)
- Hot reload enabled
- WebGPU requires secure context (localhost works)

### Production Build
```bash
pnpm build
```
- Outputs to `apps/showcase/dist/`
- Optimized for production
- Static files only

### Preview Production Build
```bash
pnpm preview
```
- Serves production build locally
- Useful for testing before deployment

## WebGPU Requirements

### Browser Support
- **Chrome**: 113+ (Windows, macOS, Linux)
- **Edge**: 113+ (Windows, macOS)
- **Firefox**: 121+ (Windows, macOS, Linux)
- **Safari**: 17.4+ (macOS, iOS)

### Secure Context Required
- HTTPS (production)
- Localhost (development)
- Cannot run from `file://` protocol

### Testing WebGPU Support
The site includes error handling for WebGPU:
- Shows friendly error message if WebGPU not supported
- Provides browser compatibility information
- Suggests alternatives if needed

## Project Structure for Deployment

```
browser_experiments/
├── apps/showcase/dist/          # Built static site (deploy this)
│   ├── index.html              # Main entry point
│   ├── assets/                 # Compiled JS/CSS
│   └── *                       # Other static assets
├── apps/showcase/              # Source code
└── *                           # Development files
```

## Custom Domain Setup

### GitHub Pages
1. Add CNAME file to `apps/showcase/dist/` with domain name
2. Configure DNS: A records to GitHub IPs
3. Wait for SSL certificate (automatic)

### Cloudflare Pages
1. Add custom domain in Cloudflare dashboard
2. Update DNS records as instructed
3. SSL is automatic

## Performance Optimization

### Built-in Optimizations
- **Code splitting**: Automatic by Vite
- **Tree shaking**: Unused code removed
- **Minification**: JS and CSS minified
- **Compression**: Gzip/Brotli support
- **Caching**: Static assets cacheable

### Manual Optimizations
1. **Image optimization**: Convert to WebP format
2. **Font loading**: Use `font-display: swap`
3. **Lazy loading**: Images below the fold

## Monitoring

### WebGPU Errors
- Console logs for WebGPU initialization failures
- User-friendly error messages in UI
- Browser compatibility detection

### Performance
- FPS counter in experiments
- Memory usage monitoring (future)
- Frame time tracking (future)

## Troubleshooting

### Common Issues

1. **WebGPU not working in production:**
   - Ensure HTTPS is enabled
   - Check browser version compatibility
   - Verify secure context

2. **Build fails:**
   - Check Node.js version (>=20)
   - Run `pnpm install` first
   - Clear node_modules and reinstall

3. **Deployment fails:**
   - Verify build output directory
   - Check file permissions
   - Review deployment platform logs

### Getting Help
- Check browser console for errors
- Review deployment platform documentation
- Test locally with `pnpm preview`