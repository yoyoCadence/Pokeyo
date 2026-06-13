// ============ 通用 UI 工具 ============

function $id(id) { return document.getElementById(id); }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let toastTimer = null;
function showToast(text) {
  const el = $id('toast');
  el.textContent = text;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2400);
}

function hpLevelClass(pct) {
  if (pct <= 0.2) return ' critical';
  if (pct <= 0.5) return ' low';
  return '';
}

function updateSidebar() {
  const list = $id('party-list');
  list.innerHTML = '';
  Game.party.forEach((m, i) => {
    const sp = speciesOf(m);
    const max = maxHpOf(m);
    const pct = m.hp / max;
    const div = document.createElement('div');
    div.className = 'party-item' + (m.hp <= 0 ? ' fainted' : '');
    div.innerHTML =
      `<span class="p-emoji">${sp.emoji}</span>` +
      `<span class="p-name">${sp.name} <small>Lv.${m.level}</small></span>` +
      `<span class="p-hp">${m.hp}/${max}</span>` +
      `<div class="hp-bar mini"><div class="hp-fill${hpLevelClass(pct)}" style="width:${Math.max(0, pct * 100)}%"></div></div>`;
    div.onclick = () => {
      if (Game.state !== 'world' || i === 0 || m.hp <= 0) return;
      Game.party.splice(i, 1);
      Game.party.unshift(m);
      updateSidebar();
      save();
      showToast(`${sp.name} 来到了队首。`);
    };
    list.appendChild(div);
  });
  $id('bag-list').innerHTML =
    `<div>◓ 精灵球 × ${Game.bag.ball}</div>` +
    `<div>🧪 伤药 × ${Game.bag.potion}</div>`;
}
