/**
 * The voice only asks. The child answers by touching.
 * Speech starts after the adult's Entrar gesture; later repeats use the same unlock.
 */
const REPEAT_MS = 7000;

export function createVoice(win = globalThis, hooks = {}) {
  let timer = 0;
  let current = "";
  let generation = 0;
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
    };
    utter.onend = finish;
    utter.onerror = finish;
    onSpeakStart();
    synth.cancel();
    synth.speak(utter);
  }

  function ask(text) {
    current = text;
    speak(text);
    if (timer) {
      clearTimeout(timer);
    }
    const loop = () => {
      speak(current);
      timer = setTimeout(loop, REPEAT_MS);
    };
    timer = setTimeout(loop, REPEAT_MS);
  }

  function repeat() {
    if (current) {
      ask(current);
    }
  }

  function stop() {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
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

  return { ask, repeat, stop, prime };
}
