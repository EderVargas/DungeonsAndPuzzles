/**
 * Short combat timelines. They move actors only.
 * Hearts and dragon HP stay with the UI until onImpact fires.
 */

export function easeInCubic(t) {
  return t * t * t;
}

export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
}

export function lerp(from, to, t) {
  return from + (to - from) * t;
}

const KNIGHT_DRAW = 1.38;
const SWORD_PIVOT_X = 22;
const SWORD_PIVOT_Y = -34;
const SWORD_TIP = 46;
const SWORD_REST = 0.55;
const SWORD_ARC = 1.65;
const STRIKE_SX = 0.92;
const STRIKE_SY = 1.12;

export function swordAngle(swing = 0) {
  return SWORD_REST + swing * SWORD_ARC;
}

function drawScale(knight) {
  return KNIGHT_DRAW * (knight.look?.scale ?? 1);
}

export function swordTip(knight) {
  const angle = swordAngle(knight.swing ?? 0);
  const scaleX = (knight.sx ?? 1) * drawScale(knight);
  const scaleY = (knight.sy ?? 1) * drawScale(knight);
  const localX = SWORD_PIVOT_X + SWORD_TIP * Math.sin(angle);
  const localY = SWORD_PIVOT_Y - SWORD_TIP * Math.cos(angle);
  const body = (knight.yield ?? 0) * 0.22;
  const scaledX = localX * scaleX;
  const scaledY = localY * scaleY;
  const cos = Math.cos(body);
  const sin = Math.sin(body);
  return {
    x: knight.x + scaledX * cos - scaledY * sin,
    y: knight.y + scaledX * sin + scaledY * cos,
  };
}

function flankOf(dragon) {
  const localX = -48 * dragon.scale;
  const localY = 6 * dragon.scale;
  const tilt = 0.22;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  return {
    x: dragon.restX + localX * cos - localY * sin,
    y: dragon.restY + localX * sin + localY * cos,
  };
}

function strikePose(knight, dragon) {
  const flank = flankOf(dragon);
  const draw = drawScale(knight);
  const scaleY = STRIKE_SY * draw;
  const neededLocalY = (flank.y - knight.restY) / scaleY;
  const cos = Math.max(-1, Math.min(1, (SWORD_PIVOT_Y - neededLocalY) / SWORD_TIP));
  const angle = Math.acos(cos);
  const localX = SWORD_PIVOT_X + SWORD_TIP * Math.sin(angle);
  return {
    x: flank.x - localX * STRIKE_SX * draw,
    swing: (angle - SWORD_REST) / SWORD_ARC,
  };
}

const DRAGON_TINT = {
  "level-1": "#6fbf73",
  "level-2": "#4aa3c7",
  "level-3": "#e08a62",
  colors: "#c98adf",
  shapes: "#4aa3c7",
  numbers: "#6fbf73",
  vowels: "#f0c14a",
};

export function createActors(level, character = null) {
  const dragonScale = level.id === "level-1" ? 1.08 : level.id === "level-3" ? 1.5 : 1.28;
  const dragonY = 468 - 78 * dragonScale;
  return {
    levelId: level.id,
    mode: level.type,
    reduced: false,
    time: 0,
    trauma: 0,
    posing: false,
    knight: {
      x: 250,
      y: 430,
      restX: 250,
      restY: 430,
      sx: 1,
      sy: 1,
      flash: 0,
      yield: 0,
      swing: 0,
      hurt: 0,
      alpha: 1,
      spirit: 0,
      downed: false,
      look: character
        ? {
            hair: character.hair,
            armor: character.armor,
            armorLight: character.armorLight,
            scale: character.scale,
          }
        : null,
    },
    dragon: {
      x: 710,
      y: dragonY,
      restX: 710,
      restY: dragonY,
      scale: dragonScale,
      sx: 1,
      sy: 1,
      flash: 0,
      alpha: 1,
      spirit: 0,
      downed: false,
      tint: DRAGON_TINT[level.id] ?? "#6fbf73",
      sleepy: false,
      hurt: 0,
      flap: 0,
      bite: 0,
      breath: 0,
    },
    chest: { x: 700, y: 400, sx: 1, sy: 1, open: 0, openTarget: 0, flash: 0, sword: 0 },
    slash: { x: 560, y: 300, life: 0, angle: -0.6 },
    particles: [],
  };
}

