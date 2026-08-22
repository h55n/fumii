// Best-effort postinstall nudge — never fails the install.
const http = require('http');

const req = http.get('http://localhost:11434/api/tags', { timeout: 1000 }, (res) => {
  if (res.statusCode === 200) {
    console.log('\n✓ Ollama detected — fumii will use it as the primary local model.\n');
  }
});
req.on('error', () => {
  console.log(
    '\n○ Ollama not detected. fumii still works via cloud provider fallback (add an API key in Settings),\n' +
    '  but for the fully local/private experience install Ollama: https://ollama.com and run\n' +
    '  `ollama pull qwen2.5:1.5b`\n'
  );
});
req.on('timeout', () => req.destroy());
