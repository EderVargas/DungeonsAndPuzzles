import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CHARACTERS, getCharacter } from "../js/characters.js";
import { acknowledgeFeedback, currentRound, startMatch, submitAnswer } from "../js/game-state.js";
import { GAEL_LEVELS, getLevel, levelsFor, questionBudget } from "../js/levels.js";
import { planPrompts, splitInitial } from "../js/prompts.js";
import { createRng } from "../js/rng.js";

describe("characters", () => {
  it("paints Leo larger, chestnut and green, and Gael smaller, darker and yellow", () => {
    const leo = getCharacter("leo");
    const gael = getCharacter("gael");
    assert.ok(leo.scale > gael.scale);
    assert.equal(leo.hair, "#8a5a32");
    assert.equal(leo.armor, "#3e8f4a");
    assert.equal(gael.hair, "#3a241c");
    assert.equal(gael.armor, "#e2b43a");
    assert.deepEqual(
      CHARACTERS.map((item) => item.id),
      ["leo", "gael"],
    );
  });
});

describe("planPrompts", () => {
  for (const level of GAEL_LEVELS) {
    it(`${level.id} deals 4 unique pictures and one spoken answer`, () => {
      const count = questionBudget(level, level.playerHearts);
      const rounds = planPrompts(level, createRng(5), count);
      assert.equal(rounds.length, count);
      for (const round of rounds) {
        assert.equal(round.options.length, 4);
        assert.equal(round.question.kind, level.prompt);
        const ids = round.options.map((item) => item.id);
        assert.equal(new Set(ids).size, 4);
        assert.equal(ids.filter((id) => id === round.question.answerId).length, 1);
        assert.equal(round.question.spoken, round.options.find((item) => item.id === round.question.answerId).spoken);
      }
    });
  }

  it("shuffles option order", () => {
    const level = getLevel("colors");
    const orders = new Set();
    for (let seed = 1; seed <= 12; seed += 1) {
      const [round] = planPrompts(level, createRng(seed), 1);
      orders.add(round.options.map((item) => item.id).join(","));
    }
    assert.ok(orders.size > 1);
  });

  it("keeps the first color rounds inside red, blue, yellow and green", () => {
    const level = getLevel("colors");
    const core = new Set(["red", "blue", "yellow", "green"]);
    for (let seed = 1; seed <= 20; seed += 1) {
      const rounds = planPrompts(level, createRng(seed), 6);
      for (const round of rounds.slice(0, level.warmUp)) {
        for (const option of round.options) {
          assert.ok(core.has(option.id), `${option.id} appeared during warm-up`);
        }
      }
    }
  });

  it("later color rounds can show orange and purple", () => {
    const level = getLevel("colors");
    const seen = new Set();
    for (let seed = 1; seed <= 30; seed += 1) {
      const rounds = planPrompts(level, createRng(seed), 6);
      for (const round of rounds.slice(level.warmUp)) {
        for (const option of round.options) {
          seen.add(option.id);
        }
      }
    }
    assert.ok(seen.has("orange"));
    assert.ok(seen.has("purple"));
  });

  it("asks each color once, and the new colors before repeating an opening color", () => {
    const level = getLevel("colors");
    const core = ["red", "blue", "yellow", "green"];
    const extra = ["orange", "purple"];
    for (let seed = 1; seed <= 30; seed += 1) {
      const rounds = planPrompts(level, createRng(seed), 6);
      const spoken = rounds.map((round) => round.question.answerId);
      assert.equal(new Set(spoken).size, 6, `seed ${seed} repeated a color`);
      assert.ok(core.includes(spoken[0]));
      assert.ok(core.includes(spoken[1]));
      assert.notEqual(spoken[0], spoken[1]);
      assert.deepEqual(spoken.slice(2, 4).slice().sort(), extra.slice().sort());
    }
  });

  it("asks every shape once before any shape is spoken again", () => {
    const level = getLevel("shapes");
    const ids = level.pool.map((item) => item.id);
    for (let seed = 1; seed <= 30; seed += 1) {
      const rounds = planPrompts(level, createRng(seed), 6);
      const spoken = rounds.map((round) => round.question.answerId);
      assert.deepEqual(spoken.slice(0, 4).slice().sort(), ids.slice().sort());
      assert.ok(ids.includes(spoken[4]));
      assert.ok(ids.includes(spoken[5]));
      assert.notEqual(spoken[4], spoken[3]);
    }
  });

  for (const id of ["numbers", "vowels"]) {
    it(`${id} speaks every item once before repeating`, () => {
      const level = getLevel(id);
      const ids = level.pool.map((item) => item.id);
      for (let seed = 1; seed <= 30; seed += 1) {
        const rounds = planPrompts(level, createRng(seed), 6);
        const spoken = rounds.map((round) => round.question.answerId);
        assert.deepEqual(spoken.slice(0, ids.length).slice().sort(), ids.slice().sort());
        assert.notEqual(spoken[ids.length], spoken[ids.length - 1]);
      }
    });
  }

  it("paints every shape in a round with the same ink", () => {
    const level = getLevel("shapes");
    const rounds = planPrompts(level, createRng(8), 4);
    for (const round of rounds) {
      assert.ok(round.question.ink);
      assert.equal(round.options.length, 4);
    }
  });

  it("marks the first letter of each vowel word", () => {
    const level = getLevel("vowels");
    for (const item of level.pool) {
      const parts = splitInitial(item.word);
      assert.equal(parts.lead.toLowerCase(), item.vowel);
      assert.equal(`${parts.lead}${parts.rest}`, item.word);
      assert.ok(parts.rest.length > 0);
    }
    assert.deepEqual(splitInitial("Isla"), { lead: "I", rest: "sla" });
    assert.deepEqual(splitInitial("Uvas"), { lead: "U", rest: "vas" });
  });
});

describe("gael match", () => {
  it("a correct touch hurts the dragon with the same combat rules", () => {
    const level = getLevel("colors");
    const match = startMatch(level, createRng(3));
    const round = currentRound(match);
    const index = round.options.findIndex((item) => item.id === round.question.answerId);
    const pending = submitAnswer(match, index);
    assert.equal(pending.lastResult.correct, true);
    assert.equal(pending.combat.dragonHp, level.dragonHp - 1);
    assert.equal(pending.combat.playerHearts, 3);
    assert.equal(acknowledgeFeedback(pending).phase, "playing");
  });

  it("a miss still costs a heart", () => {
    const level = getLevel("vowels");
    const match = startMatch(level, createRng(9));
    const round = currentRound(match);
    const index = round.options.findIndex((item) => item.id !== round.question.answerId);
    const pending = submitAnswer(match, index);
    assert.equal(pending.lastResult.correct, false);
    assert.equal(pending.combat.playerHearts, 2);
    assert.equal(pending.combat.dragonHp, level.dragonHp);
  });

  it("keeps Leo on the tables and Gael on the four caves", () => {
    assert.deepEqual(
      levelsFor("leo").map((item) => item.id),
      ["level-1", "level-2", "level-3", "treasure"],
    );
    assert.deepEqual(
      levelsFor("gael").map((item) => item.id),
      ["colors", "shapes", "numbers", "vowels"],
    );
  });
});
