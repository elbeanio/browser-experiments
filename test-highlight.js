import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to Game of Life
  await page.goto('http://localhost:5174/experiments/game-of-life');
  await page.waitForTimeout(3000); // Wait for WebGPU initialization

  console.log('Page loaded. Taking initial screenshot...');
  await page.screenshot({ path: '/tmp/gol-initial.png' });

  // Click on canvas to trigger highlighting
  const canvas = await page.$('.game-of-life-canvas');
  if (canvas) {
    const box = await canvas.boundingBox();
    if (box) {
      // Click in the middle of the canvas
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(500);
      await page.screenshot({ path: '/tmp/gol-highlight-default.png' });
      console.log('Screenshot with highlighting (default settings) saved');
      await page.mouse.up();
    }
  }

  // Change grid size to 128
  const gridSizeSelect = await page.$('select[aria-label="Grid size"]');
  if (gridSizeSelect) {
    await gridSizeSelect.selectOption('128');
    await page.waitForTimeout(1000);

    // Click again with new grid size
    const canvas = await page.$('.game-of-life-canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/gol-highlight-grid128.png' });
        console.log('Screenshot with highlighting (grid 128) saved');
        await page.mouse.up();
      }
    }
  }

  // Change cell size to 2
  const cellSizeSelect = await page.$('select[aria-label="Cell size"]');
  if (cellSizeSelect) {
    await cellSizeSelect.selectOption('2');
    await page.waitForTimeout(1000);

    // Click again with new cell size
    const canvas = await page.$('.game-of-life-canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.waitForTimeout(500);
        await page.screenshot({ path: '/tmp/gol-highlight-cell2.png' });
        console.log('Screenshot with highlighting (cell size 2) saved');
        await page.mouse.up();
      }
    }
  }

  await browser.close();
  console.log('Done. Check /tmp/gol-*.png files');
})();
