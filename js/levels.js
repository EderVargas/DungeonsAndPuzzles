/**
 * Gameplay numbers live here. combat.js reads them and does not hardcode a level.
 * Dragon HP is the number of hits needed. There is no fixed question count.
 * playerHearts is the life pool at the start of a new attempt, and the maximum.
 * Hearts are not refilled when a level is cleared.
 */
export const LEVELS = [
  {
    id: "level-1",
    name: "La Cueva Verde",
    type: "combat",
    tables: [1, 2, 3],
    factorMin: 1,
    factorMax: 10,
    answerMode: { type: "sameTable" },
    optionCount: 4,
    playerHearts: 3,
    dragonHp: 4,
    damagePerHit: 1,
    heartLossPerMiss: 1,
  },
  {
    id: "level-2",
    name: "La Guarida del Dragón",
    type: "combat",
    tables: [4, 5, 6],
    factorMin: 1,
    factorMax: 10,
    answerMode: { type: "sameTable" },
    optionCount: 4,
    playerHearts: 3,
    dragonHp: 5,
    damagePerHit: 1,
    heartLossPerMiss: 1,
  },
  {
    id: "level-3",
    name: "La Montaña Roja",
    type: "combat",
    tables: [6, 7, 8],
    factorMin: 1,
    factorMax: 10,
    answerMode: { type: "nearby", deviation: 2 },
    optionCount: 4,
    playerHearts: 3,
    dragonHp: 6,
    damagePerHit: 1,
    heartLossPerMiss: 1,
  },
  {
    id: "treasure",
    name: "El Cofre del Tesoro",
    type: "treasure",
    tables: [9, 10],
    factorMin: 1,
    factorMax: 10,
    answerMode: { type: "nearby", deviation: 2 },
    optionCount: 4,
    playerHearts: 3,
    dragonHp: 3,
    damagePerHit: 1,
    heartLossPerMiss: 1,
  },
];

function validateLevel(level) {
  if (new Set(level.tables).size !== level.tables.length) {
    throw new Error(`${level.id} has duplicate tables`);
  }
  if (level.playerHearts < 1 || level.dragonHp < 1) {
    throw new Error(`${level.id} needs at least 1 heart and 1 dragon HP`);
  }
  if (level.dragonHp < level.tables.length) {
    throw new Error(`${level.id} dragonHp cannot cover every table on a flawless clear`);
  }
  if (level.factorMin < 1 || level.factorMax < level.factorMin) {
    throw new Error(`${level.id} has an invalid factor range`);
  }
}

LEVELS.forEach(validateLevel);

/**
 * The preschool path listens and touches. Each cave is one idea.
 * Colors open on four stains; orange and purple join after the warm-up rounds.
 * Red and green both stay in the lesson. An adult nearby can tell them apart.
 */
