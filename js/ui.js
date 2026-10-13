/**
 * DOM HUD. Meters change only when the match tells them to,
 * which is the impact frame, not the click.
 */

import { artSvg, shapeSvg } from "./art.js";
import { splitInitial } from "./prompts.js";
import { paintKnightPortrait } from "./renderer.js";

export function createUi(doc, onAnswer, onRepeat) {
  const app = doc.getElementById("app");
  const levelKicker = doc.getElementById("level-kicker");
  const levelName = doc.getElementById("level-name");
  const progress = doc.getElementById("progress");
  const hearts = doc.getElementById("hearts");
  const meters = doc.getElementById("meters");
  const hp = doc.getElementById("hp");
  const hpFill = doc.getElementById("hp-fill");
  const hpLabel = doc.getElementById("hp-label");
  const locks = doc.getElementById("locks");
  const dock = doc.getElementById("dock");
  const status = doc.getElementById("status");
  const prompt = doc.getElementById("prompt");
  const repeatWord = doc.getElementById("repeat-word");
  const answers = doc.getElementById("answers");
  const picker = doc.getElementById("picker");
  const overlay = doc.getElementById("overlay");
  const overlayKicker = doc.getElementById("overlay-kicker");
  const overlayTitle = doc.getElementById("overlay-title");
  const overlayBody = doc.getElementById("overlay-body");
  const overlayAction = doc.getElementById("overlay-action");

  let shownHearts = null;
  let shownHp = null;
  let portraitLooks = [];

  repeatWord.addEventListener("click", () => onRepeat());

  function showHud(visible) {
    meters.hidden = !visible;
    progress.hidden = !visible;
  }

  function setHeading(kicker, title) {
    levelKicker.textContent = kicker;
    levelName.textContent = title;
  }

  function setLevel(level) {
    doc.documentElement.dataset.cave = level.id;
    setHeading(level.type === "treasure" ? "Desafío final" : "Cueva", level.name);
  }

  function syncMeters(displayed, level) {
    showHud(true);
    renderHearts(displayed.hearts, displayed.heartsMax);
    if (level.type === "treasure") {
      hp.hidden = true;
      locks.hidden = false;
      locks.textContent = `Aciertos ${displayed.correct} / ${displayed.required}`;
      return;
    }
    locks.hidden = true;
    hp.hidden = false;
    const ratio = displayed.dragonHpMax === 0 ? 0 : displayed.dragonHp / displayed.dragonHpMax;
    const damaged = shownHp !== null && displayed.dragonHp < shownHp;
    hpFill.style.transform = `scaleX(${ratio})`;
    if (damaged) {
      hp.classList.remove("is-hit");
      void hp.offsetWidth;
      hp.classList.add("is-hit");
    }
    shownHp = displayed.dragonHp;
    hpLabel.textContent = `${displayed.dragonHp} / ${displayed.dragonHpMax}`;
    hp.setAttribute("aria-valuenow", String(displayed.dragonHp));
    hp.setAttribute("aria-valuemax", String(displayed.dragonHpMax));
    hp.setAttribute("aria-label", `Vida del dragón: ${displayed.dragonHp} de ${displayed.dragonHpMax}`);
  }

  function renderHearts(current, max) {
    const brokenAt = shownHearts !== null && current < shownHearts ? current : -1;
    hearts.classList.remove("is-shaken");
    hearts.replaceChildren();
    for (let i = 0; i < max; i += 1) {
      const heart = doc.createElement("span");
      const full = i < current;
      heart.className = full ? "heart is-full" : "heart is-empty";
      if (i === brokenAt) {
        heart.classList.add("is-breaking");
      }
      heart.textContent = full ? "♥" : "♡";
      hearts.append(heart);
    }
    hearts.setAttribute("aria-label", `${current} de ${max} corazones`);
    if (brokenAt >= 0) {
      void hearts.offsetWidth;
      hearts.classList.add("is-shaken");
    }
    shownHearts = current;
  }

  function showRound(round, index) {
    dock.hidden = false;
    progress.textContent = `Pregunta ${index + 1}`;
    answers.replaceChildren();
    const spoken = Boolean(round.question.spoken);
    dock.classList.toggle("is-spoken", spoken);
    prompt.hidden = spoken;
    repeatWord.hidden = !spoken;
    dock.setAttribute("aria-labelledby", spoken ? "status" : "prompt");
    repeatWord.disabled = false;
    if (spoken) {
      status.textContent = "Toca lo que oíste.";
      round.options.forEach((option, optionIndex) => {
        answers.append(pictureButton(round, option, optionIndex));
      });
    } else {
      prompt.textContent = `${round.question.a} × ${round.question.b} = ?`;
      status.textContent = "Elige una respuesta.";
      round.options.forEach((value, optionIndex) => {
        const button = doc.createElement("button");
        button.type = "button";
        button.className = "answer";
        button.dataset.index = String(optionIndex);
        button.dataset.value = String(value);
        const number = doc.createElement("span");
        number.className = "value";
        number.textContent = String(value);
        const markSlot = doc.createElement("span");
        markSlot.className = "mark";
        markSlot.setAttribute("aria-hidden", "true");
        button.append(number, markSlot);
        button.addEventListener("click", () => onAnswer(optionIndex));
        answers.append(button);
      });
    }
    answers.querySelector(".answer")?.focus();
  }

  function pictureButton(round, option, optionIndex) {
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "answer is-picture";
    button.dataset.index = String(optionIndex);
    button.dataset.value = option.id;
    button.dataset.label = option.spoken;
    button.setAttribute("aria-label", option.spoken);
    if (round.question.kind === "color") {
      const swatch = doc.createElement("span");
      swatch.className = "swatch";
      swatch.style.background = option.swatch;
      button.append(swatch);
    } else if (round.question.kind === "shape") {
      const art = doc.createElement("span");
      art.className = "shape-art";
      art.innerHTML = shapeSvg(option.shape, round.question.ink);
      button.append(art);
    } else if (round.question.kind === "number") {
      const digit = doc.createElement("span");
      digit.className = "digit";
      digit.textContent = option.digit;
      const dots = doc.createElement("span");
      dots.className = "dots";
      for (let i = 0; i < option.dots; i += 1) {
        const dot = doc.createElement("span");
        dot.className = "dot";
        dots.append(dot);
      }
      button.append(digit, dots);
    } else if (round.question.kind === "vowel") {
      const art = doc.createElement("span");
      art.className = "vowel-art";
      art.innerHTML = artSvg(option.art);
      const word = doc.createElement("span");
      word.className = "word";
      const { lead, rest } = splitInitial(option.word);
      const leadEl = doc.createElement("b");
      leadEl.className = "lead";
      leadEl.textContent = lead;
      const restEl = doc.createElement("span");
      restEl.className = "rest";
      restEl.textContent = rest;
      word.append(leadEl, restEl);
      button.setAttribute("aria-label", `${lead}, ${option.word}`);
      button.append(art, word);
    }
    const markSlot = doc.createElement("span");
    markSlot.className = "mark";
    markSlot.setAttribute("aria-hidden", "true");
    button.append(markSlot);
    button.addEventListener("click", () => onAnswer(optionIndex));
    return button;
  }

  function markAnswer(result) {
    const correctValue = String(result.correctValue);
    repeatWord.disabled = true;
    for (const button of answers.querySelectorAll(".answer")) {
      button.disabled = true;
      const value = button.dataset.value;
      const label = button.dataset.label || value;
      const selected = Number(button.dataset.index) === result.optionIndex;
      if (selected && result.correct) {
        button.classList.add("is-correct");
        button.setAttribute("aria-label", `${label}, correcta`);
        mark(button, "✓");
      } else if (selected) {
        button.classList.add("is-wrong");
        button.setAttribute("aria-label", `${label}, incorrecta`);
        mark(button, "✗");
      } else if (value === correctValue) {
        button.classList.add("is-key");
        button.setAttribute("aria-label", `${label}, respuesta correcta`);
        mark(button, "✓");
      }
    }
  }

  function setStatus(text) {
    status.textContent = text;
  }

  function showOverlay({ kicker, title, body, action, onAction }) {
    overlayKicker.textContent = kicker;
    overlayTitle.textContent = title;
    overlayBody.textContent = body;
    overlayAction.textContent = action;
    overlayAction.onclick = onAction;
    overlay.hidden = false;
    app.inert = true;
    overlayAction.focus();
  }

  function hideOverlay() {
    overlay.hidden = true;
    app.inert = false;
  }

  function hideDock() {
    dock.hidden = true;
    dock.classList.remove("is-spoken");
    repeatWord.hidden = true;
  }

  function showPicker(characters, onPick) {
    portraitLooks = characters;
    picker.hidden = false;
    picker.replaceChildren();
    for (const character of characters) {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "knight-choice";
      button.dataset.character = character.id;
      const canvas = doc.createElement("canvas");
      canvas.className = "portrait";
      canvas.setAttribute("aria-hidden", "true");
      const label = doc.createElement("span");
      label.className = "knight-label";
      label.textContent = `${character.name} (${character.ages})`;
      button.append(canvas, label);
      button.addEventListener("click", () => onPick(character.id));
      picker.append(button);
      paintKnightPortrait(canvas, character);
    }
    picker.querySelector(".knight-choice")?.focus();
  }

  function hidePicker() {
    picker.hidden = true;
  }

  function paintPortraits() {
    if (picker.hidden) {
      return;
    }
    const canvases = picker.querySelectorAll("canvas");
    portraitLooks.forEach((look, index) => {
      if (canvases[index]) {
        paintKnightPortrait(canvases[index], look);
      }
    });
  }

  function bindSound(controller) {
    const button = doc.getElementById("sound-toggle");
    const glyph = button.querySelector(".sound-glyph");

    function paint() {
      const silent = controller.isMuted();
      button.classList.toggle("is-muted", silent);
      button.setAttribute("aria-pressed", silent ? "true" : "false");
      button.setAttribute("aria-label", silent ? "Activar sonido" : "Silenciar sonido");
      if (glyph) {
        glyph.textContent = "♪";
      }
    }

    button.addEventListener("click", () => {
      controller.toggleMuted();
      paint();
    });
    paint();
  }

  return {
    answers,
    bindSound,
    setHeading,
    setLevel,
    showHud,
    showPicker,
    hidePicker,
    paintPortraits,
    syncMeters,
    showRound,
    markAnswer,
    setStatus,
    showOverlay,
    hideOverlay,
    hideDock,
  };
}

function mark(button, symbol) {
  const slot = button.querySelector(".mark");
  if (slot) {
    slot.textContent = symbol;
  }
}
