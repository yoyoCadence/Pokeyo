// ============ 回合制战斗 ============

let battleState = null; // { enemy, activeIdx }
let menuResolve = null;

const MENU_IDS = ['menu-main', 'menu-moves', 'menu-bag', 'menu-party'];

function active() { return Game.party[battleState.activeIdx]; }

function showMenu(id) {
  for (const m of MENU_IDS) $id(m).classList.toggle('hidden', m !== id);
}
function hideAllMenus() {
  for (const m of MENU_IDS) $id(m).classList.add('hidden');
}

function waitChoice() {
  return new Promise(r => { menuResolve = r; });
}
function choose(action) {
  if (!menuResolve) return;
  const r = menuResolve;
  menuResolve = null;
  hideAllMenus();
  r(action);
}

for (const btn of document.querySelectorAll('#menu-main button')) {
  btn.onclick = () => {
    const act = btn.dataset.act;
    if (act === 'fight') { renderMoveMenu(); showMenu('menu-moves'); }
    else if (act === 'bag') { renderBagMenu(); showMenu('menu-bag'); }
    else if (act === 'party') { renderPartyMenu(false); showMenu('menu-party'); }
    else if (act === 'run') choose({ type: 'run' });
  };
}

function backButton() {
  const b = document.createElement('button');
  b.className = 'back-btn';
  b.textContent = '← 返回';
  b.onclick = () => showMenu('menu-main');
  return b;
}

function renderMoveMenu() {
  const el = $id('menu-moves');
  el.innerHTML = '';
  for (const mvId of active().moves) {
    const mv = MOVES[mvId];
    const b = document.createElement('button');
    b.innerHTML = `${mv.name}<small>${TYPES[mv.type]} · 威力 ${mv.power}</small>`;
    b.onclick = () => choose({ type: 'move', move: mv });
    el.appendChild(b);
  }
  el.appendChild(backButton());
}

function renderBagMenu() {
  const el = $id('menu-bag');
  el.innerHTML = '';

  const ball = document.createElement('button');
  ball.innerHTML = `◓ 精灵球<small>剩余 ${Game.bag.ball}</small>`;
  ball.disabled = Game.bag.ball <= 0;
  ball.onclick = () => choose({ type: 'ball' });
  el.appendChild(ball);

  const potion = document.createElement('button');
  potion.innerHTML = `🧪 伤药<small>恢复 30 HP · 剩余 ${Game.bag.potion}</small>`;
  potion.disabled = Game.bag.potion <= 0 || active().hp >= maxHpOf(active());
  potion.onclick = () => choose({ type: 'potion' });
  el.appendChild(potion);

  el.appendChild(backButton());
}

function renderPartyMenu(forced) {
  const el = $id('menu-party');
  el.innerHTML = '';
  Game.party.forEach((m, i) => {
    const sp = speciesOf(m);
    const b = document.createElement('button');
    b.innerHTML = `${sp.emoji} ${sp.name} Lv.${m.level}<small>HP ${m.hp}/${maxHpOf(m)}</small>`;
    b.disabled = m.hp <= 0 || i === battleState.activeIdx;
    b.onclick = () => choose({ type: 'switch', idx: i });
    el.appendChild(b);
  });
  if (!forced) el.appendChild(backButton());
}

// ---------- 战斗界面 ----------

async function bmsg(text) {
  hideAllMenus();
  $id('battle-msg').textContent = text;
  await sleep(950);
}

function setSprites() {
  $id('enemy-sprite').textContent = speciesOf(battleState.enemy).emoji;
  $id('player-sprite').textContent = speciesOf(active()).emoji;
}

function flashSprite(side) {
  const el = $id(side + '-sprite');
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 350);
}

function setHpBar(el, pct) {
  el.style.width = Math.max(0, pct * 100) + '%';
  el.classList.toggle('low', pct <= 0.5 && pct > 0.2);
  el.classList.toggle('critical', pct <= 0.2);
}

function updateBattlePanels() {
  const em = battleState.enemy;
  const pm = active();
  $id('enemy-name').textContent = speciesOf(em).name;
  $id('enemy-level').textContent = 'Lv.' + em.level;
  setHpBar($id('enemy-hp'), em.hp / maxHpOf(em));
  $id('player-name').textContent = speciesOf(pm).name;
  $id('player-level').textContent = 'Lv.' + pm.level;
  setHpBar($id('player-hp'), pm.hp / maxHpOf(pm));
  $id('player-hp-text').textContent = `${pm.hp} / ${maxHpOf(pm)}`;
  const lo = pm.level ** 3;
  const hi = (pm.level + 1) ** 3;
  $id('player-exp').style.width = Math.max(0, Math.min(100, 100 * (pm.exp - lo) / (hi - lo))) + '%';
}

// ---------- 战斗流程 ----------

async function startWildBattle(speciesId, level) {
  Game.state = 'battle';
  const enemy = createMonster(speciesId, level);
  battleState = {
    enemy,
    activeIdx: Math.max(0, Game.party.findIndex(p => p.hp > 0)),
  };
  $id('battle').classList.remove('hidden');
  setSprites();
  updateBattlePanels();

  await bmsg(`野生的 ${speciesOf(enemy).name} 出现了！`);
  await bmsg(`就决定是你了，${speciesOf(active()).name}！`);

  let outcome = null;
  while (!outcome) {
    updateBattlePanels();
    $id('battle-msg').textContent = `要让 ${speciesOf(active()).name} 做什么？`;
    showMenu('menu-main');
    const action = await waitChoice();
    outcome = await resolveAction(action);
  }
  endBattle(outcome);
}