export function shakeOffset(actors) {
  if (actors.reduced || actors.trauma <= 0) {
    return { x: 0, y: 0 };
  }
  const amount = actors.trauma * actors.trauma;
  const t = actors.time / 1000;
  return {
    x: amount * 12 * (0.6 * Math.sin(t * 11 + 0.4) + 0.4 * Math.sin(t * 23)),
    y: amount * 7 * (0.6 * Math.sin(t * 13 + 1.2) + 0.4 * Math.sin(t * 19)),
  };
}

export function tickAmbient(actors, dt) {
  actors.time += dt;
  const seconds = dt / 1000;
  if (actors.trauma > 0) {
    actors.trauma = Math.max(0, actors.trauma - 1.35 * seconds);
  }
  fade(actors.knight, seconds);
  fade(actors.dragon, seconds);
  fade(actors.chest, seconds);
  if (actors.slash.life > 0) {
    actors.slash.life = Math.max(0, actors.slash.life - seconds * 2.4);
  }

  const chest = actors.chest;
  chest.open = lerp(chest.open, chest.openTarget, Math.min(1, dt / 180));

  for (let i = actors.particles.length - 1; i >= 0; i -= 1) {
    const spark = actors.particles[i];
    spark.life -= dt;
    spark.x += spark.vx * seconds;
    spark.y += spark.vy * seconds;
    spark.vy += 90 * seconds;
    if (spark.life <= 0) {
      actors.particles.splice(i, 1);
    }
  }

  if (!actors.posing) {
    const knight = actors.knight;
    if (knight.downed) {
      knight.alpha = 0;
      knight.spirit = 1;
      knight.x = knight.restX;
      knight.y = knight.restY;
      knight.sx = 1;
      knight.sy = 1;
      knight.swing = 0;
    } else {
      knight.yield = 0;
      knight.swing = 0;
      knight.hurt = 0;
      knight.y = knight.restY + Math.sin(actors.time / 320) * 5;
      knight.sx = 1;
      knight.sy = 1;
    }
    const dragon = actors.dragon;
    if (dragon.downed) {
      dragon.alpha = 0;
      dragon.spirit = 1;
      dragon.x = dragon.restX;
      dragon.sx = 1;
      dragon.sy = 1;
      dragon.flap = 0;
      dragon.bite = 0;
      dragon.breath = 0;
    } else {
      const idle = wingIdle(actors.levelId, actors.time);
      dragon.x = dragon.restX;
      dragon.hurt = 0;
      dragon.bite = 0;
      dragon.breath = 0;
      dragon.flap = idle.flap;
      dragon.sx = 1;
      dragon.sy = 1 + idle.breath * 0.045;
    }
    actors.chest.sx = 1;
    actors.chest.sy = 1;
  }
}

export function createFeedback(kind, actors, hooks) {
  actors.posing = true;
  actors.reduced = Boolean(hooks.reducedMotion);
  const scale = actors.reduced ? 0.4 : 1;
  const duration = (ms) => Math.max(16, Math.round(ms * scale));
  const steps =
    actors.mode === "treasure"
      ? treasureSteps(kind, actors, hooks, duration)
      : combatSteps(kind, actors, hooks, duration);
  return playSteps(steps);
}

export function playSteps(steps) {
  let index = 0;
  let elapsed = 0;
  let opened = false;

  function open() {
    if (opened || index >= steps.length) {
      return;
    }
    opened = true;
    steps[index].onStart?.();
  }

  function closeAndAdvance() {
    steps[index].onEnd?.();
    index += 1;
    elapsed = 0;
    opened = false;
  }

  return {
    get done() {
      return index >= steps.length;
    },
    update(dt) {
      if (index >= steps.length) {
        return true;
      }
      open();
      elapsed += dt;
      const step = steps[index];
      const raw = step.duration <= 0 ? 1 : Math.min(1, elapsed / step.duration);
      const t = step.ease ? step.ease(raw) : raw;
      step.onUpdate?.(t, raw);
      if (raw >= 1) {
        closeAndAdvance();
      }
      return index >= steps.length;
    },
    finish() {
      while (index < steps.length) {
        open();
        steps[index].onUpdate?.(1, 1);
        closeAndAdvance();
      }
    },
  };
}

