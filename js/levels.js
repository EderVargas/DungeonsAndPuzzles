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

export function getLevel(id) {
  const level = LEVELS.find((item) => item.id === id);
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
