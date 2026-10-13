import { shuffle } from "./rng.js";

/** One ink for every shape in a round, so the previous cave's colors cannot solve it. */
const SHAPE_INKS = ["#3b6fe2", "#e07a2f", "#7a4bb5", "#3e9d62", "#e23b3b"];

export function splitInitial(word) {
  return {
    lead: word.slice(0, 1),
    rest: word.slice(1),
  };
}

/**
 * One spoken target and `optionCount` pictures.
 * The first `warmUp` rounds stay inside the opening pool (`coreCount`).
 * A cave asks every pool item once before it repeats one.
 * After the warm-up, items held back (orange, purple) are asked
 * before an opening item is asked again.
 */
export function planPrompts(level, rng, count) {
  const optionCount = level.optionCount ?? 4;
  if (!level.pool?.length) {
    throw new Error(`${level.id} has no prompt pool`);
  }
  if (count == null || count < 1) {
    throw new Error("prompt count is required");
  }
  if (level.pool.length < optionCount) {
    throw new Error(`${level.id} pool is smaller than ${optionCount} options`);
  }

  const warm = level.warmUp ?? 0;
  const core = level.pool.slice(0, level.coreCount ?? level.pool.length);
  if (core.length < optionCount) {
    throw new Error(`${level.id} core pool is smaller than ${optionCount} options`);
  }

  const answers = spokenOrder(level, rng, count);
  return answers.map((answer, i) => {
    const source = i < warm ? core : level.pool;
    return oneRound(level, source, answer, optionCount, rng);
  });
}

/**
 * Spoken targets for one cave. Unique until the pool is exhausted.
 */
function spokenOrder(level, rng, count) {
  const warm = level.warmUp ?? 0;
  const core = level.pool.slice(0, level.coreCount ?? level.pool.length);
  const extra = level.pool.slice(core.length);
  const answers = [];

  let coreLeft = shuffle(rng, core);
  while (answers.length < Math.min(warm, count)) {
    if (coreLeft.length === 0) {
      coreLeft = withoutImmediateRepeat(shuffle(rng, core), answers);
    }
    answers.push(coreLeft.shift());
  }

  if (answers.length < count) {
    const spoken = new Set(answers.map((item) => item.id));
    const freshExtra = shuffle(rng, extra).filter((item) => !spoken.has(item.id));
    const freshCore = shuffle(rng, core).filter((item) => !spoken.has(item.id));
    for (const item of freshExtra.concat(freshCore)) {
      if (answers.length >= count) break;
      answers.push(item);
    }
  }

  while (answers.length < count) {
    const cycle = withoutImmediateRepeat(shuffle(rng, level.pool), answers);
    if (cycle.length === 0) {
      throw new Error(`${level.id} has an empty pool`);
    }
    for (const item of cycle) {
      if (answers.length >= count) break;
      answers.push(item);
    }
  }

  return answers;
}

function withoutImmediateRepeat(items, answers) {
  const last = answers[answers.length - 1];
  if (!last || items.length < 2 || items[0].id !== last.id) {
    return items;
  }
  return items.slice(1).concat(items[0]);
}

function oneRound(level, pool, answer, optionCount, rng) {
  if (!pool.some((item) => item.id === answer.id)) {
    throw new Error(`${level.id} answer is outside the option pool`);
  }
  const rest = shuffle(
    rng,
    pool.filter((item) => item.id !== answer.id),
  );
  const options = shuffle(rng, [answer, ...rest.slice(0, optionCount - 1)]);
  assertPromptOptions(options, answer.id, optionCount);

  const question = {
    kind: level.prompt,
    spoken: answer.spoken,
    answerId: answer.id,
  };
  if (level.prompt === "shape") {
    question.ink = SHAPE_INKS[Math.floor(rng() * SHAPE_INKS.length)];
  }
  return { question, options };
}

function assertPromptOptions(options, answerId, optionCount) {
  if (options.length !== optionCount) {
    throw new Error("prompt option count mismatch");
  }
  const ids = options.map((item) => item.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error("duplicate prompt options");
  }
  if (ids.filter((id) => id === answerId).length !== 1) {
    throw new Error("prompt options must contain the answer once");
  }
}
