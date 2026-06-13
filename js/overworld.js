// ============ 大地图：渲染、移动、遇敌 ============

const worldCanvas = document.getElementById('world');
const wctx = worldCanvas.getContext('2d');

const SPAWN = { x: 10, y: 6 };
const WALKABLE = new Set(['.', 'g', 'G', 'H', 'F', 'B']);
const ENCOUNTER_RATE = 0.16;
let lastMoveTime = 0;

function tileAt(x, y) {
  if (y < 0 || y >= MAP_ROWS.length || x < 0 || x >= MAP_ROWS[0].length) return 'T';
  return MAP_ROWS[y][x];
}

document.addEventListener('keydown', (e) => {
  if (Game.state !== 'world') return;
  const dirs = {
    arrowup: [0, -1, 'up'], w: [0, -1, 'up'],
    arrowdown: [0, 1, 'down'], s: [0, 1, 'down'],
    arrowleft: [-1, 0, 'left'], a: [-1, 0, 'left'],
    arrowright: [1, 0, 'right'], d: [1, 0, 'right'],
  };
  const d = dirs[e.key.toLowerCase()];
  if (!d) return;
  e.preventDefault();
  const now = performance.now();
  if (now - lastMoveTime < 140) return;
  lastMoveTime = now;
  tryMove(d[0], d[1], d[2]);
});

function tryMove(dx, dy, dir) {
  Game.dir = dir;
  const nx = Game.x + dx;
  const ny = Game.y + dy;
  if (!WALKABLE.has(tileAt(nx, ny))) return;
  Game.x = nx;
  Game.y = ny;
  onStep();
}

function onStep() {
  const t = tileAt(Game.x, Game.y);
  const key = Game.x + ',' + Game.y;
  if (t === 'H') {
    healParty();
    updateSidebar();
    save();
    showToast('队伍完全恢复了！进度已保存。');
  } else if (t === 'B' && !Game.pickups.includes(key)) {
    Game.pickups.push(key);
    Game.bag.ball += 5;
    updateSidebar();
    save();
    showToast('捡到了 5 个精灵球！');
  } else if (t === 'G' && Math.random() < ENCOUNTER_RATE) {
    const pick = pickEncounter();
    startWildBattle(pick.id, pick.level);
  }
}

function pickEncounter() {
  const total = ENCOUNTERS.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const e of ENCOUNTERS) {
    r -= e.w;
    if (r <= 0) return { id: e.id, level: e.min + Math.floor(Math.random() * (e.max - e.min + 1)) };
  }
  const last = ENCOUNTERS[ENCOUNTERS.length - 1];
  return { id: last.id, level: last.min };
}

// ---------- 渲染 ----------

function drawWorld() {
  for (let y = 0; y < MAP_ROWS.length; y++) {
    for (let x = 0; x < MAP_ROWS[0].length; x++) {
      drawTile(x, y, tileAt(x, y));
    }
  }
  drawPlayer();
}

function drawTile(x, y, t) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  wctx.fillStyle = '#8fce64';
  wctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

  if (t === 'g') {
    wctx.fillStyle = '#7cbd52';
    wctx.fillRect(px + 4, py + 20, 4, 8);
    wctx.fillRect(px + 14, py + 8, 4, 8);
    wctx.fillRect(px + 24, py + 18, 4, 8);
  } else if (t === 'G') {
    wctx.fillStyle = '#4f9b3a';
    wctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    wctx.fillStyle = '#3d7e2c';
    for (const [tx, ty] of [[3, 6], [13, 14], [23, 4], [7, 22], [19, 24], [27, 16]]) {
      wctx.fillRect(px + tx, py + ty, 3, 9);
    }
  } else if (t === 'T') {
    wctx.fillStyle = '#6b4a2b';
    wctx.fillRect(px + 12, py + 18, 8, 12);
    wctx.fillStyle = '#2f6b25';
    wctx.beginPath();
    wctx.arc(px + 16, py + 12, 12, 0, Math.PI * 2);
    wctx.fill();
    wctx.fillStyle = '#3a8030';
    wctx.beginPath();
    wctx.arc(px + 11, py + 9, 6, 0, Math.PI * 2);
    wctx.fill();
  } else if (t === 'W') {
    wctx.fillStyle = '#4a90d9';
    wctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
    wctx.strokeStyle = '#7db8ec';
    wctx.lineWidth = 2;
    wctx.beginPath();
    wctx.moveTo(px + 5, py + 12);
    wctx.quadraticCurveTo(px + 11, py + 8, px + 17, py + 12);
    wctx.moveTo(px + 13, py + 24);
    wctx.quadraticCurveTo(px + 19, py + 20, px + 25, py + 24);
    wctx.stroke();
  } else if (t === 'H') {
    wctx.fillStyle = '#f3f0e8';
    wctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    wctx.fillStyle = '#e0524d';
    wctx.fillRect(px + 13, py + 7, 6, 18);
    wctx.fillRect(px + 7, py + 13, 18, 6);
  } else if (t === 'F') {
    wctx.fillStyle = '#e87ca0';
    for (const [fx, fy] of [[8, 10], [20, 8], [14, 22], [25, 20]]) {
      wctx.beginPath();
      wctx.arc(px + fx, py + fy, 3, 0, Math.PI * 2);
      wctx.fill();
    }
  } else if (t === 'B' && !Game.pickups.includes(x + ',' + y)) {
    wctx.fillStyle = '#e0524d';
    wctx.beginPath();
    wctx.arc(px + 16, py + 16, 8, Math.PI, 0);
    wctx.fill();
    wctx.fillStyle = '#f3f0e8';
    wctx.beginPath();
    wctx.arc(px + 16, py + 16, 8, 0, Math.PI);
    wctx.fill();
    wctx.strokeStyle = '#333';
    wctx.lineWidth = 2;
    wctx.beginPath();
    wctx.arc(px + 16, py + 16, 8, 0, Math.PI * 2);
    wctx.moveTo(px + 8, py + 16);
    wctx.lineTo(px + 24, py + 16);
    wctx.stroke();
    wctx.fillStyle = '#fff';
    wctx.beginPath();
    wctx.arc(px + 16, py + 16, 2.5, 0, Math.PI * 2);
    wctx.fill();
  }
}

function drawPlayer() {
  const px = Game.x * TILE_SIZE;
  const py = Game.y * TILE_SIZE;

  wctx.fillStyle = 'rgba(0,0,0,0.2)';
  wctx.beginPath();
  wctx.ellipse(px + 16, py + 28, 9, 4, 0, 0, Math.PI * 2);
  wctx.fill();

  wctx.fillStyle = '#3b5bd0';
  wctx.fillRect(px + 10, py + 15, 12, 12);

  wctx.fillStyle = '#f5cba0';
  wctx.beginPath();
  wctx.arc(px + 16, py + 10, 7, 0, Math.PI * 2);
  wctx.fill();

  wctx.fillStyle = '#e0524d';
  wctx.beginPath();
  wctx.arc(px + 16, py + 9, 7, Math.PI, 0);
  wctx.fill();

  if (Game.dir !== 'up') {
    wctx.fillStyle = '#333';
    const off = Game.dir === 'left' ? -2 : Game.dir === 'right' ? 2 : 0;
    wctx.fillRect(px + 12 + off, py + 11, 2, 2);
    wctx.fillRect(px + 18 + off, py + 11, 2, 2);
  }
}
