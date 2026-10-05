/**
 * Cues are synthesized. Background music is "The Old Tower Inn" by RandomMind (CC0).
 * See assets/audio/CREDITS.txt. Browsers only start audio after a gesture.
 */

const MUSIC_SRC = "assets/audio/the-old-tower-inn.mp3";
const MUTE_KEY = "dungeons-puzzles-muted";

export function createAudio() {
  let context = null;
  let music = null;
  let muted = readMuted();

  function audio() {
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioCtx) {
      return null;
    }
    if (!context) {
      context = new AudioCtx();
    }
    if (context.state === "suspended") {
      context.resume();
    }
    return context;
  }

  function tone(ctx, when, freq, duration, type, peak, slideTo) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), when + duration);
    }
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + duration + 0.03);
  }

  function track() {
    if (!music) {
      music = new Audio(MUSIC_SRC);
      music.loop = true;
      music.preload = "auto";
      music.volume = 0.22;
      music.hidden = true;
      globalThis.document?.body?.append(music);
    }
    return music;
  }

  function startMusic() {
    const song = track();
    song.muted = muted;
    if (muted) {
      return;
    }
    const pending = song.play();
    if (pending) {
      pending.catch(() => {});
    }
  }

  function play(notes) {
    if (muted) {
      return;
    }
    const ctx = audio();
    if (!ctx) {
      return;
    }
    const now = ctx.currentTime;
    for (const note of notes) {
      tone(ctx, now + note.at, note.freq, note.duration, note.type, note.peak, note.slideTo);
    }
  }

  return {
    unlock() {
      if (muted) {
        return;
      }
      audio();
      startMusic();
    },
    isMuted() {
      return muted;
    },
    toggleMuted() {
      muted = !muted;
      writeMuted(muted);
      if (muted) {
        music?.pause();
        return muted;
      }
      audio();
      startMusic();
      return muted;
    },
    play(name) {
      const cues = {
        hit: [
          { at: 0, freq: 523, duration: 0.1, type: "triangle", peak: 0.07, slideTo: 784 },
          { at: 0.08, freq: 880, duration: 0.16, type: "sine", peak: 0.05 },
        ],
        miss: [{ at: 0, freq: 247, duration: 0.2, type: "sine", peak: 0.06, slideTo: 165 }],
        ascend: [
          { at: 0, freq: 659, duration: 0.22, type: "sine", peak: 0.045, slideTo: 988 },
          { at: 0.14, freq: 880, duration: 0.34, type: "triangle", peak: 0.04, slideTo: 1319 },
        ],
        // Answers the spirit chime: the first note waits until that cue has finished.
        fanfare: [
          { at: 0.5, freq: 523, duration: 0.14, type: "square", peak: 0.03 },
          { at: 0.5, freq: 1046, duration: 0.14, type: "sine", peak: 0.02 },
          { at: 0.66, freq: 659, duration: 0.14, type: "square", peak: 0.032 },
          { at: 0.66, freq: 1319, duration: 0.14, type: "sine", peak: 0.018 },
          { at: 0.82, freq: 784, duration: 0.16, type: "square", peak: 0.034 },
          { at: 0.82, freq: 1568, duration: 0.16, type: "sine", peak: 0.016 },
          { at: 1.02, freq: 1047, duration: 0.5, type: "square", peak: 0.036 },
          { at: 1.02, freq: 2093, duration: 0.5, type: "sine", peak: 0.014 },
        ],
        defeat: [
          { at: 0, freq: 523, duration: 0.14, type: "triangle", peak: 0.08, slideTo: 392 },
          { at: 0.22, freq: 440, duration: 0.14, type: "triangle", peak: 0.08, slideTo: 330 },
          { at: 0.46, freq: 349, duration: 0.95, type: "triangle", peak: 0.09, slideTo: 90 },
        ],
        sword: [
          { at: 0, freq: 392, duration: 0.12, type: "triangle", peak: 0.05, slideTo: 784 },
          { at: 0.1, freq: 1175, duration: 0.4, type: "sine", peak: 0.05 },
        ],
      };
      play(cues[name] ?? []);
    },
  };
}

function readMuted() {
  try {
    return globalThis.localStorage?.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeMuted(muted) {
  try {
    globalThis.localStorage?.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // Private browsing can reject storage; the button still works for this visit.
  }
}
