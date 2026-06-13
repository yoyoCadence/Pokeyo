// ============ 游戏静态数据 ============

const TILE_SIZE = 32;

// 地图图例: T=树(不可走) W=水(不可走) .=空地 g=矮草 G=深草丛(遇敌)
//           H=治疗台 F=花丛 B=精灵球(可拾取一次)
const MAP_ROWS = [
  'TTTTTTTTTTTTTTTTTTTT',
  'T....GGGG......WWWWT',
  'T.B..GGGG..F...WWWWT',
  'T....GGGG......WWWWT',
  'T..............WWWWT',
  'T...TT....H........T',
  'T...TT.............T',
  'T......F.....TT....T',
  'T.GGGG.......TT..B.T',
  'T.GGGG.............T',
  'T.GGGG....F....GGGGT',
  'T.GGGG.B.......GGGGT',
  'T..............GGGGT',
  'TTTTTTTTTTTTTTTTTTTT',
];

const TYPES = {
  normal: '普通', fire: '火', water: '水', grass: '草',
  electric: '电', rock: '岩石', flying: '飞行', bug: '虫',
};

// 属性克制表: TYPE_CHART[攻击属性][防御属性] = 倍率（缺省为 1）
const TYPE_CHART = {
  fire:     { grass: 2, bug: 2, fire: 0.5, water: 0.5, rock: 0.5 },
  water:    { fire: 2, rock: 2, water: 0.5, grass: 0.5 },
  grass:    { water: 2, rock: 2, fire: 0.5, grass: 0.5, bug: 0.5, flying: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, rock: 0.5 },
  rock:     { fire: 2, flying: 2, bug: 2 },
  flying:   { grass: 2, bug: 2, electric: 0.5, rock: 0.5 },
  bug:      { grass: 2, fire: 0.5, flying: 0.5 },
  normal:   { rock: 0.5 },
};

const MOVES = {
  tackle:       { name: '撞击',     type: 'normal',   power: 40, acc: 100 },
  scratch:      { name: '抓',       type: 'normal',   power: 40, acc: 100 },
  quickattack:  { name: '电光一闪', type: 'normal',   power: 40, acc: 100 },
  slam:         { name: '猛撞',     type: 'normal',   power: 70, acc: 90 },
  ember:        { name: '火花',     type: 'fire',     power: 40, acc: 100 },
  flamewheel:   { name: '火焰轮',   type: 'fire',     power: 60, acc: 100 },
  flamethrower: { name: '喷射火焰', type: 'fire',     power: 90, acc: 100 },
  watergun:     { name: '水枪',     type: 'water',    power: 40, acc: 100 },
  bubblebeam:   { name: '泡沫光线', type: 'water',    power: 60, acc: 100 },
  hydropump:    { name: '水炮',     type: 'water',    power: 95, acc: 85 },
  vinewhip:     { name: '藤鞭',     type: 'grass',    power: 45, acc: 100 },
  razorleaf:    { name: '飞叶快刀', type: 'grass',    power: 55, acc: 95 },
  solarbeam:    { name: '日光束',   type: 'grass',    power: 90, acc: 100 },
  thundershock: { name: '电击',     type: 'electric', power: 40, acc: 100 },
  thunderbolt:  { name: '十万伏特', type: 'electric', power: 90, acc: 100 },
  rockthrow:    { name: '落石',     type: 'rock',     power: 50, acc: 90 },
  rockslide:    { name: '岩崩',     type: 'rock',     power: 75, acc: 90 },
  gust:         { name: '起风',     type: 'flying',   power: 40, acc: 100 },
  wingattack:   { name: '翅膀攻击', type: 'flying',   power: 60, acc: 100 },
  bugbite:      { name: '虫咬',     type: 'bug',      power: 45, acc: 100 },
};