function combatSteps(kind, actors, hooks, duration) {
  const knight = actors.knight;
  const dragon = actors.dragon;
  const correct = kind === "correct";

  if (correct) {
    const strike = strikePose(knight, dragon);
    const windup = -0.42;
    const follow = strike.swing + 0.2;
    const steps = [
      {
        duration: duration(160),
        ease: easeOutBack,
        onUpdate(t) {
          knight.sx = lerp(1, 1.16, t);
          knight.sy = lerp(1, 0.84, t);
          knight.x = lerp(knight.restX, knight.restX - 22, t);
          knight.swing = lerp(0, windup, t);
        },
      },
      {
        duration: duration(130),
        ease: easeInCubic,
        onUpdate(t) {
          knight.x = lerp(knight.restX - 22, strike.x, t);
          knight.sx = lerp(1.16, STRIKE_SX, t);
          knight.sy = lerp(0.84, STRIKE_SY, t);
          knight.swing = lerp(windup, strike.swing, t);
        },
      },
      {
        duration: duration(40),
        onStart() {
          knight.x = strike.x;
          knight.sx = STRIKE_SX;
          knight.sy = STRIKE_SY;
          knight.swing = strike.swing;
          landStrike(actors, true);
          hooks.onImpact?.();
        },
      },
      {
        duration: duration(220),
        onUpdate(_t, raw) {
          const moving = unfreeze(raw, actors, 0.28);
          if (moving === null) {
            dragon.hurt = 1;
            actors.slash.life = 1;
            return;
          }
          const wave = Math.sin(moving * Math.PI);
          dragon.x = lerp(dragon.restX, dragon.restX + 34, wave);
          dragon.sx = lerp(1, 1.14, wave);
          dragon.sy = lerp(1, 0.86, wave);
          dragon.hurt = 0.72 + 0.28 * wave;
          knight.swing = lerp(strike.swing, follow, easeOutCubic(Math.min(1, moving * 1.35)));
          actors.slash.life = 1 - moving * 0.85;
        },
      },
      {
        duration: duration(200),
        ease: easeOutCubic,
        onUpdate(t) {
          knight.x = lerp(strike.x, knight.restX, t);
          knight.sx = lerp(STRIKE_SX, 1, t);
          knight.sy = lerp(STRIKE_SY, 1, t);
          knight.swing = lerp(follow, 0, t);
          dragon.x = lerp(dragon.x, dragon.restX, t);
          dragon.sx = lerp(dragon.sx, 1, t);
          dragon.sy = lerp(dragon.sy, 1, t);
          dragon.hurt = lerp(dragon.hurt, 0, t);
        },
        onEnd() {
          knight.swing = 0;
          knight.sx = 1;
          knight.sy = 1;
          dragon.hurt = 0;
          dragon.x = dragon.restX;
          dragon.sx = 1;
          dragon.sy = 1;
          if (!hooks.felled) {
            actors.posing = false;
          }
        },
      },
    ];
    if (hooks.felled) {
      steps.push(...spiritSteps(actors, "dragon", duration, hooks));
    }
    return steps;
  }

  const steps = [
    {
      duration: duration(180),
      ease: easeOutBack,
      onUpdate(t) {
        dragon.flap = lerp(0, 1, t);
        dragon.bite = lerp(0, 1, t);
        dragon.sx = lerp(1, 1.12, t);
        dragon.sy = lerp(1, 0.88, t);
        dragon.x = lerp(dragon.restX, dragon.restX + 22, t);
      },
    },
    {
      duration: duration(140),
      ease: easeInCubic,
      onUpdate(t) {
        dragon.x = lerp(dragon.restX + 22, dragon.restX - 188, t);
        dragon.sx = lerp(1.12, 0.9, t);
        dragon.sy = lerp(0.88, 1.1, t);
        dragon.flap = lerp(1, -0.35, t);
        dragon.bite = 1;
        dragon.breath = t;
      },
    },
    {
      duration: duration(40),
      onStart() {
        dragon.breath = 1;
        knight.hurt = 1;
        landStrike(actors, false);
        hooks.onImpact?.();
      },
    },
    {
      duration: duration(240),
      onUpdate(_t, raw) {
        const moving = unfreeze(raw, actors, 0.25);
        if (moving === null) {
          knight.hurt = 1;
          knight.x = knight.restX;
          return;
        }
        const wave = Math.sin(moving * Math.PI);
        knight.x = lerp(knight.restX, knight.restX - 36, wave);
        knight.sx = lerp(1, 1.16, wave);
        knight.sy = lerp(1, 0.82, wave);
        knight.yield = wave * 0.9;
        knight.hurt = 0.72 + 0.28 * wave;
        dragon.x = lerp(dragon.restX - 188, dragon.restX - 36, easeOutCubic(moving));
        dragon.breath = 1 - moving;
        dragon.bite = 1 - moving;
        dragon.flap = lerp(-0.35, 0, moving);
      },
    },
  ];
  if (hooks.defeated) {
    steps.push(...spiritSteps(actors, "knight", duration, hooks));
  } else {
    steps.push(recoverSteps(actors, duration));
  }
  return steps;
}