async function resolveAction(action) {
  const pm = active();
  const em = battleState.enemy;

  if (action.type === 'run') {
    const chance = Math.min(0.95, Math.max(0.3, 0.6 + (statOf(pm, 'spd') - statOf(em, 'spd')) * 0.03));
    if (Math.random() < chance) {
      await bmsg('成功逃走了！');
      return 'ran';
    }
    await bmsg('没能逃掉！');
    return await enemyAttackPhase();
  }

  if (action.type === 'ball') {
    Game.bag.ball--;
    updateSidebar();
    await bmsg('扔出了精灵球！');
    const p = speciesOf(em).catchRate * (1 - 0.65 * em.hp / maxHpOf(em));
    if (Math.random() < p) {
      await bmsg(`刷——！抓住了 ${speciesOf(em).name}！`);
      if (Game.party.length < 6) {
        Game.party.push(em);
        await bmsg(`${speciesOf(em).name} 加入了队伍！`);
      } else {
        Game.pc.push(em);
        await bmsg(`队伍已满，${speciesOf(em).name} 被传送到了电脑。`);
      }
      return 'caught';
    }
    await bmsg(`可惜！${speciesOf(em).name} 挣脱了出来！`);
    return await enemyAttackPhase();
  }

  if (action.type === 'potion') {
    Game.bag.potion--;
    updateSidebar();
    const healed = Math.min(30, maxHpOf(pm) - pm.hp);
    pm.hp += healed;
    updateBattlePanels();
    await bmsg(`${speciesOf(pm).name} 恢复了 ${healed} 点体力！`);
    return await enemyAttackPhase();
  }

  if (action.type === 'switch') {
    battleState.activeIdx = action.idx;
    setSprites();
    updateBattlePanels();
    await bmsg(`回来吧！就决定是你了，${speciesOf(active()).name}！`);
    return await enemyAttackPhase();
  }

  // 双方都出招，速度快的先动
  const enemyMove = MOVES[em.moves[Math.floor(Math.random() * em.moves.length)]];
  const order = statOf(pm, 'spd') >= statOf(em, 'spd') ? ['player', 'enemy'] : ['enemy', 'player'];
  for (const side of order) {
    const att = side === 'player' ? pm : em;
    const def = side === 'player' ? em : pm;
    if (att.hp <= 0) continue;
    await useMove(side, att, def, side === 'player' ? action.move : enemyMove);
    if (em.hp <= 0) return await winPhase();
    if (active().hp <= 0) {
      const r = await faintPhase();
      if (r) return r;
    }
  }
  return null;
}

async function useMove(side, att, def, move) {
  const attName = (side === 'player' ? '' : '野生的 ') + speciesOf(att).name;
  await bmsg(`${attName} 使用了 ${move.name}！`);
  if (Math.random() * 100 >= move.acc) {
    await bmsg('但是没有命中！');
    return;
  }
  const { dmg, eff } = calcDamage(att, def, move);
  if (eff === 0) {
    await bmsg('好像没有效果……');
    return;
  }
  def.hp = Math.max(0, def.hp - dmg);
  flashSprite(side === 'player' ? 'enemy' : 'player');
  updateBattlePanels();
  if (eff > 1) await bmsg('效果拔群！');
  else if (eff < 1) await bmsg('效果不太好……');
}

async function enemyAttackPhase() {
  const em = battleState.enemy;
  const mv = MOVES[em.moves[Math.floor(Math.random() * em.moves.length)]];
  await useMove('enemy', em, active(), mv);
  if (active().hp <= 0) return await faintPhase();
  return null;
}

async function faintPhase() {
  await bmsg(`${speciesOf(active()).name} 倒下了！`);
  if (!Game.party.some(p => p.hp > 0)) {
    await bmsg('你眼前一黑……');
    return 'blackout';
  }
  renderPartyMenu(true);
  $id('battle-msg').textContent = '派出下一只宝可梦！';
  showMenu('menu-party');
  const action = await waitChoice();
  battleState.activeIdx = action.idx;
  setSprites();
  updateBattlePanels();
  await bmsg(`就决定是你了，${speciesOf(active()).name}！`);
  return null;
}

async function winPhase() {
  const em = battleState.enemy;
  await bmsg(`野生的 ${speciesOf(em).name} 倒下了！`);
  const amount = expReward(em);
  for (const line of gainExp(active(), amount)) {
    updateBattlePanels();
    await bmsg(line);
  }
  setSprites();
  updateBattlePanels();
  return 'win';
}

function endBattle(outcome) {
  $id('battle').classList.add('hidden');
  battleState = null;
  if (outcome === 'blackout') {
    healParty();
    Game.x = SPAWN.x;
    Game.y = SPAWN.y;
    showToast('你被送回了治疗台，全队已恢复。');
  }
  Game.state = 'world';
  updateSidebar();
  save();
}
