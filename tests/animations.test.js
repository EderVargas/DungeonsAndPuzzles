import assert from "node:assert/strict";
import test from "node:test";
import {
  createActors,
  createFeedback,
  easeOutCubic,
  playSteps,
  shakeOffset,
  swordTip,
  tickAmbient,
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

test("a correct hit plants the sword tip on the dragon and holds the flinch", () => {
  for (const id of ["level-1", "level-2", "level-3"]) {
    const actors = createActors({ id, type: "combat" });
    let tip = null;
    let windup = 0;
    let closed = 0;
    const playback = createFeedback("correct", actors, {
      onImpact() {
        tip = swordTip(actors.knight);
      },
    });

    let steps = 0;
    while (!playback.update(10) && steps < 200) {
      windup = Math.min(windup, actors.knight.swing);
      if (actors.dragon.hurt > 0.5) {
        closed += 10;
      }
      steps += 1;
    }

    const reach = actors.dragon.restX - tip.x;
    assert.ok(windup < -0.2, `${id} should wind the sword back`);
    assert.ok(actors.knight.swing === 0, `${id} should return the sword`);
    assert.ok(tip.x === actors.slash.x && tip.y === actors.slash.y, `${id} slash should start at the tip`);
    assert.ok(reach > 24 && reach < 80 * actors.dragon.scale, `${id} tip should meet the near flank`);
    assert.ok(Math.abs(tip.y - actors.dragon.restY) < 48, `${id} tip should stay on the body`);
    assert.ok(closed >= 220 && closed <= 300, `${id} flinch should last about 220 ms`);
    assert.equal(actors.dragon.hurt, 0);
    assert.equal(actors.posing, false);
  }
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
  let ascended = null;
  const playback = createFeedback("incorrect", actors, {
    defeated: true,
    onImpact() {
      impacts += 1;
    },
    onAscend(who) {
      ascended = who;
    },
  });
  playback.finish();
  assert.equal(impacts, 1);
  assert.equal(ascended, "knight");
  assert.equal(actors.knight.downed, true);
  assert.equal(actors.knight.alpha, 0);
  assert.equal(actors.knight.spirit, 1);
  assert.equal(actors.posing, false);
  assert.equal(actors.dragon.x, actors.dragon.restX);
  assert.equal(actors.dragon.spirit, 0);
});

test("felling the dragon raises its spirit before the timeline ends", () => {
  const actors = createActors({ id: "level-1", type: "combat" });
  let ascended = null;
  const playback = createFeedback("correct", actors, {
    felled: true,
    onImpact() {},
    onAscend(who) {
      ascended = who;
    },
  });
  playback.finish();
  assert.equal(ascended, "dragon");
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

test("a miss winds the dragon up, breathes, and holds the knight's flinch", () => {
  const actors = createActors({ id: "level-2", type: "combat" });
  const playback = createFeedback("incorrect", actors, { onImpact() {} });
  let pulled = 0;
  let reached = actors.dragon.restX;
  let wings = 0;
  let breath = 0;
  let closed = 0;
  let steps = 0;
  while (!playback.update(10) && steps < 400) {
    pulled = Math.max(pulled, actors.dragon.x);
    reached = Math.min(reached, actors.dragon.x);
    wings = Math.max(wings, actors.dragon.flap);
    breath = Math.max(breath, actors.dragon.breath);
    if (actors.knight.hurt > 0.5) {
      closed += 10;
    }
    steps += 1;
  }
  assert.ok(pulled > actors.dragon.restX + 8, "the dragon should rear back");
  assert.ok(wings > 0.7, "the wings should rise before the bite");
  assert.ok(breath > 0.9, "the breath should reach the knight");
  assert.ok(reached < actors.dragon.restX - 80, "the dragon should lunge forward");
  assert.ok(closed >= 220 && closed <= 420, "the knight should flinch for about 220 ms");
  assert.equal(actors.knight.downed, false);
  assert.equal(actors.knight.hurt, 0);
  assert.equal(actors.knight.yield, 0);
  assert.equal(actors.dragon.breath, 0);
  assert.equal(actors.posing, false);
});

test("impact holds the hit pose before the dragon recoils", () => {
  const actors = createActors({ id: "level-1", type: "combat" });
  const playback = createFeedback("correct", actors, { onImpact() {} });
  let elapsed = 0;
  let frozen = null;
  let recoiling = null;
  while (!playback.update(10) && elapsed < 2000) {
    elapsed += 10;
    if (elapsed === 360) {
      frozen = actors.dragon.x;
    }
    if (elapsed === 460) {
      recoiling = actors.dragon.x;
    }
  }
  assert.equal(frozen, actors.dragon.restX);
  assert.ok(recoiling > actors.dragon.restX);
});

test("each cave flaps its wings at its own pace", () => {
  const flaps = ["level-1", "level-2", "level-3"].map((id) => {
    const actors = createActors({ id, type: "combat" });
    tickAmbient(actors, 700);
    return actors.dragon.flap;
  });
  assert.ok(flaps[0] > 0.08 && flaps[0] < 0.14);
  assert.ok(flaps[1] > 0.18 && flaps[1] < 0.26);
  assert.ok(flaps[2] > 0.32 && flaps[2] < 0.4);
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
