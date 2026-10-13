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

  const rounds = [];
  for (let i = 0; i < count; i += 1) {
    const source = i < warm ? core : level.pool;
    rounds.push(oneRound(level, source, optionCount, rng));
  }
  return rounds;
}

function oneRound(level, pool, optionCount, rng) {
  const answer = pool[Math.floor(rng() * pool.length)];
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
