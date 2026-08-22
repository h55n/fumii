const { rcedit } = require('rcedit');
const path = require('path');
const fs = require('fs');

async function patchExe(exePath) {
  if (!fs.existsSync(exePath)) {
    console.log(`[patch-exe] Skipping missing executable: ${exePath}`);
    return;
  }

  const iconPath = path.resolve(__dirname, '../assets/icon.ico');

  console.log(`[patch-exe] Patching metadata for: ${exePath}`);
  try {
    await rcedit(exePath, {
      icon: iconPath,
      'file-version': '1.0.0',
      'product-version': '1.0.0',
      'version-string': {
        ProductName: 'fumii',
        FileDescription: 'fumii — Desktop AI Companion',
        CompanyName: 'fumii',
        LegalCopyright: 'Copyright © 2025 fumii',
        OriginalFilename: 'fumii.exe',
        InternalName: 'fumii'
      }
    });
    console.log(`[patch-exe] Successfully stamped fumii branding & icon onto ${exePath}`);
  } catch (err) {
    console.error(`[patch-exe] Error patching ${exePath}:`, err);
  }
}

async function main() {
  const targets = [
    path.resolve(__dirname, '../release/win-unpacked/fumii.exe'),
    path.resolve(__dirname, '../release-fixed/win-unpacked/fumii.exe')
  ];

  for (const t of targets) {
    await patchExe(t);
  }
}

main();
