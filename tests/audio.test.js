import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createAudio, MUSIC_VOLUME } from "../js/audio.js";
import { createVoice } from "../js/voice.js";

const created = [];

class FakeAudio {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this.paused = true;
    this.muted = false;
    this.loop = false;
    created.push(this);
  }

  play() {
    this.paused = false;
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
  }
}

function installBrowser() {
  created.length = 0;
  globalThis.Audio = FakeAudio;
  globalThis.localStorage = {
    getItem() {
      return null;
    },
    setItem() {},
  };
  globalThis.document = { body: { append() {} } };
}

function fakeSpeech() {
  let active = null;
  const spoken = [];
  const win = {
    speechSynthesis: {
      getVoices() {
        return [{ lang: "es-MX", name: "MX" }];
      },
      cancel() {
        const previous = active;
        active = null;
        if (previous && !previous.settled) {
          previous.onerror?.({ error: "interrupted" });
        }
      },
      speak(utter) {
        active = utter;
        spoken.push(utter);
      },
    },
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text;
        this.volume = 0;
        this.rate = 1;
        this.lang = "";
        this.settled = false;
      }
    },
  };
  return {
    win,
    spoken,
    endLatest() {
      const utter = spoken.at(-1);
      utter.onend?.();
    },
  };
}

afterEach(() => {
  delete globalThis.Audio;
  delete globalThis.document;
});

describe("music under a spoken question", () => {
  it("keeps the track at 60% and pauses only while the voice is speaking", () => {
    installBrowser();
    const audio = createAudio();
    const speech = fakeSpeech();
    const voice = createVoice(speech.win, {
      onSpeakStart: () => audio.pauseForVoice(),
      onSpeakEnd: () => audio.resumeAfterVoice(),
    });

    audio.unlock();
    const song = created[0];
    assert.equal(song.volume, MUSIC_VOLUME);
    assert.equal(MUSIC_VOLUME, 0.6);
    assert.equal(song.paused, false);

    voice.ask("Rojo");
    assert.equal(speech.spoken[0].volume, 1);
    assert.equal(song.paused, true);

    voice.ask("Azul");
    assert.equal(song.paused, true);
    assert.equal(speech.spoken[1].volume, 1);

    speech.endLatest();
    assert.equal(song.paused, false);
    assert.equal(song.volume, MUSIC_VOLUME);
    voice.stop();
    assert.equal(song.paused, false);
  });

  it("resumes when the question is cancelled, and stays quiet if the player muted", () => {
    installBrowser();
    const audio = createAudio();
    const speech = fakeSpeech();
    const voice = createVoice(speech.win, {
      onSpeakStart: () => audio.pauseForVoice(),
      onSpeakEnd: () => audio.resumeAfterVoice(),
    });

    audio.unlock();
    voice.ask("Uno");
    assert.equal(created[0].paused, true);
    voice.stop();
    assert.equal(created[0].paused, false);

    voice.ask("Dos");
    audio.toggleMuted();
    speech.endLatest();
    assert.equal(created[0].paused, true);
    voice.stop();
  });

  it("pauses when the page is hidden and resumes from the same place", () => {
    installBrowser();
    const audio = createAudio();
    audio.unlock();
    const song = created[0];
    assert.equal(song.paused, false);

    audio.holdForBackground();
    assert.equal(song.paused, true);

    audio.releaseFromBackground();
    assert.equal(song.paused, false);
    assert.equal(song.volume, MUSIC_VOLUME);
  });

  it("stays quiet in the background while muted or while a question is speaking", () => {
    installBrowser();
    const audio = createAudio();
    audio.unlock();
    audio.pauseForVoice();
    audio.holdForBackground();
    audio.resumeAfterVoice();
    assert.equal(created[0].paused, true);

    audio.releaseFromBackground();
    assert.equal(created[0].paused, false);

    audio.toggleMuted();
    audio.holdForBackground();
    audio.releaseFromBackground();
    assert.equal(created[0].paused, true);
  });

  it("does not start the track until the page is visible again", () => {
    installBrowser();
    const audio = createAudio();
    audio.holdForBackground();
    audio.unlock();
    assert.equal(created[0].paused, true);
    audio.releaseFromBackground();
    assert.equal(created[0].paused, false);
  });
});
