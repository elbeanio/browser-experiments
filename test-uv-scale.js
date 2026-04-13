// Test UV scale calculations
function calculateUVScale(gridSize, cellSize) {
  const canvasSize = 512;
  const gridPixelSize = gridSize * cellSize;
  const uvScale = canvasSize / gridPixelSize;
  return uvScale;
}

console.log('Testing UV scale calculations:');
console.log('Grid 64x64, cellSize=4:', calculateUVScale(64, 4));
console.log('Grid 128x128, cellSize=4:', calculateUVScale(128, 4));
console.log('Grid 256x256, cellSize=4:', calculateUVScale(256, 4));
console.log('Grid 64x64, cellSize=2:', calculateUVScale(64, 2));
console.log('Grid 64x64, cellSize=8:', calculateUVScale(64, 8));
console.log('Grid 64x128, cellSize=4:', {x: calculateUVScale(64, 4), y: calculateUVScale(128, 4)});
console.log('Grid 128x64, cellSize=4:', {x: calculateUVScale(128, 4), y: calculateUVScale(64, 4)});

// For highlighting: tile_y = floor(uv_scale_y - 0.001)
console.log('\nTop tile index (floor(uv_scale - 0.001)):');
console.log('uv_scale=2.0 ->', Math.floor(2.0 - 0.001));
console.log('uv_scale=1.0 ->', Math.floor(1.0 - 0.001));
console.log('uv_scale=1.7 ->', Math.floor(1.7 - 0.001));
console.log('uv_scale=0.8 ->', Math.floor(0.8 - 0.001));
