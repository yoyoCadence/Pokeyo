// ============ 宝可梦实例与战斗计算 ============
// 宝可梦实例是纯数据对象 { speciesId, level, exp, hp, moves }，方便 JSON 存档。

function speciesOf(m) { return SPECIES[m.speciesId]; }

function maxHpOf(m) {
  return Math.floor(speciesOf(m).base.hp * m.level / 50) + m.level + 10;
}

function statOf(m, key) {
  return Math.floor(speciesOf(m).base[key] * m.level / 50) + 5;
}

function movesAt(speciesId, level) {
  const learned = SPECIES[speciesId].learnset
    .filter(([lv]) => lv <= level)
    .map(([, mv]) => mv);
  return learned.slice(-4);
}

function createMonster(speciesId, level) {
  const m = { speciesId, level, exp: level ** 3, moves: movesAt(speciesId, level) };
  m.hp = maxHpOf(m);
  return m;
}

function calcDamage(att, def, move) {
  const a = statOf(att, 'atk');
  const d = statOf(def, 'def');
  let dmg = Math.floor(Math.floor((2 * att.level / 5 + 2) * move.power * a / d) / 50) + 2;
  const stab = speciesOf(att).types.includes(move.type) ? 1.5 : 1;
  let eff = 1;
  for (const t of speciesOf(def).types) {
    const row = TYPE_CHART[move.type];
    if (row && row[t] !== undefined) eff *= row[t];
  }
  dmg = Math.floor(dmg * stab * eff * (0.85 + Math.random() * 0.15));
  return { dmg: Math.max(1, dmg), eff };
}

function expReward(enemy) {
  return Math.floor(speciesOf(enemy).baseExp * enemy.level / 7) + 1;
}

// 增加经验值，处理升级、学招式、进化；返回要逐条显示的消息数组
function gainExp(m, amount) {
  const messages = [];
  m.exp += amount;
  messages.push(`${speciesOf(m).name} 获得了 ${amount} 点经验值！`);
  while (m.level < 100 && m.exp >= (m.level + 1) ** 3) {
    const oldMax = maxHpOf(m);
    m.level++;
    m.hp = Math.min(maxHpOf(m), m.hp + (maxHpOf(m) - oldMax));
    messages.push(`${speciesOf(m).name} 升到了 ${m.level} 级！`);

    for (const [lv, mv] of speciesOf(m).learnset) {
      if (lv === m.level && !m.moves.includes(mv)) {
        if (m.moves.length < 4) {
          m.moves.push(mv);
          messages.push(`${speciesOf(m).name} 学会了 ${MOVES[mv].name}！`);
        } else {
          const old = m.moves.shift();
          m.moves.push(mv);
          messages.push(`${speciesOf(m).name} 忘记了 ${MOVES[old].name}，学会了 ${MOVES[mv].name}！`);
        }
      }
    }

    const sp = speciesOf(m);
    if (sp.evolveTo && m.level >= sp.evolveLevel) {
      const oldName = sp.name;
      const preMax = maxHpOf(m);
      m.speciesId = sp.evolveTo;
      m.hp = Math.min(maxHpOf(m), m.hp + Math.max(0, maxHpOf(m) - preMax));
      messages.push(`什么？${oldName} 进化成了 ${speciesOf(m).name}！`);
    }
  }
  return messages;
}
