import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { LEVELS, questionBudget } from "../js/levels.js";
import { planQuestions } from "../js/questions.js";
import { createRng } from "../js/rng.js";

function pairs(questions) {
  return questions.map((question) => `${question.a}x${question.b}`);
}

describe("planQuestions", () => {
  for (const level of LEVELS) {
    it(`${level.id} covers every table, stays in range, and does not repeat pairs`, () => {
      for (let seed = 1; seed <= 40; seed += 1) {
        const count = questionBudget(level, level.playerHearts);
        const questions = planQuestions(level, createRng(seed), count);
        assert.equal(questions.length, count);

        for (const table of level.tables) {
          assert.ok(
            questions.some((question) => question.a === table),
            `seed ${seed} missing table ${table}`,
          );
        }

        for (const question of questions) {
          assert.ok(level.tables.includes(question.a));
          assert.ok(question.b >= level.factorMin && question.b <= level.factorMax);
          assert.equal(question.product, question.a * question.b);
        }

        assert.equal(new Set(pairs(questions)).size, questions.length);
      }
    });
  }

  it("same seed rebuilds the same level-1 plan", () => {
    const level = LEVELS[0];
    const count = questionBudget(level, level.playerHearts);
    const first = planQuestions(level, createRng(7), count);
    const second = planQuestions(level, createRng(7), count);
    assert.deepEqual(first, second);
  });

  it("different seeds can change the level-1 plan", () => {
    const level = LEVELS[0];
    const seen = new Set();
    for (let seed = 1; seed <= 30; seed += 1) {
      const count = questionBudget(level, level.playerHearts);
      seen.add(JSON.stringify(planQuestions(level, createRng(seed), count)));
    }
    assert.ok(seen.size > 1);
  });

  it("rejects a question count that cannot cover every table", () => {
    const level = {
      ...LEVELS[0],
      tables: [1, 2, 3],
    };
    assert.throws(() => planQuestions(level, createRng(1), 2), /question count 2/);
  });
});
