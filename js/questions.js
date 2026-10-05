import { shuffle } from "./rng.js";

/**
 * Build the question list for one match.
 * 1. Place every configured table once.
 * 2. Fill the remaining slots with a random table from that list.
 * 3. Shuffle the slot order.
 * 4. Pick a second factor in range, without repeating the ordered pair a×b
 *    unless that table has no free factors left.
 */
export function planQuestions(level, rng, count = level.questionCount) {
  const tables = level.tables;
  if (!tables?.length) {
    throw new Error("Level has no tables");
  }
  if (count == null) {
    throw new Error("question count is required");
  }
  if (count < tables.length) {
    throw new Error(
      `question count ${count} is smaller than ${tables.length} tables`,
    );
  }

  const min = level.factorMin ?? 1;
  const max = level.factorMax ?? 10;
  const sequence = tables.slice();
  const extra = count - tables.length;
  for (let i = 0; i < extra; i += 1) {
    const index = Math.floor(rng() * tables.length);
    sequence.push(tables[index]);
  }

  const used = new Set();
  return shuffle(rng, sequence).map((a) => {
    const free = [];
    for (let b = min; b <= max; b += 1) {
      if (!used.has(`${a}x${b}`)) {
        free.push(b);
      }
    }

    let b;
    if (free.length > 0) {
      b = free[Math.floor(rng() * free.length)];
    } else {
      const span = max - min + 1;
      b = min + Math.floor(rng() * span);
    }

    used.add(`${a}x${b}`);
    return { a, b, product: a * b };
  });
}
