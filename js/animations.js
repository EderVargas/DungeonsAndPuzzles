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

const DRAGON_TINT = {
  "level-1": "#6fbf73",
  "level-2": "#4aa3c7",
  "level-3": "#e08a62",
};

export function createActors(level) {
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
      alpha: 1,
      spirit: 0,
      downed: false,
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
    },
    chest: { x: 700, y: 400, sx: 1, sy: 1, open: 0, openTarget: 0, flash: 0, sword: 0 },
    slash: { x: 560, y: 300, life: 0 },
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
    } else {
      knight.yield = 0;
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
    } else {
      dragon.x = dragon.restX;
      dragon.sx = 1;
      dragon.sy = 1 + Math.sin(actors.time / 380) * 0.04;
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
    const steps = [
      {
        duration: duration(140),
        ease: easeOutBack,
        onUpdate(t) {
          knight.sx = lerp(1, 1.16, t);
          knight.sy = lerp(1, 0.84, t);
          knight.x = lerp(knight.restX, knight.restX - 18, t);
        },
      },
      {
        duration: duration(150),
        ease: easeInCubic,
        onUpdate(t) {
          knight.x = lerp(knight.restX - 18, knight.restX + 150, t);
          knight.sx = lerp(1.16, 0.92, t);
          knight.sy = lerp(0.84, 1.12, t);
        },
      },
      {
        duration: duration(70),
        onStart() {
          strike(actors, true);
          hooks.onImpact?.();
        },
      },
      {
        duration: duration(260),
        onUpdate(t) {
          const wave = Math.sin(t * Math.PI);
          dragon.x = lerp(dragon.restX, dragon.restX + 42, wave);
          dragon.sx = lerp(1, 1.22, wave);
          dragon.sy = lerp(1, 0.78, wave);
          actors.slash.life = 1 - t;
        },
      },
      {
        duration: duration(200),
        ease: easeOutCubic,
        onUpdate(t) {
          knight.x = lerp(knight.restX + 150, knight.restX, t);
          knight.sx = lerp(0.92, 1, t);
          knight.sy = lerp(1.12, 1, t);
          dragon.x = lerp(dragon.x, dragon.restX, t);
        },
        onEnd() {
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
      duration: duration(140),
      ease: easeInCubic,
      onUpdate(t) {
        dragon.sx = lerp(1, 1.14, t);
        dragon.sy = lerp(1, 0.86, t);
        dragon.x = lerp(dragon.restX, dragon.restX + 16, t);
      },
    },
    {
      duration: duration(150),
      ease: easeInCubic,
      onUpdate(t) {
        dragon.x = lerp(dragon.restX + 16, dragon.restX - 150, t);
        dragon.sx = lerp(1.14, 0.9, t);
        dragon.sy = lerp(0.86, 1.1, t);
      },
    },
    {
      duration: duration(60),
      onStart() {
        strike(actors, false);
        hooks.onImpact?.();
      },
    },
    {
      duration: duration(240),
      onUpdate(t) {
        const wave = Math.sin(t * Math.PI);
        knight.x = lerp(knight.restX, knight.restX - 28, wave);
        knight.sx = lerp(1, 1.18, wave);
        knight.sy = lerp(1, 0.8, wave);
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
    onUpdate(t) {
      dragon.x = lerp(dragon.restX - 150, dragon.restX, t);
      dragon.sx = 1;
      dragon.sy = 1;
      knight.x = lerp(knight.x, knight.restX, t);
      knight.sx = 1;
      knight.sy = 1;
    },
    onEnd() {
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
        other.x = lerp(other.fromX, other.restX, t);
        other.sx = lerp(other.fromSx, 1, t);
        other.sy = lerp(other.fromSy, 1, t);
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
      onUpdate(t) {
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

function strike(actors, correct) {
  if (!actors.reduced) {
    actors.trauma = Math.min(1, actors.trauma + (correct ? 0.42 : 0.28));
  }
  if (correct) {
    actors.dragon.flash = 1;
    actors.slash.life = 1;
    actors.slash.x = actors.dragon.restX - 70;
    actors.slash.y = actors.dragon.restY - 10;
    burst(actors, actors.slash.x, actors.slash.y, "#ffe7a3");
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

function fade(actor, seconds) {
  if (actor.flash > 0) {
    actor.flash = Math.max(0, actor.flash - seconds * 3.2);
  }
}
