import { createAudio } from "./audio.js";
import { createFeedback, createActors, shakeOffset, tickAmbient } from "./animations.js";
import { CHARACTERS, getCharacter } from "./characters.js";
import { acknowledgeFeedback, currentRound, startMatch, submitAnswer } from "./game-state.js";
import { getLevel, levelsFor } from "./levels.js";
import { createRenderer } from "./renderer.js";
import { createRng } from "./rng.js";
import { createUi } from "./ui.js";
import { createVoice } from "./voice.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const audio = createAudio();
const voice = createVoice(globalThis, {
  onSpeakStart: () => audio.pauseForVoice(),
  onSpeakEnd: () => audio.resumeAfterVoice(),
});

const ui = createUi(document, onAnswer, () => voice.repeat());
ui.bindSound(audio);
const renderer = createRenderer(document.getElementById("scene"));
const stage = document.getElementById("stage");

let character = null;
let level = getLevel("level-1");
let carriedHearts = level.playerHearts;
let actors = createActors(level);
let match = null;
let displayed = null;
let playback = null;
let playbackAge = 0;
let screen = "title";
let lastFrame = 0;

actors.reduced = reducedMotion;
showTitle();

new ResizeObserver(() => {
  renderer.resize(stage);
  ui.paintPortraits();
}).observe(stage);
document.addEventListener("pointerdown", () => {
  audio.unlock();
  voice.prime();
});
document.addEventListener("keydown", (event) => {
  audio.unlock();
  onKeyDown(event);
});
requestAnimationFrame(frame);

function showTitle() {
  screen = "title";
  character = null;
  level = getLevel("level-1");
  carriedHearts = level.playerHearts;
  actors = createActors(level);
  actors.knight.alpha = 0;
  actors.dragon.alpha = 0;
  actors.reduced = reducedMotion;
  match = null;
  playback = null;
  document.documentElement.dataset.cave = "level-1";
  ui.setHeading("Aventura", "Elige un caballero");
  ui.showHud(false);
  ui.hideDock();
  ui.hideOverlay();
  voice.stop();
  ui.showPicker(CHARACTERS, (id) => {
    character = getCharacter(id);
    showIntro(levelsFor(id)[0]);
  });
}

function showIntro(nextLevel, hearts = nextLevel.playerHearts) {
  level = nextLevel;
  carriedHearts = Math.min(level.playerHearts, hearts);
  actors = createActors(level, character);
  actors.reduced = reducedMotion;
  ui.hidePicker();
  ui.setLevel(level);
  ui.showHud(false);
  ui.hideDock();
  voice.stop();
  screen = "intro";
  const heartsLabel = carriedHearts === 1 ? "1 corazón" : `${carriedHearts} corazones`;
  bindOverlay({
    kicker: level.type === "treasure" ? "Desafío final" : "Nueva cueva",
    title: level.name,
    body: introBody(level, heartsLabel),
    action: level.prompt ? "Entrar" : level.type === "treasure" ? "Abrir el desafío" : "Comenzar",
    onAction: beginMatch,
  });
}

function introBody(level, heartsLabel) {
  if (level.prompt) {
    return `Escucha y toca lo que oyes. El dragón tiene ${level.dragonHp} de vida. Llevas ${heartsLabel}.`;
  }
  const tables = level.tables.join(", ");
  return level.type === "treasure"
    ? `Tablas ${tables}. El cofre cede con ${level.dragonHp} aciertos. Llevas ${heartsLabel}.`
    : `Tablas ${tables}. El dragón tiene ${level.dragonHp} de vida. Llevas ${heartsLabel}.`;
}

function beginMatch() {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x100000000)) >>> 0;
  match = startMatch(level, createRng(seed), carriedHearts);
  displayed = {
    hearts: match.combat.playerHearts,
    heartsMax: match.combat.playerHeartsMax,
    dragonHp: match.combat.dragonHp,
    dragonHpMax: match.combat.dragonHpMax,
    correct: 0,
    required: match.combat.dragonHpMax,
  };
  screen = "match";
  playback = null;
  ui.hideOverlay();
  ui.setLevel(level);
  ui.syncMeters(displayed, level);
  showCurrentRound();
}

function showCurrentRound() {
  const round = currentRound(match);
  ui.showRound(round, match.index);
  if (round?.question.spoken) {
    voice.ask(round.question.spoken);
    return;
  }
  voice.stop();
}