function recoverSteps(actors, duration) {
  const knight = actors.knight;
  const dragon = actors.dragon;
  return {
    duration: duration(200),
    ease: easeOutCubic,
    onStart() {
      knight.hurtFrom = knight.hurt;
      knight.yieldFrom = knight.yield;
    },
    onUpdate(t) {
      dragon.x = lerp(dragon.restX - 36, dragon.restX, t);
      dragon.sx = 1;
      dragon.sy = 1;
      dragon.flap = lerp(dragon.flap, 0, t);
      dragon.bite = lerp(dragon.bite, 0, t);
      dragon.breath = lerp(dragon.breath, 0, t);
      knight.x = lerp(knight.x, knight.restX, t);
      knight.sx = 1;
      knight.sy = 1;
      knight.hurt = lerp(knight.hurtFrom ?? 0, 0, t);
      knight.yield = lerp(knight.yieldFrom ?? 0, 0, t);
    },
    onEnd() {
      knight.hurt = 0;
      knight.yield = 0;
      dragon.flap = 0;
      dragon.bite = 0;
      dragon.breath = 0;
      dragon.x = dragon.restX;
      actors.posing = false;
    },
  };
}

function spiritSteps(actors, who, duration, hooks) {
  const actor = actors[who];
  const other = who === "knight" ? actors.dragon : actors.knight;
  return [
    {
      duration: duration(520),
      ease: easeOutCubic,
      onStart() {
        actor.fromX = actor.x;
        actor.fromY = actor.y;
        actor.fromSx = actor.sx;
        actor.fromSy = actor.sy;
        other.fromX = other.x;
        other.fromSx = other.sx;
        other.fromSy = other.sy;
      },
      onUpdate(t) {
        actor.alpha = lerp(1, 0, t);
        actor.x = lerp(actor.fromX, actor.restX, t);
        actor.y = lerp(actor.fromY, actor.restY, t);
        actor.sx = lerp(actor.fromSx, 1, t);
        actor.sy = lerp(actor.fromSy, 1, t);
        actor.hurt = lerp(actor.hurt ?? 0, 0, t);
        actor.yield = lerp(actor.yield ?? 0, 0, t);
        other.x = lerp(other.fromX, other.restX, t);
        other.sx = lerp(other.fromSx, 1, t);
        other.sy = lerp(other.fromSy, 1, t);
        other.flap = lerp(other.flap ?? 0, 0, t);
        other.bite = lerp(other.bite ?? 0, 0, t);
        other.breath = lerp(other.breath ?? 0, 0, t);
        other.hurt = lerp(other.hurt ?? 0, 0, t);
      },
    },
    {
      duration: duration(1100),
      ease: easeOutCubic,
      onStart() {
        actor.alpha = 0;
        actor.spirit = 0;
        hooks.onAscend?.(who);
        burst(actors, actor.restX, actor.restY - 80, "#fff6d8", 10);
      },
      onUpdate(t) {
        actor.alpha = 0;
        actor.spirit = t;
        actor.x = actor.restX;
        actor.y = actor.restY;
        actor.sx = 1;
        actor.sy = 1;
      },
    },
    {
      duration: duration(900),
      onEnd() {
        actor.downed = true;
        actor.alpha = 0;
        actor.spirit = 1;
        actors.posing = false;
      },
    },
  ];
}

