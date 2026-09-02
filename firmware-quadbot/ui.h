/*
 * ui.h - Web control panel presentation layer
 * --------------------------------------------
 * Contains ONLY the HTML/CSS/JS served to the browser. No servo or
 * gait logic lives here - every button just calls /cmd?action=...
 * which the main .ino maps directly onto the existing functions
 * from text.h (standby, forward, back, turnleft, turnright,
 * leftmove, rightmove, hello, pushup, fighting, lie, sleep,
 * dance1, dance2, dance3) plus a "wake" route built from the
 * existing Servo_PROGRAM_Zero() + standby().
 *
 * Kept in its own file so the UI can be restyled without touching
 * any motion code.
 */

#ifndef UI_H
#define UI_H

const char PAGE_INDEX[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>QuadBot-E</title>
<style>
  :root {
    --bg: #0d1117;
    --panel: #161b22;
    --text: #e6edf3;
    --muted: #8b949e;
    --move: #2a72de;
    --move-dark: #1a4fa0;
    --trick: #d29922;
    --trick-dark: #9c7415;
    --dance: #a371f7;
    --dance-dark: #7e4fd1;
    --rest: #6e7681;
    --rest-dark: #484f58;
    --stop: #c0392b;
    --stop-dark: #8e2a1f;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, Segoe UI, Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    text-align: center;
    padding: 16px 12px 40px;
  }
  h1 { font-size: 1.3em; margin: 8px 0 2px; }
  .subtitle { color: var(--muted); font-size: 0.85em; margin-bottom: 18px; }

  section { margin: 0 auto 22px; max-width: 380px; }
  section h2 {
    font-size: 0.75em;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    text-align: left;
    margin: 0 0 8px 4px;
  }

  .dpad {
    display: grid;
    grid-template-columns: 72px 72px 72px;
    grid-template-rows: 64px 64px 64px;
    gap: 8px;
    justify-content: center;
  }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }

  button {
    font-size: 0.95em;
    font-weight: 600;
    border: none;
    border-radius: 12px;
    padding: 14px 6px;
    color: #fff;
    background: var(--move);
    transition: transform 0.08s ease, opacity 0.15s ease;
  }
  button:active { transform: scale(0.94); background: var(--move-dark); }
  button:disabled { opacity: 0.4; }

  .trick { background: var(--trick); }
  .trick:active { background: var(--trick-dark); }
  .dance { background: var(--dance); }
  .dance:active { background: var(--dance-dark); }
  .rest { background: var(--rest); }
  .rest:active { background: var(--rest-dark); }
  #standbyBtn { background: var(--stop); }
  #standbyBtn:active { background: var(--stop-dark); }

  #status {
    margin-top: 6px;
    color: var(--muted);
    font-size: 0.85em;
    min-height: 1.2em;
  }
  #status.busy { color: var(--trick); }
</style>
</head>
<body>
  <h1>&#129418; QuadBot-E</h1>
  <div class="subtitle">Tap a move</div>

  <section>
    <h2>Move</h2>
    <div class="dpad">
      <div></div><button onclick="send('forward')">Forward</button><div></div>
      <button onclick="send('left')">Turn L</button>
      <button id="standbyBtn" onclick="send('standby')">Standby</button>
      <button onclick="send('right')">Turn R</button>
      <div></div><button onclick="send('back')">Back</button><div></div>
    </div>
    <div class="grid2" style="margin-top:8px;">
      <button onclick="send('shiftleft')">&#8592; Shift</button>
      <button onclick="send('shiftright')">Shift &#8594;</button>
    </div>
  </section>

  <section>
    <h2>Tricks</h2>
    <div class="grid2">
      <button class="trick" onclick="send('hello')">&#128075; Hi</button>
      <button class="trick" onclick="send('pushup')">&#128170; Push-ups</button>
      <button class="trick" onclick="send('fight')">&#129470; Fight Stance</button>
      <button class="trick" onclick="send('lie')">&#128564; Lie Down</button>
    </div>
  </section>

  <section>
    <h2>Dance</h2>
    <div class="grid3">
      <button class="dance" onclick="send('dance1')">Dance 1</button>
      <button class="dance" onclick="send('dance2')">Dance 2</button>
      <button class="dance" onclick="send('dance3')">Dance 3</button>
    </div>
  </section>

  <section>
    <h2>Rest</h2>
    <div class="grid2">
      <button class="rest" onclick="send('sleep')">&#128564; Sleep</button>
      <button class="rest" onclick="send('wake')">&#9889; Wake Up</button>
    </div>
  </section>

  <div id="status">Ready</div>

<script>
  const statusEl = document.getElementById('status');
  const buttons = document.querySelectorAll('button');

  function setBusy(isBusy) {
    buttons.forEach(b => b.disabled = isBusy);
    statusEl.classList.toggle('busy', isBusy);
  }

  function send(action) {
    setBusy(true);
    statusEl.innerText = 'Running: ' + action + '...';
    fetch('/cmd?action=' + action)
      .then(r => r.text())
      .then(t => { statusEl.innerText = t; setBusy(false); })
      .catch(() => { statusEl.innerText = 'Connection error'; setBusy(false); });
  }
</script>
</body>
</html>
)HTML";

#endif
