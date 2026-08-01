import { AudioContext, AudioManager } from 'react-native-audio-api';

import { BEEP_SOUNDS, sampleAt } from './beepSynth';

// AudioContext único para toda la app: da acceso a un reloj de hardware
// real (audioContext.currentTime) contra el cual se puede programar la
// reproducción con precisión de muestra, en vez de depender de timers de
// JS para disparar cada sonido.
let audioContext = null;
let sessionConfigured = false;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (!sessionConfigured) {
    sessionConfigured = true;
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosOptions: ['mixWithOthers'],
    });
  }
  return audioContext;
}

function findPreset(soundId) {
  return BEEP_SOUNDS.find((sound) => sound.id === soundId) || BEEP_SOUNDS[0];
}

function synthesizeBuffer(context, preset) {
  const { waveform, frequency, frequency2, duration, decay } = preset;
  const sampleRate = context.sampleRate;
  const numSamples = Math.floor(sampleRate * duration);
  const attackSamples = Math.floor(sampleRate * 0.003);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const attack = i < attackSamples ? i / attackSamples : 1;
    const envelope = attack * Math.exp(-decay * t);
    const raw = sampleAt(waveform, t, frequency, frequency2) * envelope;
    samples[i] = Math.max(-1, Math.min(1, raw));
  }

  const buffer = context.createBuffer(1, numSamples, sampleRate);
  buffer.copyToChannel(samples, 0);
  return buffer;
}

// Cache en memoria de AudioBuffer por preset, compartida por toda la app:
// los sintetizados se generan una sola vez, los de asset se decodifican
// una sola vez.
const bufferCache = new Map();

function loadBeepBuffer(soundId) {
  if (bufferCache.has(soundId)) {
    return bufferCache.get(soundId);
  }

  const context = getAudioContext();
  const preset = findPreset(soundId);

  const promise = Promise.resolve(synthesizeBuffer(context, preset));

  bufferCache.set(soundId, promise);
  return promise;
}

function playBuffer(context, buffer, when) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start(when);
  return source;
}

export function playBeepPreview(soundId) {
  const context = getAudioContext();
  loadBeepBuffer(soundId).then((buffer) => {
    playBuffer(context, buffer, context.currentTime);
  });
}

const SCHEDULE_AHEAD_SECONDS = 0.1;
const LOOKAHEAD_MS = 25;

// Look-ahead scheduler (técnica "A Tale of Two Clocks" de Chris Wilson):
// cada LOOKAHEAD_MS revisa qué beats caen dentro de los próximos
// SCHEDULE_AHEAD_SECONDS y los programa contra el reloj de audio con
// AudioBufferSourceNode.start(when) — el motor nativo los dispara en el
// instante exacto, el timer de JS solo decide qué programar. El callback
// visual (onBeat) se dispara con un setTimeout aparte, calculado contra el
// mismo instante, para que la UI quede sincronizada con lo que se escucha.
export function createMetronomeEngine() {
  const context = getAudioContext();

  let activeBuffer = null;
  let secondsPerBeat = 0.5;
  let nextNoteTime = 0;
  let lookaheadTimer = null;
  let running = false;
  let onBeat = null;

  function scheduleNote(time) {
    if (activeBuffer) {
      playBuffer(context, activeBuffer, time);
    }

    const delayMs = Math.max(0, (time - context.currentTime) * 1000);
    setTimeout(() => {
      if (running) onBeat?.();
    }, delayMs);
  }

  function schedulerLoop() {
    while (nextNoteTime < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      scheduleNote(nextNoteTime);
      nextNoteTime += secondsPerBeat;
    }
    lookaheadTimer = setTimeout(schedulerLoop, LOOKAHEAD_MS);
  }

  return {
    async setSound(soundId) {
      activeBuffer = await loadBeepBuffer(soundId);
    },
    start(bpm, onBeatCallback) {
      clearTimeout(lookaheadTimer);
      secondsPerBeat = 60 / bpm;
      onBeat = onBeatCallback;
      running = true;
      nextNoteTime = context.currentTime;
      schedulerLoop();
    },
    stop() {
      running = false;
      clearTimeout(lookaheadTimer);
      lookaheadTimer = null;
    },
    setBpm(bpm) {
      secondsPerBeat = 60 / bpm;
    },
    dispose() {
      running = false;
      clearTimeout(lookaheadTimer);
      lookaheadTimer = null;
    },
  };
}
