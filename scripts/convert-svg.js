const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

function createIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + dirEntrySize * count;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(count, 4); // count

  const dirEntries = [];
  const imageBuffers = [];

  for (const item of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset

    dirEntries.push(entry);
    imageBuffers.push(item.buffer);
    offset += item.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 1000,
    show: false,
    webPreferences: {
      offscreen: true
    }
  });

  const svgContent = fs.readFileSync(path.resolve(__dirname, '../assets/fumii.svg'), 'utf8');
  const svgBase64 = Buffer.from(svgContent).toString('base64');
  const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background: transparent; overflow: hidden;">
        <img id="svgImg" src="${dataUri}" />
        <canvas id="canvas"></canvas>
      </body>
    </html>
  `;

  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  const renderSize = async (size) => {
    return await win.webContents.executeJavaScript(`
      new Promise((resolve, reject) => {
        const img = document.getElementById('svgImg');
        const canvas = document.getElementById('canvas');
        canvas.width = ${size};
        canvas.height = ${size};
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, ${size}, ${size});
        ctx.drawImage(img, 0, 0, ${size}, ${size});
        resolve(canvas.toDataURL('image/png'));
      });
    `);
  };

  const sizes = [512, 256, 128, 64, 48, 32, 16];
  const rendered = {};

  for (const s of sizes) {
    const dataUrl = await renderSize(s);
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    rendered[s] = Buffer.from(base64, 'base64');
  }

  // Write assets/icon.png (512x512)
  fs.writeFileSync(path.resolve(__dirname, '../assets/icon.png'), rendered[512]);

  // Write assets/tray-icon.png (32x32)
  fs.writeFileSync(path.resolve(__dirname, '../assets/tray-icon.png'), rendered[32]);

  // Write assets/icon.ico (multi-resolution ICO)
  const icoPngs = [
    { width: 256, height: 256, buffer: rendered[256] },
    { width: 128, height: 128, buffer: rendered[128] },
    { width: 64, height: 64, buffer: rendered[64] },
    { width: 48, height: 48, buffer: rendered[48] },
    { width: 32, height: 32, buffer: rendered[32] },
    { width: 16, height: 16, buffer: rendered[16] }
  ];
  const icoBuffer = createIco(icoPngs);
  fs.writeFileSync(path.resolve(__dirname, '../assets/icon.ico'), icoBuffer);

  // Copy icon to public for browser/favicon
  fs.writeFileSync(path.resolve(__dirname, '../public/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.resolve(__dirname, '../public/icon.png'), rendered[128]);

  console.log('Successfully generated assets/icon.png, assets/tray-icon.png, assets/icon.ico, and public/favicon.ico from fumii.svg!');
  app.quit();
});
