// Test coordinate mapping with pixel centers
function testMapping(gridSize, cellSize, canvasX, canvasY) {
  const canvasWidth = 512;
  const canvasHeight = 512;
  
  // Convert to UV with pixel centers
  const uvX = (canvasX + 0.5) / canvasWidth;
  const uvY = (canvasHeight - canvasY - 0.5) / canvasHeight; // Flip Y
  
  // UV scale
  const uvScaleX = canvasWidth / (gridSize * cellSize);
  const uvScaleY = canvasHeight / (gridSize * cellSize);
  
  // Scaled coordinates
  const scaledX = uvX * uvScaleX;
  const scaledY = uvY * uvScaleY;
  
  // Fractional part (position within tile)
  const fracX = scaledX - Math.floor(scaledX);
  const fracY = scaledY - Math.floor(scaledY);
  
  // Grid coordinates
  const gridX = Math.floor(fracX * gridSize);
  const gridY = gridSize - 1 - Math.floor(fracY * gridSize);
  
  return { uvX, uvY, uvScaleX, uvScaleY, scaledX, scaledY, fracX, fracY, gridX, gridY };
}

console.log('Test with pixel centers:');
console.log('\n64x64 grid, cellSize=4 (2x2 tiling)');
console.log('Click at (0,0) - top-left corner:');
console.log(testMapping(64, 4, 0, 0));
console.log('\nClick at (255,0) - just inside top-left tile:');
console.log(testMapping(64, 4, 255, 0));
console.log('\nClick at (256,0) - at boundary:');
console.log(testMapping(64, 4, 256, 0));
console.log('\nClick at (511,511) - bottom-right corner:');
console.log(testMapping(64, 4, 511, 511));

console.log('\n\n100x100 grid, cellSize=4 (non-power-of-2)');
console.log('Click at (200,200):');
console.log(testMapping(100, 4, 200, 200));