export const GAEL_LEVELS = [
  {
    id: "colors",
    name: "Los colores",
    type: "combat",
    prompt: "color",
    optionCount: 4,
    warmUp: 2,
    coreCount: 4,
    playerHearts: 3,
    dragonHp: 4,
    damagePerHit: 1,
    heartLossPerMiss: 1,
    pool: [
      { id: "red", spoken: "Rojo", swatch: "#e23b3b" },
      { id: "blue", spoken: "Azul", swatch: "#3b6fe2" },
      { id: "yellow", spoken: "Amarillo", swatch: "#f0c14a" },
      { id: "green", spoken: "Verde", swatch: "#3e9d62" },
      { id: "orange", spoken: "Naranja", swatch: "#e07a2f" },
      { id: "purple", spoken: "Morado", swatch: "#7a4bb5" },
    ],
  },
  {
    id: "shapes",
    name: "Las formas",
    type: "combat",
    prompt: "shape",
    optionCount: 4,
    playerHearts: 3,
    dragonHp: 4,
    damagePerHit: 1,
    heartLossPerMiss: 1,
    pool: [
      { id: "circle", spoken: "Círculo", shape: "circle" },
      { id: "square", spoken: "Cuadrado", shape: "square" },
      { id: "triangle", spoken: "Triángulo", shape: "triangle" },
      { id: "star", spoken: "Estrella", shape: "star" },
    ],
  },
  {
    id: "numbers",
    name: "Los números",
    type: "combat",
    prompt: "number",
    optionCount: 4,
    playerHearts: 3,
    dragonHp: 4,
    damagePerHit: 1,
    heartLossPerMiss: 1,
    pool: [
      { id: "1", spoken: "Uno", digit: "1", dots: 1 },
      { id: "2", spoken: "Dos", digit: "2", dots: 2 },
      { id: "3", spoken: "Tres", digit: "3", dots: 3 },
      { id: "4", spoken: "Cuatro", digit: "4", dots: 4 },
      { id: "5", spoken: "Cinco", digit: "5", dots: 5 },
    ],
  },
  {
    id: "vowels",
    name: "Las vocales",
    type: "combat",
    prompt: "vowel",
    optionCount: 4,
    playerHearts: 3,
    dragonHp: 4,
    damagePerHit: 1,
    heartLossPerMiss: 1,
    pool: [
      { id: "a", spoken: "A", vowel: "a", word: "Araña", art: "spider" },
      { id: "e", spoken: "E", vowel: "e", word: "Estrella", art: "star" },
      { id: "i", spoken: "I", vowel: "i", word: "Isla", art: "island" },
      { id: "o", spoken: "O", vowel: "o", word: "Oso", art: "bear" },
      { id: "u", spoken: "U", vowel: "u", word: "Uvas", art: "grapes" },
    ],
  },
];

function validatePromptLevel(level) {
  const kinds = new Set(["color", "shape", "number", "vowel"]);
  if (!kinds.has(level.prompt)) {
    throw new Error(`${level.id} has an unknown prompt`);
  }
  if (level.optionCount !== 4) {
    throw new Error(`${level.id} keeps 4 buttons`);
  }
  if (level.playerHearts < 1 || level.dragonHp < 1) {
    throw new Error(`${level.id} needs at least 1 heart and 1 dragon HP`);
  }
  if (!level.pool || level.pool.length < level.optionCount) {
    throw new Error(`${level.id} pool is too small`);
  }
  const ids = new Set();
  for (const item of level.pool) {
    if (!item.id || !item.spoken || ids.has(item.id)) {
      throw new Error(`${level.id} has a bad pool item`);
    }
    ids.add(item.id);
    if (level.prompt === "color" && !item.swatch) {
      throw new Error(`${level.id} color is missing a swatch`);
    }
    if (level.prompt === "shape" && !item.shape) {
      throw new Error(`${level.id} shape is missing a drawing`);
    }
    if (level.prompt === "number" && (item.digit == null || item.dots < 1)) {
      throw new Error(`${level.id} number is missing digit or dots`);
    }
    if (level.prompt === "vowel") {
      if (!item.word || !item.art || !item.vowel) {
        throw new Error(`${level.id} vowel is missing word or art`);
      }
      if (item.word[0].toLowerCase() !== item.vowel) {
        throw new Error(`${level.id} word ${item.word} does not start with ${item.vowel}`);
      }
    }
  }
}

GAEL_LEVELS.forEach(validatePromptLevel);

export function levelsFor(characterId) {
  if (characterId === "leo") {
    return LEVELS;
  }
  if (characterId === "gael") {
    return GAEL_LEVELS;
  }
  throw new Error(`Unknown character: ${characterId}`);
}

export function getLevel(id) {
  const level = [...LEVELS, ...GAEL_LEVELS].find((item) => item.id === id);
  if (!level) {
    throw new Error(`Unknown level: ${id}`);
  }
  return level;
}

/** Longest fight still possible: the rival falls, or the knight does. */
export function questionBudget(level, hearts) {
  if (hearts < 1) {
    throw new Error(`${level.id} needs at least 1 heart to start`);
  }
  return level.dragonHp + hearts - 1;
}
