/**
 * The voice asks the question. On the preschool path it also reads
 * cave, win, and loss screens, then says which button to press.
 * Speech starts after the adult's first tap; later repeats use the same unlock.
 */
const REPEAT_MS = 7000;

export function cueSpeech({ kicker, title, body, cues }) {
  const message = [kicker, title, body].filter(Boolean).map(sentence).join(" ");
  const clicks = cues.map((cue) => `Da click en ${cue.label} para ${cue.purpose}.`).join(" ");
  return `${message} ${clicks}`.trim();
}

function sentence(text) {
  const trimmed = String(text).trim();
  if (/[.!?]$/.test(trimmed)) {
    return trimmed;
  }
  return `${trimmed}.`;
}

export function createVoice(win = globalThis, hooks = {}) {
  let timer = 0;
  let current = "";
  let generation = 0;
  let mode = "idle";
  const onSpeakStart = hooks.onSpeakStart ?? (() => {});
  const onSpeakEnd = hooks.onSpeakEnd ?? (() => {});

  function pickVoice() {
    const synth = win.speechSynthesis;
    if (!synth?.getVoices) {
      return null;
    }
    const voices = synth.getVoices();
    return (
      voices.find((voice) => /^es-MX/i.test(voice.lang)) ||
      voices.find((voice) => /^es[-_]/i.test(voice.lang)) ||
      voices.find((voice) => /^es$/i.test(voice.lang)) ||
      null
    );
  }

  function speak(text) {
    const synth = win.speechSynthesis;
    if (!synth || typeof win.SpeechSynthesisUtterance !== "function" || !text) {
      return;
    }
    const mine = ++generation;
    const utter = new win.SpeechSynthesisUtterance(text);
    utter.lang = "es-MX";
    utter.rate = 0.82;
    utter.volume = 1;
    const voice = pickVoice();
    if (voice) {
      utter.voice = voice;
    }
    let settled = false;
    const finish = () => {
      if (settled || mine !== generation) {
        return;
      }
      settled = true;
      onSpeakEnd();
      finishNarration();
    };
    utter.onend = finish;
    utter.onerror = finish;
    onSpeakStart();
    synth.cancel();
    synth.speak(utter);
  }

  function finishNarration() {
    if (mode !== "narrate" || !current) {
      return;
    }
    timer = setTimeout(() => {
      if (mode === "narrate" && current) {
        speak(current);
      }
    }, REPEAT_MS);
  }

  function ask(text) {
    mode = "ask";
    current = text;
    clearTimer();
    speak(text);
    const loop = () => {
      speak(current);
      timer = setTimeout(loop, REPEAT_MS);
    };
    timer = setTimeout(loop, REPEAT_MS);
  }

  function narrate(text) {
    if (!text) {
      return;
    }
    stop();
    mode = "narrate";
    current = text;
    speak(text);
  }

  function repeat() {
    if (current) {
      ask(current);
    }
  }

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
  }

  function stop() {
    mode = "idle";
    clearTimer();
    const hadSpeech = Boolean(current);
    current = "";
    generation += 1;
    win.speechSynthesis?.cancel();
    if (hadSpeech) {
      onSpeakEnd();
    }
  }

  function prime() {
    win.speechSynthesis?.getVoices?.();
  }

  return { ask, narrate, repeat, stop, prime };
}
