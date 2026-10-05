/**
 * Canvas scene for the caves. Characters stay vector drawings so attack,
 * hit, and defeat poses share one palette, one light, and one silhouette.
 *
 * Light comes from the upper left. Shapes stay rounded. No injury marks.
 */

const WORLD_W = 960;
const WORLD_H = 540;

const CAVE = {
  "level-1": {
    sky: ["#1d4a45", "#10262c"],
    wall: "#1c4a42",
    depth: "#12362f",
    floor: "#214238",
    stone: "#2d5a4c",
    glow: "#7dcea0",
    decor: "vine",
  },
  "level-2": {
    sky: ["#1a3c5c", "#101824"],
    wall: "#1a4668",
    depth: "#10283c",
    floor: "#1c3c52",
    stone: "#2a5874",
    glow: "#8fd4ef",
    decor: "crystal",
  },
  "level-3": {
    sky: ["#6a3a32", "#24141c"],
    wall: "#6a3d34",
    depth: "#3a221c",
    floor: "#4a3028",
    stone: "#6a4638",
    glow: "#f0a07a",
    decor: "ember",
  },
  treasure: {
    sky: ["#6a5228", "#24180f"],
    wall: "#6a4a28",
    depth: "#3a2814",
    floor: "#5a3e22",
    stone: "#7a5a32",
    glow: "#f0c14a",
    decor: "coin",
  },
};

const DRAGON = {
  "level-1": { body: "#62b56c", belly: "#e4f6d8", wing: "#3f8f58", horn: "#f0c14a", spread: 0.82 },
  "level-2": { body: "#3f97b8", belly: "#d7f1f8", wing: "#2c7594", horn: "#d7dee8", spread: 1 },
  "level-3": { body: "#e07a55", belly: "#ffe3d4", wing: "#b85a3c", horn: "#f0c14a", spread: 1.18 },
};

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  let view = { scale: 1, offsetX: 0, offsetY: 0 };

  function resize(stage) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = stage.getBoundingClientRect();
    const width = Math.max(1, Math.floor(bounds.width));
    const height = Math.max(1, Math.floor(bounds.height));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const scale = Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H);
    view = {
      scale,
      offsetX: (canvas.width - WORLD_W * scale) / 2,
      offsetY: (canvas.height - WORLD_H * scale) / 2,
    };
  }

  function draw(actors, shake) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawSky(ctx, canvas, actors);
    ctx.setTransform(
      view.scale,
      0,
      0,
      view.scale,
      view.offsetX + shake.x * view.scale,
      view.offsetY + shake.y * view.scale,
    );
    drawCave(ctx, actors);
    if (actors.mode === "treasure") {
      drawChest(ctx, actors.chest);
    } else {
      drawDragon(ctx, actors.dragon, actors.levelId, actors.time);
    }
    drawKnight(ctx, actors.knight, actors.time);
    drawSlash(ctx, actors.slash);
    drawParticles(ctx, actors.particles);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawVignette(ctx, canvas);
  }

  return { resize, draw };
}

function themeOf(levelId) {
  return CAVE[levelId] ?? CAVE["level-1"];
}