function swordSteps(actors, duration, hooks) {
  const chest = actors.chest;
  return [
    {
      duration: duration(420),
      ease: easeOutCubic,
      onUpdate(t) {
        chest.open = lerp(chest.open, 1, t);
      },
    },
    {
      duration: duration(1000),
      ease: easeOutCubic,
      onStart() {
        chest.open = 1;
        hooks.onSword?.();
        burst(actors, chest.x, chest.y - 90, "#ffe7a3", 12);
      },
      onUpdate(t) {
        chest.open = 1;
        chest.sword = t;
      },
    },
    {
      duration: duration(900),
      onEnd() {
        chest.open = 1;
        chest.sword = 1;
        actors.posing = false;
      },
    },
  ];
}

function treasureSteps(kind, actors, hooks, duration) {
  const chest = actors.chest;
  const correct = kind === "correct";
  const steps = [
    {
      duration: duration(160),
      ease: easeOutBack,
      onUpdate(t) {
        chest.sx = lerp(1, correct ? 1.12 : 1.06, t);
        chest.sy = lerp(1, correct ? 0.9 : 0.94, t);
        if (!correct) {
          chest.x = 700 + Math.sin(t * Math.PI * 4) * 8 * (1 - t);
        }
      },
    },
    {
      duration: duration(50),
      onStart() {
        if (!actors.reduced) {
          actors.trauma = Math.min(1, actors.trauma + (correct ? 0.18 : 0.22));
        }
        chest.flash = 1;
        burst(actors, chest.x, chest.y - 40, correct ? "#f0c14a" : "#e07a5f");
        hooks.onImpact?.();
      },
    },
    {
      duration: duration(220),
      ease: easeOutCubic,
      onUpdate(t, raw) {
        if (unfreeze(raw, actors, 0.28) === null) {
          return;
        }
        chest.sx = lerp(chest.sx, 1, t);
        chest.sy = lerp(chest.sy, 1, t);
        chest.x = lerp(chest.x, 700, t);
      },
      onEnd() {
        if (!hooks.defeated && !hooks.felled) {
          actors.posing = false;
        }
      },
    },
  ];
  if (hooks.felled) {
    steps.push(...swordSteps(actors, duration, hooks));
  } else if (hooks.defeated) {
    steps.push(...spiritSteps(actors, "knight", duration, hooks));
  }
  return steps;
}

function landStrike(actors, correct) {
  if (!actors.reduced) {
    actors.trauma = Math.min(1, actors.trauma + (correct ? 0.42 : 0.28));
  }
  if (correct) {
    const tip = swordTip(actors.knight);
    actors.dragon.flash = 1;
    actors.dragon.hurt = 1;
    actors.slash.life = 1;
    actors.slash.x = tip.x;
    actors.slash.y = tip.y;
    actors.slash.angle = swordAngle(actors.knight.swing ?? 0);
    burst(actors, tip.x, tip.y, "#ffe7a3");
    return;
  }
  actors.knight.flash = 1;
  burst(actors, actors.knight.restX + 20, actors.knight.restY - 70, "#ffd0c2");
}

function burst(actors, x, y, color, count = actors.reduced ? 4 : 8) {
  for (let i = 0; i < count; i += 1) {
    const angle = (Math.PI * 2 * i) / count + 0.2;
    const speed = 70 + (i % 3) * 25;
    actors.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 420,
      color,
      size: 4 + (i % 3),
      shape: i % 2 === 0 ? "star" : "dot",
    });
  }
}

function wingIdle(levelId, time) {
  const tune =
    levelId === "level-3"
      ? { period: 460, amp: 0.38 }
      : levelId === "level-2"
        ? { period: 680, amp: 0.26 }
        : { period: 980, amp: 0.16 };
  return {
    flap: Math.sin(time / tune.period) * tune.amp,
    breath: Math.sin(time / 380),
  };
}

function unfreeze(raw, actors, portion) {
  if (actors.reduced || portion <= 0) {
    return raw;
  }
  if (raw < portion) {
    return null;
  }
  return (raw - portion) / (1 - portion);
}

function fade(actor, seconds) {
  if (actor.flash > 0) {
    actor.flash = Math.max(0, actor.flash - seconds * 3.2);
  }
}
