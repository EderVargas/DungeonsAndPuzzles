import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createOptions } from "../js/answers.js";
import { createRng } from "../js/rng.js";

const question = { a: 2, b: 3, product: 6 };

function assertChoiceRules(options, product) {
  assert.equal(new Set(options).size, options.length);
  assert.equal(options.filter((value) => value === product).length, 1);
  assert.ok(options.every((value) => Number.isInteger(value) && value >= 1));
}

describe("createOptions", () => {
  it("sameTable uses the nearest products of that table", () => {
    const level = {
      answerMode: { type: "sameTable" },
      optionCount: 4,
      factorMin: 1,
      factorMax: 10,
    };
    const options = createOptions(question, level, createRng(1));
    assertChoiceRules(options, 6);
    assert.deepEqual([...options].sort((a, b) => a - b), [2, 4, 6, 8]);
    assert.ok(options.every((value) => value % question.a === 0));
  });

  it("sameTable shuffles option order across seeds", () => {
    const level = {
      answerMode: "sameTable",
      optionCount: 4,
      factorMin: 1,
      factorMax: 10,
    };
    const orders = new Set();
    for (let seed = 1; seed <= 20; seed += 1) {
      orders.add(createOptions(question, level, createRng(seed)).join(","));
    }
    assert.ok(orders.size > 1);
  });

  it("nearby stays inside the deviation window and can include non-multiples", () => {
    const level = {
      answerMode: { type: "nearby", deviation: 2 },
      optionCount: 4,
    };
    for (let seed = 1; seed <= 30; seed += 1) {
      const options = createOptions(question, level, createRng(seed));
      assertChoiceRules(options, 6);
      for (const value of options) {
        if (value !== 6) {
          assert.ok(value >= 4 && value <= 8);
        }
      }
    }
  });

  it("nearby widens the window when the product sits near 1", () => {
    const level = {
      answerMode: { type: "nearby", deviation: 2 },
      optionCount: 4,
    };
    const low = { a: 1, b: 1, product: 1 };
    const options = createOptions(low, level, createRng(3));
    assertChoiceRules(options, 1);
    assert.deepEqual([...options].sort((a, b) => a - b), [1, 2, 3, 4]);
  });

  it("a wider deviation can place a distractor farther away", () => {
    const narrow = {
      answerMode: { type: "nearby", deviation: 1 },
      optionCount: 4,
    };
    const wide = {
      answerMode: { type: "nearby", deviation: 8 },
      optionCount: 4,
    };
    const high = { a: 10, b: 5, product: 50 };
    let sawFar = false;
    for (let seed = 1; seed <= 40; seed += 1) {
      const options = createOptions(high, wide, createRng(seed));
      assertChoiceRules(options, 50);
      if (options.some((value) => Math.abs(value - 50) > 2)) {
        sawFar = true;
      }
      const close = createOptions(high, narrow, createRng(seed));
      for (const value of close) {
        assert.ok(Math.abs(value - 50) <= 2);
      }
    }
    assert.equal(sawFar, true);
  });

  it("rejects an unknown answer mode", () => {
    assert.throws(
      () =>
        createOptions(question, { answerMode: { type: "wild" }, optionCount: 4 }, createRng(1)),
      /Unknown answer mode/,
    );
  });
});
