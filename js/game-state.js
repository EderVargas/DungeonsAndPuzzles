import { createOptions } from "./answers.js";
import { applyAnswer, createCombat } from "./combat.js";
import { questionBudget } from "./levels.js";
import { planQuestions } from "./questions.js";

/**
 * Phase machine for one match.
 * submitAnswer resolves combat immediately and parks on feedback.
 * acknowledgeFeedback is what the UI calls when the impact animation ends.
 * Only that call may enter levelComplete or gameOver.
 */
export function startMatch(level, rng, hearts = level.playerHearts) {
  const playerHearts = Math.min(level.playerHearts, hearts);
  const rounds = planQuestions(level, rng, questionBudget(level, playerHearts)).map(
    (question) => ({
      question,
      options: createOptions(question, level, rng),
    }),
  );

  return {
    levelId: level.id,
    rounds,
    index: 0,
    phase: "playing",
    combat: createCombat(level, playerHearts),
    lastResult: null,
  };
}

export function currentRound(match) {
  return match.rounds[match.index] ?? null;
}

export function submitAnswer(match, optionIndex) {
  if (match.phase !== "playing") {
    throw new Error(`Cannot answer during phase "${match.phase}"`);
  }

  const round = currentRound(match);
  if (!round) {
    throw new Error("No question available");
  }
  if (
    !Number.isInteger(optionIndex) ||
    optionIndex < 0 ||
    optionIndex >= round.options.length
  ) {
    throw new Error(`Invalid option index: ${optionIndex}`);
  }

  const selectedValue = round.options[optionIndex];
  const correct = selectedValue === round.question.product;
  const combat = applyAnswer(match.combat, correct);

  return {
    ...match,
    combat,
    phase: correct ? "correctFeedback" : "incorrectFeedback",
    lastResult: {
      correct,
      optionIndex,
      selectedValue,
      correctValue: round.question.product,
      questionIndex: match.index,
      outcome: combat.outcome,
    },
  };
}

export function acknowledgeFeedback(match) {
  if (match.phase !== "correctFeedback" && match.phase !== "incorrectFeedback") {
    throw new Error(`Cannot acknowledge phase "${match.phase}"`);
  }

  if (match.combat.outcome === "playing") {
    return {
      ...match,
      phase: "playing",
      index: match.index + 1,
    };
  }

  return {
    ...match,
    phase: match.combat.outcome,
  };
}
