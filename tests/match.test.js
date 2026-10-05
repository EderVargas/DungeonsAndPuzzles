import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  acknowledgeFeedback,
  currentRound,
  startMatch,
  submitAnswer,
} from "../js/game-state.js";
import { getLevel, questionBudget } from "../js/levels.js";
import { createRng } from "../js/rng.js";

function correctIndex(match) {
  const round = currentRound(match);
  return round.options.indexOf(round.question.product);
}

function wrongIndex(match) {
  const round = currentRound(match);
  return round.options.findIndex((value) => value !== round.question.product);
}

function play(match, wantsCorrect) {
  const index = wantsCorrect ? correctIndex(match) : wrongIndex(match);
  return acknowledgeFeedback(submitAnswer(match, index));
}

describe("match", () => {
  it("ends level 1 when the fourth hit drops the dragon", () => {
    const level = getLevel("level-1");
    let match = startMatch(level, createRng(4));
    assert.equal(match.rounds.length, questionBudget(level, 3));
    assert.equal(match.combat.dragonHp, 4);
    assert.equal(match.phase, "playing");

    for (let i = 0; i < 3; i += 1) {
      match = play(match, true);
    }
    assert.equal(match.combat.dragonHp, 1);
    assert.equal(match.phase, "playing");

    match = play(match, true);
    assert.equal(match.phase, "levelComplete");
    assert.equal(match.combat.dragonHp, 0);
    assert.equal(match.combat.playerHearts, 3);
    assert.equal(match.index, 3);
  });

  it("keeps the feedback phase until the animation is acknowledged", () => {
    const match = startMatch(getLevel("level-1"), createRng(9));
    const pending = submitAnswer(match, correctIndex(match));
    assert.equal(pending.phase, "correctFeedback");
    assert.equal(pending.combat.questionsAnswered, 1);
    assert.equal(pending.combat.outcome, "playing");
    assert.equal(pending.index, 0);
    assert.throws(() => submitAnswer(pending, 0), /Cannot answer during phase/);

    const next = acknowledgeFeedback(pending);
    assert.equal(next.phase, "playing");
    assert.equal(next.index, 1);
  });

  it("the miss that removes the last heart resolves before the phase becomes terminal", () => {
    let match = startMatch(getLevel("level-1"), createRng(11));
    match = play(match, false);
    match = play(match, false);
    assert.equal(match.phase, "playing");
    assert.equal(match.combat.playerHearts, 1);

    const pending = submitAnswer(match, wrongIndex(match));
    assert.equal(pending.phase, "incorrectFeedback");
    assert.equal(pending.combat.outcome, "gameOver");
    assert.equal(pending.combat.playerHearts, 0);

    const done = acknowledgeFeedback(pending);
    assert.equal(done.phase, "gameOver");
  });

  it("level 2 falls on the fifth hit and survives a miss while hearts remain", () => {
    let match = startMatch(getLevel("level-2"), createRng(2));
    for (let i = 0; i < 4; i += 1) {
      match = play(match, true);
    }
    assert.equal(match.phase, "playing");
    assert.equal(match.combat.dragonHp, 1);

    match = play(match, false);
    assert.equal(match.phase, "playing");
    assert.equal(match.combat.playerHearts, 2);

    match = play(match, true);
    assert.equal(match.phase, "levelComplete");
    assert.equal(match.combat.dragonHp, 0);
    assert.equal(match.combat.playerHearts, 2);
  });

  it("carries the hearts left after level 1 into level 2", () => {
    let match = startMatch(getLevel("level-1"), createRng(4));
    match = play(match, true);
    match = play(match, false);
    match = play(match, true);
    match = play(match, true);
    match = play(match, true);
    assert.equal(match.phase, "levelComplete");
    assert.equal(match.combat.playerHearts, 2);
    assert.equal(match.combat.dragonHp, 0);

    const next = startMatch(getLevel("level-2"), createRng(4), match.combat.playerHearts);
    assert.equal(next.combat.playerHearts, 2);
    assert.equal(next.combat.playerHeartsMax, 3);
    assert.equal(next.combat.dragonHp, 5);
    assert.equal(next.rounds.length, questionBudget(getLevel("level-2"), 2));
  });

  it("opens the chest after 3 hits and still allows a miss while hearts remain", () => {
    let win = startMatch(getLevel("treasure"), createRng(6));
    assert.equal(win.combat.dragonHp, 3);
    assert.equal(win.rounds.length, questionBudget(getLevel("treasure"), 3));
    win = play(win, true);
    win = play(win, false);
    assert.equal(win.phase, "playing");
    assert.equal(win.combat.playerHearts, 2);
    win = play(win, true);
    win = play(win, true);
    assert.equal(win.phase, "levelComplete");
    assert.equal(win.combat.dragonHp, 0);
    for (const table of [9, 10]) {
      assert.ok(win.rounds.some((round) => round.question.a === table));
    }

    let lose = startMatch(getLevel("treasure"), createRng(6), 1);
    lose = play(lose, false);
    assert.equal(lose.phase, "gameOver");
    assert.equal(lose.combat.playerHearts, 0);
  });

  it("rejects an option index outside the buttons", () => {
    const match = startMatch(getLevel("level-1"), createRng(1));
    assert.throws(() => submitAnswer(match, 4), /Invalid option index/);
  });
});
