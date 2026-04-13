// Test coordinate mapping
function testMapping(gridSize, cellSize, canvasX, canvasY) {
  const canvasWidth = 512;
  const canvasHeight = 512;
  
  // Convert to UV
  const uvX = canvasX / canvasWidth;
  const uvY = 1.0 - (canvasY / canvasHeight); // Flip Y
  
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
  
  return { uvScaleX, uvScaleY, scaledX, scaledY, fracX, fracY, gridX, gridY };
}

console.log('Test 1: 64x64 grid, cellSize=4 (2x2 tiling)');
console.log('Click at (0,0) - top-left corner:');
console.log(testMapping(64, 4, 0, 0));
console.log('\nClick at (256,0) - top-middle (between left and right tiles):');
console.log(testMapping(64, 4, 256, 0));
console.log('\nClick at (511,511) - bottom-right corner:');
console.log(testMapping(64, 4, 511, 511));

console.log('\n\nTest 2: 128x128 grid, cellSize=4 (1x1 tiling, no tiling)');
console.log('Click at (0,0):');
console.log(testMapping(128, 4, 0, 0));
console.log('\nClick at (256,256):');
console.log(testMapping(128, 4, 256, 256));

console.log('\n\nTest 3: 64x64 grid, cellSize=2 (4x4 tiling)');
console.log('Click at (128,128) - 2nd tile from left, 2nd from top:');
console.log(testMapping(64, 2, 128, 128));

console.log('\n\nTest 4: 100x100 grid, cellSize=4 (non-power-of-2)');
console.log('uvScale = 512/(100*4) = 512/400 = 1.28');
console.log('Click at (200,200):');
console.log(testMapping(100, 4, 200, 200));