function onAnswer(optionIndex) {
  if (screen !== "match" || playback || match?.phase !== "playing") {
    return;
  }
  voice.stop();
  match = submitAnswer(match, optionIndex);
  const round = match.rounds[match.lastResult.questionIndex];
  ui.markAnswer(match.lastResult);
  playbackAge = 0;
  const correct = match.lastResult.correct;
  playback = createFeedback(correct ? "correct" : "incorrect", actors, {
    reducedMotion,
    defeated: !correct && match.combat.playerHearts <= 0,
    felled: correct && match.combat.dragonHp <= 0,
    onImpact: () => {
      revealImpact(round);
      audio.play(correct ? "hit" : "miss");
    },
    onAscend: (who) => {
      if (who === "knight") {
        audio.play("defeat");
        return;
      }
      audio.play("ascend");
      audio.play("fanfare");
    },
    onSword: () => audio.play("sword"),
  });
}

function revealImpact(round) {
  displayed.hearts = match.combat.playerHearts;
  displayed.dragonHp = match.combat.dragonHp;
  displayed.correct = match.combat.correctAnswers;
  actors.dragon.sleepy = displayed.dragonHp === 0;
  actors.chest.openTarget = displayed.correct / displayed.required;
  ui.syncMeters(displayed, level);
  const question = round.question;
  ui.setStatus(
    match.lastResult.correct
      ? level.type === "treasure"
        ? "El candado cede."
        : "Golpe certero."
      : question.product != null
        ? `Casi. ${question.a} × ${question.b} = ${question.product}.`
        : "Casi.",
  );
}

function finishFeedback() {
  playback = null;
  match = acknowledgeFeedback(match);
  if (match.phase === "playing") {
    showCurrentRound();
    return;
  }
  if (match.phase === "levelComplete") {
    showCleared();
    return;
  }
  showGameOver();
}

function showCleared() {
  screen = "levelComplete";
  ui.hideDock();
  voice.stop();
  const next = nextLevel(level.id);
  if (!next) {
    showVictory();
    return;
  }
  bindOverlay({
    kicker: "Cueva despejada",
    title: level.name,
    body: next.type === "treasure" ? "El cofre del tesoro espera." : "Otra cueva se abre más adelante.",
    action: next.type === "treasure" ? "Ir al cofre" : "Siguiente cueva",
    onAction: () => showIntro(next, match.combat.playerHearts),
  });
}

function showGameOver() {
  screen = "gameOver";
  ui.hideDock();
  voice.stop();
  bindOverlay({
    kicker: "Intento terminado",
    title: "El dragón sigue despierto",
    body: "Te quedaste sin corazones. Puedes volver a intentarlo.",
    action: "Reintentar",
    onAction: () => showIntro(level),
  });
}

function showVictory() {
  screen = "victory";
  ui.hideDock();
  voice.stop();
  const gael = character?.id === "gael";
  bindOverlay({
    kicker: "Tesoro",
    title: gael ? "La cueva queda en calma" : "El cofre se abre",
    body: gael
      ? "Colores, formas, números y vocales quedaron contigo."
      : "Las tablas 9 y 10 quedaron contigo.",
    action: "Elegir caballero",
    onAction: showTitle,
  });
}

function nextLevel(id) {
  const path = levelsFor(character.id);
  const index = path.findIndex((item) => item.id === id);
  return path[index + 1] ?? null;
}

function bindOverlay(view) {
  ui.showOverlay(view);
}

function onKeyDown(event) {
  if (!document.getElementById("overlay").hidden) {
    return;
  }
  if (screen !== "match" || playback) {
    return;
  }
  const buttons = [...ui.answers.querySelectorAll(".answer")];
  if (!buttons.length) {
    return;
  }
  const current = buttons.indexOf(document.activeElement);
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    buttons[(Math.max(current, 0) + 1) % buttons.length].focus();
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    buttons[(current <= 0 ? buttons.length : current) - 1].focus();
  } else if (/^[1-4]$/.test(event.key)) {
    event.preventDefault();
    buttons[Number(event.key) - 1]?.click();
  }
}

function frame(now) {
  const dt = lastFrame === 0 ? 16 : Math.min(50, now - lastFrame);
  lastFrame = now;
  tickAmbient(actors, dt);
  if (playback) {
    playbackAge += dt;
    const finished = playbackAge > 6000 ? (playback.finish(), true) : playback.update(dt);
    if (finished) {
      finishFeedback();
    }
  }
  renderer.draw(actors, shakeOffset(actors));
  requestAnimationFrame(frame);
}
