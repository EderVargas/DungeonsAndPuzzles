/**
 * DOM HUD. Meters change only when the match tells them to,
 * which is the impact frame, not the click.
 */

export function createUi(doc, onAnswer) {
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
  const answers = doc.getElementById("answers");
  const overlay = doc.getElementById("overlay");
  const overlayKicker = doc.getElementById("overlay-kicker");
  const overlayTitle = doc.getElementById("overlay-title");
  const overlayBody = doc.getElementById("overlay-body");
  const overlayAction = doc.getElementById("overlay-action");

  let shownHearts = null;

  function showHud(visible) {
    meters.hidden = !visible;
    progress.hidden = !visible;
  }

  function setLevel(level) {
    doc.documentElement.dataset.cave = level.id;
    levelKicker.textContent = level.type === "treasure" ? "Desafío final" : "Cueva";
    levelName.textContent = level.name;
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
    hpFill.style.transform = `scaleX(${ratio})`;
    hpLabel.textContent = `${displayed.dragonHp} / ${displayed.dragonHpMax}`;
    hp.setAttribute("aria-valuenow", String(displayed.dragonHp));
    hp.setAttribute("aria-valuemax", String(displayed.dragonHpMax));
    hp.setAttribute("aria-label", `Vida del dragón: ${displayed.dragonHp} de ${displayed.dragonHpMax}`);
  }

  function renderHearts(current, max) {
    const brokenAt = shownHearts !== null && current < shownHearts ? current : -1;
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
    shownHearts = current;
  }

  function showRound(round, index) {
    dock.hidden = false;
    prompt.textContent = `${round.question.a} × ${round.question.b} = ?`;
    progress.textContent = `Pregunta ${index + 1}`;
    status.textContent = "Elige una respuesta.";
    answers.replaceChildren();
    round.options.forEach((value, optionIndex) => {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = "answer";
      button.dataset.index = String(optionIndex);
      button.dataset.value = String(value);
      const number = doc.createElement("span");
      number.className = "value";
      number.textContent = String(value);
      const mark = doc.createElement("span");
      mark.className = "mark";
      mark.setAttribute("aria-hidden", "true");
      button.append(number, mark);
      button.addEventListener("click", () => onAnswer(optionIndex));
      answers.append(button);
    });
    answers.querySelector(".answer")?.focus();
  }

  function markAnswer(result) {
    for (const button of answers.querySelectorAll(".answer")) {
      button.disabled = true;
      const value = Number(button.dataset.value);
      const selected = Number(button.dataset.index) === result.optionIndex;
      if (selected && result.correct) {
        button.classList.add("is-correct");
        button.setAttribute("aria-label", `${value}, correcta`);
        mark(button, "✓");
      } else if (selected) {
        button.classList.add("is-wrong");
        button.setAttribute("aria-label", `${value}, incorrecta`);
        mark(button, "✗");
      } else if (value === result.correctValue) {
        button.classList.add("is-key");
        button.setAttribute("aria-label", `${value}, respuesta correcta`);
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
    setLevel,
    showHud,
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
