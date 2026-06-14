const sharp = require('sharp');
const fs = require('fs');

if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}

sharp('fumii.svg')
  .resize(256, 256)
  .png()
  .toFile('build/icon.png')
  .then(() => console.log('Successfully created build/icon.png'))
  .catch(err => console.error('Error creating icon:', err));
