// ============ 全局状态、存档、入口 ============

const SAVE_KEY = 'pokeyo-save-v1';

const Game = {
  state: 'title', // title | starter | world | battle
  x: 10, y: 6, dir: 'down',
  party: [],
  pc: [],
  bag: { ball: 10, potion: 5 },
  pickups: [],
};

function save() {
  const { state, ...data } = Game;
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    Object.assign(Game, JSON.parse(raw));
    return true;
  } catch (err) {
    return false;
  }
}

function healParty() {
  for (const m of Game.party) m.hp = maxHpOf(m);
}

function startWorld() {
  $id('title-screen').classList.add('hidden');
  $id('starter-screen').classList.add('hidden');
  Game.state = 'world';
  updateSidebar();
}

function showStarterScreen() {
  $id('title-screen').classList.add('hidden');
  Game.state = 'starter';
  const wrap = $id('starter-cards');
  wrap.innerHTML = '';
  for (const id of STARTERS) {
    const sp = SPECIES[id];
    const card = document.createElement('button');
    card.className = 'starter-card';
    card.innerHTML =
      `<div class="big-emoji">${sp.emoji}</div>` +
      `<div class="starter-name">${sp.name}</div>` +
      `<div class="type-tag">${sp.types.map(t => TYPES[t]).join(' / ')}属性</div>`;
    card.onclick = () => {
      Game.party = [createMonster(id, 5)];
      save();
      startWorld();
      showToast(`你和 ${sp.name} 的冒险开始了！去深草丛里看看吧。`);
    };
    wrap.appendChild(card);
  }
  $id('starter-screen').classList.remove('hidden');
}

function init() {
  if (localStorage.getItem(SAVE_KEY)) $id('btn-continue').classList.remove('hidden');

  $id('btn-new').onclick = () => {
    if (localStorage.getItem(SAVE_KEY) && !confirm('已有存档，开始新冒险会覆盖它。确定吗？')) return;
    localStorage.removeItem(SAVE_KEY);
    showStarterScreen();
  };
  $id('btn-continue').onclick = () => {
    if (load() && Game.party.length > 0) startWorld();
    else showToast('存档损坏，请开始新冒险。');
  };

  (function loop() {
    drawWorld();
    requestAnimationFrame(loop);
  })();
}

init();