function drawSky(ctx, canvas, actors) {
  const theme = themeOf(actors.levelId);
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, theme.sky[0]);
  sky.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCave(ctx, actors) {
  const theme = themeOf(actors.levelId);
  const pulse = 0.55 + Math.sin(actors.time / 480) * 0.45;

  ctx.fillStyle = theme.wall;
  ctx.beginPath();
  ctx.moveTo(28, 500);
  ctx.quadraticCurveTo(70, 70, 480, 28);
  ctx.quadraticCurveTo(890, 70, 932, 500);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = theme.depth;
  ctx.beginPath();
  ctx.ellipse(480, 188, 168, 92, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = theme.glow;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(480, 196, 188, 108, 0, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = theme.floor;
  ctx.beginPath();
  ctx.ellipse(480, 455, 340, 52, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = theme.stone;
  stone(ctx, 150, 448, 54, 16);
  stone(ctx, 480, 462, 90, 18);
  stone(ctx, 790, 446, 60, 16);

  torch(ctx, 150, 168, theme.glow, pulse);
  torch(ctx, 810, 168, theme.glow, pulse);
  decor(ctx, theme, pulse);
}

function stone(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function torch(ctx, x, y, glow, pulse) {
  ctx.fillStyle = "#31404a";
  ctx.fillRect(x - 8, y, 16, 46);
  ctx.fillStyle = "#445868";
  ctx.beginPath();
  ctx.arc(x, y + 4, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.22 + pulse * 0.18;
  ctx.beginPath();
  ctx.arc(x, y - 8, 28 + pulse * 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffe7a3";
  ctx.beginPath();
  ctx.arc(x, y - 6, 7, 0, Math.PI * 2);
  ctx.fill();
}

function decor(ctx, theme, pulse) {
  if (theme.decor === "vine") {
    ctx.strokeStyle = "#3f8f58";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    vine(ctx, 210, 70);
    vine(ctx, 730, 84);
    return;
  }
  if (theme.decor === "crystal") {
    crystal(ctx, 250, 150, "#8fd4ef");
    crystal(ctx, 710, 140, "#d7f1f8");
    return;
  }
  if (theme.decor === "ember") {
    ctx.fillStyle = "#f0a07a";
    ctx.globalAlpha = 0.35 + pulse * 0.25;
    ctx.beginPath();
    ctx.ellipse(480, 390, 120, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = "#f0c14a";
  coin(ctx, 250, 430);
  coin(ctx, 300, 444);
  coin(ctx, 690, 436);
}

function vine(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 18, y + 50, x - 8, y + 110);
  ctx.stroke();
  ctx.fillStyle = "#62b56c";
  ctx.beginPath();
  ctx.ellipse(x - 10, y + 110, 10, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

function crystal(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(x, y - 28);
  ctx.lineTo(x + 14, y + 16);
  ctx.lineTo(x - 14, y + 16);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function coin(ctx, x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c9923a";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawKnight(ctx, knight, time) {
  if ((knight.alpha ?? 1) > 0.02) {
    ctx.save();
    ctx.globalAlpha = knight.alpha ?? 1;
    paintKnight(ctx, knight, time, false);
    ctx.restore();
  }
  if ((knight.spirit ?? 0) > 0.01) {
    const rise = knight.spirit * 150 + Math.sin(time / 280) * knight.spirit * 6;
    paintKnight(ctx, { ...knight, y: knight.y - rise, flash: 0, yield: 0 }, time, true);
  }
}

function paintKnight(ctx, knight, time, ghost) {
  const pose = knight.yield ?? 0;
  const blink = pose < 0.35 && Math.sin(time / 2400) > 0.985;
  ctx.save();
  ctx.translate(knight.x, knight.y);
  ctx.rotate(pose * 0.22);
  ctx.scale(knight.sx * 1.38, knight.sy * 1.38);
  if (ghost) {
    ctx.globalAlpha = Math.min(0.9, (knight.spirit ?? 1) * 1.7);
    angelWings(ctx, -42);
    halo(ctx, 0, -104);
    ctx.filter = "grayscale(1) brightness(8)";
  }

  if (!ghost) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.beginPath();
    ctx.ellipse(0, 10, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#c4534a";
  ctx.beginPath();
  ctx.moveTo(-8, -46);
  ctx.quadraticCurveTo(-40, -20, -16, 2);
  ctx.quadraticCurveTo(-8, -18, -4, -40);
  ctx.fill();

  ctx.fillStyle = "#3d5278";
  roundRect(ctx, -14, -8, 12, 20, 5);
  ctx.fill();
  roundRect(ctx, 4, -8, 12, 20, 5);
  ctx.fill();
  ctx.fillStyle = "#243044";
  roundRect(ctx, -15, 8, 14, 8, 3);
  ctx.fill();
  roundRect(ctx, 3, 8, 14, 8, 3);
  ctx.fill();

  ctx.fillStyle = "#4c6cb3";
  roundRect(ctx, -20, -56, 40, 48, 12);
  ctx.fill();
  ctx.fillStyle = "#7ea0e0";
  roundRect(ctx, -14, -50, 10, 28, 5);
  ctx.fill();
  ctx.fillStyle = "#f0c14a";
  ctx.fillRect(-16, -18, 32, 6);

  ctx.fillStyle = "#f3d2b3";
  ctx.beginPath();
  ctx.arc(0, -76, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5b3a2e";
  ctx.beginPath();
  ctx.arc(-1, -84, 16, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  ctx.fillStyle = "#d7dee8";
  ctx.fillRect(-16, -70, 32, 7);
  ctx.fillStyle = "#f0c14a";
  ctx.beginPath();
  ctx.moveTo(0, -92);
  ctx.lineTo(7, -74);
  ctx.lineTo(-7, -74);
  ctx.fill();

  ctx.fillStyle = "#243044";
  if (blink || pose > 0.55) {
    ctx.strokeStyle = "#243044";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6, -76, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(6, -76, 3, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-6, -76, 2.2, 0, Math.PI * 2);
    ctx.arc(6, -76, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#c4534a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -70, 5, 0.25, Math.PI - 0.25);
  ctx.stroke();

  ctx.save();
  ctx.translate(22, -34);
  ctx.rotate(0.55 + pose * 1.65);
  ctx.strokeStyle = "#d7dee8";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(0, -34);
  ctx.stroke();
  ctx.fillStyle = "#f0c14a";
  ctx.beginPath();
  ctx.moveTo(-7, -30);
  ctx.lineTo(7, -30);
  ctx.lineTo(0, -46);
  ctx.fill();
  ctx.fillStyle = "#8a6a2a";
  ctx.fillRect(-8, 4, 16, 5);
  ctx.restore();

  if (knight.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${knight.flash * 0.55})`;
    ctx.beginPath();
    ctx.arc(0, -46, 46, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDragon(ctx, dragon, levelId, time) {
  if ((dragon.alpha ?? 1) > 0.02) {
    ctx.save();
    ctx.globalAlpha = dragon.alpha ?? 1;
    paintDragon(ctx, dragon, levelId, time, false);
    ctx.restore();
  }
  if ((dragon.spirit ?? 0) > 0.01) {
    const rise = dragon.spirit * 150 + Math.sin(time / 280) * dragon.spirit * 6;
    paintDragon(
      ctx,
      { ...dragon, y: dragon.y - rise, flash: 0, sleepy: true },
      levelId,
      time,
      true,
    );
  }
}

function paintDragon(ctx, dragon, levelId, time, ghost) {
  const look = DRAGON[levelId] ?? DRAGON["level-1"];
  const bob = ghost ? 0 : Math.sin(time / 380) * 3;
  ctx.save();
  ctx.translate(dragon.x, dragon.y + bob);
  ctx.scale(dragon.scale * dragon.sx, dragon.scale * dragon.sy);
  if (ghost) {
    ctx.globalAlpha = Math.min(0.88, (dragon.spirit ?? 1) * 1.7);
    angelWings(ctx, -8);
    halo(ctx, 52, -40);
    ctx.filter = "grayscale(1) brightness(8)";
  }

  if (!ghost) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(6, 72, 58, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  wing(ctx, -18, -6, -1, look.wing, look.spread);
  wing(ctx, 24, -10, 1, look.wing, look.spread);

  ctx.fillStyle = look.body;
  ctx.beginPath();
  ctx.moveTo(-36, 20);
  ctx.quadraticCurveTo(-92, 28, -70, 48);
  ctx.quadraticCurveTo(-40, 42, -28, 30);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(0, 16, 58, 40, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = look.belly;
  ctx.beginPath();
  ctx.ellipse(8, 26, 30, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = look.body;
  ctx.beginPath();
  ctx.ellipse(50, -6, 30, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f3d2b3";
  ctx.beginPath();
  ctx.ellipse(68, 2, 12, 8, 0.2, 0, Math.PI * 2);
  ctx.fill();

  horn(ctx, 38, -24, look.horn);
  horn(ctx, 56, -26, look.horn);

  ctx.fillStyle = "#243044";
  if (dragon.sleepy) {
    ctx.strokeStyle = "#243044";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(42, -10, 5, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(60, -10, 5, 0.15, Math.PI - 0.15);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(42, -10, 3.4, 0, Math.PI * 2);
    ctx.arc(60, -10, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(41, -11, 1.2, 0, Math.PI * 2);
    ctx.arc(59, -11, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#243044";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(54, 2, 7, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.fillStyle = look.body;
  foot(ctx, -16, 50);
  foot(ctx, 22, 52);

  if (dragon.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${dragon.flash * 0.6})`;
    ctx.beginPath();
    ctx.ellipse(12, 10, 64, 48, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function wing(ctx, x, y, flip, color, spread) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip * spread, spread);
  ctx.fillStyle = color;
  ctx.globalAlpha *= 0.92;
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.quadraticCurveTo(-46, -70, 8, -18);
  ctx.quadraticCurveTo(-10, -8, 0, 10);
  ctx.fill();
  ctx.restore();
}

function angelWings(ctx, y) {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.beginPath();
  ctx.moveTo(-8, y);
  ctx.quadraticCurveTo(-54, y - 46, -76, y - 6);
  ctx.quadraticCurveTo(-46, y + 14, -8, y + 8);
  ctx.quadraticCurveTo(-28, y - 8, -8, y);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, y);
  ctx.quadraticCurveTo(54, y - 46, 76, y - 6);
  ctx.quadraticCurveTo(46, y + 14, 8, y + 8);
  ctx.quadraticCurveTo(28, y - 8, 8, y);
  ctx.fill();
  ctx.restore();
}

function halo(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 244, 196, 0.95)";
  ctx.fillStyle = "rgba(255, 248, 220, 0.28)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(x, y, 15, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function horn(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 8);
  ctx.quadraticCurveTo(x, y - 16, x + 8, y + 8);
  ctx.closePath();
  ctx.fill();
}

function foot(ctx, x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 12, 7, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawChest(ctx, chest) {
  ctx.save();
  ctx.translate(chest.x, chest.y);
  ctx.scale(chest.sx * 1.28, chest.sy * 1.28);

  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 40, 74, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(0, -24);
  ctx.rotate(-chest.open * 1.05);
  ctx.fillStyle = "#8a5a2a";
  roundRect(ctx, -58, -34, 116, 38, 16);
  ctx.fill();
  ctx.fillStyle = "#f0c14a";
  ctx.fillRect(-58, -6, 116, 8);
  ctx.restore();

  const sword = Math.min(1, chest.sword ?? 0);
  if (sword > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, sword * 2.2);
    ctx.translate(0, 28 - sword * 128);
    ctx.fillStyle = "rgba(255, 226, 140, 0.4)";
    ctx.beginPath();
    ctx.ellipse(0, -16, 14, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff6cf";
    ctx.strokeStyle = "#e7c15a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.lineTo(9, 16);
    ctx.lineTo(-9, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e7c15a";
    ctx.fillRect(-18, 14, 36, 7);
    ctx.fillStyle = "#7a4e22";
    roundRect(ctx, -4, 21, 8, 18, 2);
    ctx.fill();
    ctx.fillStyle = "#f0c14a";
    ctx.beginPath();
    ctx.arc(0, 42, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = "#6e4520";
  roundRect(ctx, -64, -18, 128, 58, 12);
  ctx.fill();
  ctx.fillStyle = "#c9923a";
  ctx.fillRect(-64, -2, 128, 8);
  ctx.fillRect(-4, -18, 8, 58);
  ctx.fillStyle = "#f0c14a";
  ctx.beginPath();
  ctx.arc(0, 10, 8, 0, Math.PI * 2);
  ctx.fill();

  if (chest.open > 0.15 && sword < 0.05) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, chest.open);
    ctx.fillStyle = "#ffe08a";
    ctx.beginPath();
    ctx.ellipse(0, -20, 16 + chest.open * 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    coin(ctx, -16, -8);
    coin(ctx, 14, -4);
    ctx.restore();
  }

  if (chest.flash > 0) {
    ctx.fillStyle = `rgba(255, 236, 180, ${chest.flash * 0.5})`;
    roundRect(ctx, -70, -62, 140, 112, 18);
    ctx.fill();
  }
  ctx.restore();
}

function drawSlash(ctx, slash) {
  if (slash.life <= 0) {
    return;
  }
  ctx.save();
  ctx.translate(slash.x, slash.y);
  ctx.rotate(-0.4);
  ctx.strokeStyle = `rgba(255, 247, 220, ${slash.life})`;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 28 + (1 - slash.life) * 16, -0.8, 1.1);
  ctx.stroke();
  ctx.strokeStyle = `rgba(240, 193, 74, ${slash.life * 0.85})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 40 + (1 - slash.life) * 18, -0.5, 0.9);
  ctx.stroke();
  ctx.restore();
}

function drawParticles(ctx, particles) {
  for (const spark of particles) {
    ctx.globalAlpha = Math.max(0, spark.life / 420);
    ctx.fillStyle = spark.color;
    if (spark.shape === "star") {
      star(ctx, spark.x, spark.y, spark.size);
    } else {
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function star(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
    const length = i % 2 === 0 ? radius : radius * 0.45;
    const px = x + Math.cos(angle) * length;
    const py = y + Math.sin(angle) * length;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

function drawVignette(ctx, canvas) {
  const vignette = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.28,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width * 0.72,
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.28)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
