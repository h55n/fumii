const { app, BrowserWindow, screen } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const display = screen.getPrimaryDisplay();
  const { x, y, width, height } = display.workArea;
  console.log('[test-sprite] Display workArea:', { x, y, width, height });

  const win = new BrowserWindow({
    width: 280,
    height: 220,
    x: x + width - 280 - 20,
    y: y + height - 220 - 20,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, '../out/preload/preload.js'),
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.webContents.on('console-message', (e, level, message, line, sourceId) => {
    console.log(`[RENDERER-CONSOLE L${level}] ${message} (${sourceId}:${line})`);
  });

  win.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error(`[RENDERER-FAIL-LOAD] ${url}: ${code} (${desc})`);
  });

  win.webContents.on('render-process-gone', (e, details) => {
    console.error(`[RENDERER-CRASH]`, details);
  });

  const filePath = path.join(__dirname, '../out/renderer/public/sprite.html');
  console.log('[test-sprite] Loading file:', filePath);
  await win.loadFile(filePath);

  console.log('[test-sprite] File loaded. Waiting 2 seconds to inspect DOM...');
  await new Promise(r => setTimeout(r, 2000));

  const domInfo = await win.webContents.executeJavaScript(`
    ({
      rootHTML: document.getElementById('root')?.innerHTML,
      bodyRect: document.body.getBoundingClientRect(),
      elementsCount: document.querySelectorAll('*').length,
      hasFumiiApi: typeof window.fumii !== 'undefined'
    })
  `);
  console.log('[test-sprite] DOM inspection result:', JSON.stringify(domInfo, null, 2));

  setTimeout(() => {
    console.log('[test-sprite] Test finished.');
    app.quit();
  }, 3000);
});
