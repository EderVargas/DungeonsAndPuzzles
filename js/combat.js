/**
 * Combat math resolves as soon as an answer is chosen.
 * A hit that drops the rival to 0 HP clears the level.
 * A miss that drops the knight to 0 hearts ends the attempt.
 * There is no fixed question count.
 */
export function createCombat(level, playerHearts = level.playerHearts) {
  const combat = {
    playerHearts,
    playerHeartsMax: level.playerHearts,
    dragonHp: level.dragonHp,
    dragonHpMax: level.dragonHp,
    damagePerHit: level.damagePerHit ?? 1,
    heartLossPerMiss: level.heartLossPerMiss ?? 1,
    questionsAnswered: 0,
    correctAnswers: 0,
    outcome: "playing",
  };
  combat.outcome = resolveOutcome(combat);
  return combat;
}

export function resolveOutcome(combat) {
  if (combat.playerHearts <= 0) {
    return "gameOver";
  }
  if (combat.dragonHp <= 0) {
    return "levelComplete";
  }
  return "playing";
}

export function applyAnswer(combat, isCorrect) {
  const next = {
    ...combat,
    questionsAnswered: combat.questionsAnswered + 1,
    correctAnswers: combat.correctAnswers + (isCorrect ? 1 : 0),
    dragonHp: Math.max(
      0,
      combat.dragonHp - (isCorrect ? combat.damagePerHit : 0),
    ),
    playerHearts: Math.max(
      0,
      combat.playerHearts - (isCorrect ? 0 : combat.heartLossPerMiss),
    ),
  };
  next.outcome = resolveOutcome(next);
  return next;
}
