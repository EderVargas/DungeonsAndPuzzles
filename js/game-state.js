import { createOptions } from "./answers.js";
import { applyAnswer, createCombat } from "./combat.js";
import { questionBudget } from "./levels.js";
import { planPrompts } from "./prompts.js";
import { planQuestions } from "./questions.js";

/**
 * Phase machine for one match.
 * submitAnswer resolves combat immediately and parks on feedback.
 * acknowledgeFeedback is what the UI calls when the impact animation ends.
 * Only that call may enter levelComplete or gameOver.
 */
export function startMatch(level, rng, hearts = level.playerHearts) {
  const playerHearts = Math.min(level.playerHearts, hearts);
  const budget = questionBudget(level, playerHearts);
  const rounds = level.prompt
    ? planPrompts(level, rng, budget)
    : planQuestions(level, rng, budget).map((question) => ({
        question,
        options: createOptions(question, level, rng),
      }));

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

  const selected = round.options[optionIndex];
  const selectedValue = selected && typeof selected === "object" ? selected.id : selected;
  const correctValue = round.question.answerId ?? round.question.product;
  const correct = selectedValue === correctValue;
  const combat = applyAnswer(match.combat, correct);

  return {
    ...match,
    combat,
    phase: correct ? "correctFeedback" : "incorrectFeedback",
    lastResult: {
      correct,
      optionIndex,
      selectedValue,
      correctValue,
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