const SPECIES = {
  // —— 御三家 ——
  flarefox: {
    name: '焰小狐', emoji: '🦊', types: ['fire'],
    base: { hp: 39, atk: 52, def: 43, spd: 65 },
    catchRate: 0.45, baseExp: 62, evolveTo: 'blazewolf', evolveLevel: 16,
    learnset: [[1, 'scratch'], [1, 'ember'], [9, 'quickattack'], [14, 'flamewheel'], [24, 'flamethrower']],
  },
  blazewolf: {
    name: '烈焰狼', emoji: '🐺', types: ['fire'],
    base: { hp: 58, atk: 80, def: 58, spd: 80 },
    catchRate: 0.2, baseExp: 142,
    learnset: [[1, 'scratch'], [1, 'ember'], [9, 'quickattack'], [14, 'flamewheel'], [24, 'flamethrower']],
  },
  aquaturt: {
    name: '小水龟', emoji: '🐢', types: ['water'],
    base: { hp: 44, atk: 48, def: 65, spd: 43 },
    catchRate: 0.45, baseExp: 63, evolveTo: 'tidedragon', evolveLevel: 16,
    learnset: [[1, 'tackle'], [1, 'watergun'], [13, 'bubblebeam'], [24, 'hydropump']],
  },
  tidedragon: {
    name: '浪涛龙', emoji: '🐉', types: ['water'],
    base: { hp: 59, atk: 73, def: 88, spd: 58 },
    catchRate: 0.2, baseExp: 142,
    learnset: [[1, 'tackle'], [1, 'watergun'], [13, 'bubblebeam'], [24, 'hydropump']],
  },
  leafling: {
    name: '草叶苗', emoji: '🌱', types: ['grass'],
    base: { hp: 45, atk: 49, def: 49, spd: 45 },
    catchRate: 0.45, baseExp: 64, evolveTo: 'eldertree', evolveLevel: 16,
    learnset: [[1, 'tackle'], [1, 'vinewhip'], [13, 'razorleaf'], [24, 'solarbeam']],
  },
  eldertree: {
    name: '参天树', emoji: '🌳', types: ['grass'],
    base: { hp: 60, atk: 72, def: 75, spd: 55 },
    catchRate: 0.2, baseExp: 142,
    learnset: [[1, 'tackle'], [1, 'vinewhip'], [13, 'razorleaf'], [24, 'solarbeam']],
  },
  // —— 野生 ——
  birdy: {
    name: '啾啾鸟', emoji: '🐦', types: ['normal', 'flying'],
    base: { hp: 40, atk: 45, def: 40, spd: 56 },
    catchRate: 0.7, baseExp: 50,
    learnset: [[1, 'tackle'], [1, 'gust'], [9, 'quickattack'], [16, 'wingattack']],
  },
  sparkmouse: {
    name: '闪电鼠', emoji: '🐭', types: ['electric'],
    base: { hp: 35, atk: 55, def: 40, spd: 90 },
    catchRate: 0.55, baseExp: 82,
    learnset: [[1, 'quickattack'], [1, 'thundershock'], [22, 'thunderbolt']],
  },
  rockling: {
    name: '岩石娃', emoji: '🗿', types: ['rock'],
    base: { hp: 40, atk: 80, def: 100, spd: 20 },
    catchRate: 0.55, baseExp: 86,
    learnset: [[1, 'tackle'], [1, 'rockthrow'], [18, 'rockslide']],
  },
  bugler: {
    name: '绿绒虫', emoji: '🐛', types: ['bug'],
    base: { hp: 45, atk: 30, def: 35, spd: 45 },
    catchRate: 0.8, baseExp: 39,
    learnset: [[1, 'tackle'], [1, 'bugbite']],
  },
  hopbun: {
    name: '跳跳兔', emoji: '🐰', types: ['normal'],
    base: { hp: 55, atk: 56, def: 35, spd: 72 },
    catchRate: 0.7, baseExp: 58,
    learnset: [[1, 'tackle'], [1, 'quickattack'], [14, 'slam']],
  },
  buzzbee: {
    name: '嗡嗡蜂', emoji: '🐝', types: ['bug', 'flying'],
    base: { hp: 40, atk: 60, def: 40, spd: 70 },
    catchRate: 0.5, baseExp: 80,
    learnset: [[1, 'bugbite'], [1, 'gust'], [16, 'wingattack']],
  },
};

const STARTERS = ['flarefox', 'aquaturt', 'leafling'];

// 深草丛遇敌表：w 为权重，min/max 为等级范围
const ENCOUNTERS = [
  { id: 'bugler',     min: 2, max: 4, w: 30 },
  { id: 'birdy',      min: 2, max: 5, w: 25 },
  { id: 'hopbun',     min: 3, max: 5, w: 20 },
  { id: 'sparkmouse', min: 3, max: 6, w: 10 },
  { id: 'rockling',   min: 3, max: 6, w: 10 },
  { id: 'buzzbee',    min: 4, max: 7, w: 5 },
];
