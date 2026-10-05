import assert from "node:assert/strict";
import test from "node:test";
import {
  createActors,
  createFeedback,
  easeOutCubic,
  playSteps,
  shakeOffset,
} from "../js/animations.js";

test("easeOutCubic stays inside 0..1 and leaves the midpoint early", () => {
  assert.equal(easeOutCubic(0), 0);
  assert.equal(easeOutCubic(1), 1);
  assert.ok(easeOutCubic(0.5) > 0.5);
});

test("shake stays at rest until trauma exists", () => {
  const actors = createActors({ id: "level-1", type: "combat" });
  actors.time = 400;
  assert.deepEqual(shakeOffset(actors), { x: 0, y: 0 });
  actors.trauma = 1;
  const offset = shakeOffset(actors);
  assert.ok(Math.abs(offset.x) + Math.abs(offset.y) > 0);
});

test("impact fires once, before the combat timeline ends", () => {
  const actors = createActors({ id: "level-1", type: "combat" });
  let impacts = 0;
  let knightAtImpact = null;
  const playback = createFeedback("correct", actors, {
    onImpact() {
      impacts += 1;
      knightAtImpact = actors.knight.x;
    },
  });

  let steps = 0;
  while (!playback.update(40) && steps < 80) {
    steps += 1;
  }

  assert.equal(impacts, 1);
  assert.equal(playback.done, true);
  assert.ok(knightAtImpact > actors.knight.restX);
  assert.equal(actors.dragon.spirit, 0);
  assert.equal(actors.posing, false);
});

test("finish still delivers a pending impact exactly once", () => {
  let impacts = 0;
  const playback = playSteps([
    { duration: 500, onStart: () => impacts++ },
    { duration: 500 },
  ]);
  playback.update(20);
  playback.finish();
  playback.finish();
  assert.equal(impacts, 1);
  assert.equal(playback.done, true);
});

test("the last heart fades the knight and raises a spirit", () => {
  const actors = createActors({ id: "level-1", type: "combat" });
  let impacts = 0;
  let ascents = 0;
  const playback = createFeedback("incorrect", actors, {
    defeated: true,
    onImpact() {
      impacts += 1;
    },
    onAscend() {
      ascents += 1;
    },
  });
  playback.finish();
  assert.equal(impacts, 1);
  assert.equal(ascents, 1);
  assert.equal(actors.knight.downed, true);
  assert.equal(actors.knight.alpha, 0);
  assert.equal(actors.knight.spirit, 1);
  assert.equal(actors.posing, false);
  assert.equal(actors.dragon.x, actors.dragon.restX);
  assert.equal(actors.dragon.spirit, 0);
});

test("felling the dragon raises its spirit before the timeline ends", () => {
  const actors = createActors({ id: "level-1", type: "combat" });
  let ascents = 0;
  const playback = createFeedback("correct", actors, {
    felled: true,
    onImpact() {},
    onAscend() {
      ascents += 1;
    },
  });
  playback.finish();
  assert.equal(ascents, 1);
  assert.equal(actors.dragon.downed, true);
  assert.equal(actors.dragon.alpha, 0);
  assert.equal(actors.dragon.spirit, 1);
  assert.equal(actors.knight.spirit, 0);
  assert.equal(actors.posing, false);
});

test("the treasure chest opens and raises a golden sword", () => {
  const actors = createActors({ id: "treasure", type: "treasure" });
  let swords = 0;
  const playback = createFeedback("correct", actors, {
    felled: true,
    onImpact() {},
    onSword() {
      swords += 1;
    },
  });
  playback.finish();
  assert.equal(swords, 1);
  assert.equal(actors.chest.open, 1);
  assert.equal(actors.chest.sword, 1);
  assert.equal(actors.posing, false);
});

test("a miss with hearts left leaves the knight standing", () => {
  const actors = createActors({ id: "level-3", type: "combat" });
  const playback = createFeedback("incorrect", actors, { onImpact() {} });
  playback.finish();
  assert.equal(actors.knight.downed, false);
  assert.equal(actors.knight.yield, 0);
  assert.equal(actors.posing, false);
});

test("reduced motion skips screen trauma on a hit", () => {
  const actors = createActors({ id: "level-2", type: "combat" });
  const playback = createFeedback("incorrect", actors, {
    reducedMotion: true,
    onImpact() {},
  });
  playback.finish();
  assert.equal(actors.trauma, 0);
  assert.equal(actors.posing, false);
});
