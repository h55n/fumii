const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'dashboard', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Colors
  content = content.replace(/#1A1A24/g, 'var(--color-surface)');
  content = content.replace(/#0F0F14/g, 'var(--color-bg)');
  content = content.replace(/#EEEAE0/g, 'var(--color-text-primary)');
  content = content.replace(/#9E9A8E/g, 'var(--color-text-secondary)');
  content = content.replace(/#F5A623/g, 'var(--color-primary)');
  content = content.replace(/rgba\(245,\s*166,\s*35,\s*0\.4\)/g, 'var(--color-primary)');
  content = content.replace(/rgba\(245,\s*166,\s*35,\s*0\.5\)/g, 'var(--color-primary)');

  // Borders
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.0[48]\)/g, 'var(--color-border)');
  content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.06\)/g, 'var(--color-surface-raised)');
  
  // Fonts
  content = content.replace(/'Space Grotesk',\s*sans-serif/g, 'var(--font-display)');
  content = content.replace(/'Space Grotesk'/g, 'var(--font-display)');
  content = content.replace(/Space Grotesk,\s*sans-serif/g, 'var(--font-display)');
  content = content.replace(/Space Grotesk/g, 'var(--font-display)');
  content = content.replace(/'Departure Mono',\s*monospace/g, 'var(--font-mono)');
  content = content.replace(/Departure Mono,\s*monospace/g, 'var(--font-mono)');

  fs.writeFileSync(filePath, content);
}
console.log('Updated pages styles successfully.');
