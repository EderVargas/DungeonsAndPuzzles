import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyAnswer, createCombat, resolveOutcome } from "../js/combat.js";
import { getLevel } from "../js/levels.js";

describe("combat", () => {
  it("reads rival HP from configuration and starts a new attempt at full hearts", () => {
    const combat = createCombat(getLevel("level-1"));
    assert.equal(combat.playerHearts, 3);
    assert.equal(combat.playerHeartsMax, 3);
    assert.equal(combat.dragonHp, 4);
    assert.equal(combat.dragonHpMax, 4);
    assert.equal(combat.outcome, "playing");

    assert.equal(createCombat(getLevel("level-2")).dragonHp, 5);
    assert.equal(createCombat(getLevel("level-3")).dragonHp, 6);
    assert.equal(createCombat(getLevel("treasure")).dragonHp, 3);
  });

  it("a hit removes dragon HP and a miss removes a heart", () => {
    const start = createCombat(getLevel("level-1"));
    const hit = applyAnswer(start, true);
    assert.equal(hit.dragonHp, 3);
    assert.equal(hit.playerHearts, 3);
    assert.equal(hit.correctAnswers, 1);
    assert.equal(hit.questionsAnswered, 1);
    assert.equal(hit.outcome, "playing");

    const miss = applyAnswer(hit, false);
    assert.equal(miss.dragonHp, 3);
    assert.equal(miss.playerHearts, 2);
    assert.equal(miss.correctAnswers, 1);
    assert.equal(miss.outcome, "playing");
  });

  it("clears the level on the hit that drops the rival to 0", () => {
    let combat = createCombat(getLevel("level-1"));
    for (let i = 0; i < 3; i += 1) combat = applyAnswer(combat, true);
    assert.equal(combat.dragonHp, 1);
    assert.equal(resolveOutcome(combat), "playing");

    combat = applyAnswer(combat, true);
    assert.equal(combat.dragonHp, 0);
    assert.equal(combat.questionsAnswered, 4);
    assert.equal(combat.outcome, "levelComplete");
  });

  it("ends the attempt on the miss that removes the last heart", () => {
    let combat = createCombat(getLevel("level-1"));
    combat = applyAnswer(combat, false);
    combat = applyAnswer(combat, false);
    assert.equal(combat.playerHearts, 1);
    assert.equal(combat.outcome, "playing");

    combat = applyAnswer(combat, false);
    assert.equal(combat.playerHearts, 0);
    assert.equal(combat.questionsAnswered, 3);
    assert.equal(combat.outcome, "gameOver");
  });

  it("keeps carried hearts instead of refilling them", () => {
    const combat = createCombat(getLevel("level-2"), 2);
    assert.equal(combat.playerHearts, 2);
    assert.equal(combat.playerHeartsMax, 3);
    assert.equal(combat.dragonHp, 5);
    const miss = applyAnswer(combat, false);
    assert.equal(miss.playerHearts, 1);
    assert.equal(miss.outcome, "playing");
  });

  it("does not mutate the previous combat snapshot", () => {
    const start = createCombat(getLevel("level-1"));
    applyAnswer(start, true);
    assert.equal(start.dragonHp, 4);
    assert.equal(start.questionsAnswered, 0);
  });
});
