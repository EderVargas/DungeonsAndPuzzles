import { shuffle } from "./rng.js";

export function normalizeAnswerMode(answerMode) {
  if (typeof answerMode === "string") {
    return { type: answerMode, deviation: 2 };
  }
  if (!answerMode || typeof answerMode.type !== "string") {
    throw new Error("answerMode is missing a type");
  }
  return { deviation: 2, ...answerMode };
}

function sameTableDistractors(question, level, count) {
  const min = level.factorMin ?? 1;
  const max = level.factorMax ?? 10;
  const ranked = [];
  for (let k = min; k <= max; k += 1) {
    if (k === question.b) {
      continue;
    }
    ranked.push({
      k,
      product: question.a * k,
      distance: Math.abs(k - question.b),
    });
  }
  ranked.sort((left, right) => left.distance - right.distance || left.k - right.k);
  if (ranked.length < count) {
    throw new Error(
      `Not enough same-table distractors for ${question.a}×${question.b}`,
    );
  }
  return ranked.slice(0, count).map((item) => item.product);
}

function nearbyDistractors(product, count, deviation, rng) {
  let dev = Math.max(1, deviation);
  let pool = [];
  while (pool.length < count) {
    pool = [];
    for (let value = product - dev; value <= product + dev; value += 1) {
      if (value >= 1 && value !== product) {
        pool.push(value);
      }
    }
    if (pool.length >= count) {
      break;
    }
    dev += 1;
    if (dev > product + count + 50) {
      throw new Error("nearby distractor search failed");
    }
  }
  return shuffle(rng, pool).slice(0, count);
}

function assertOptions(options, product) {
  if (new Set(options).size !== options.length) {
    throw new Error("duplicate answer options");
  }
  const correctCount = options.filter((value) => value === product).length;
  if (correctCount !== 1) {
    throw new Error("options must contain the correct answer once");
  }
  if (options.some((value) => !Number.isInteger(value))) {
    throw new Error("options must be integers");
  }
}

export function createOptions(question, level, rng) {
  const mode = normalizeAnswerMode(level.answerMode);
  const optionCount = level.optionCount ?? 4;
  const distractorCount = optionCount - 1;
  if (distractorCount < 1) {
    throw new Error("optionCount must be at least 2");
  }

  const distractors =
    mode.type === "sameTable"
      ? sameTableDistractors(question, level, distractorCount)
      : mode.type === "nearby"
        ? nearbyDistractors(
            question.product,
            distractorCount,
            mode.deviation ?? 2,
            rng,
          )
        : null;

  if (!distractors) {
    throw new Error(`Unknown answer mode: ${mode.type}`);
  }

  const options = shuffle(rng, [question.product, ...distractors]);
  assertOptions(options, question.product);
  return options;
}
