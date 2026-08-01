// Presets de sonido del metrónomo: describen una onda (seno/cuadrada/
// triangular) con una envolvente de decaimiento exponencial, sintetizada
// en memoria por audioEngine.js (ver sampleAt).
export const BEEP_SOUNDS = [
  { id: 'classic', label: 'Clásico', type: 'synth', waveform: 'sine', frequency: 880, duration: 0.12, decay: 18 },
  { id: 'digital', label: 'Click Digital', type: 'synth', waveform: 'square', frequency: 1200, duration: 0.05, decay: 40 },
  { id: 'woodblock', label: 'Woodblock', type: 'synth', waveform: 'triangle', frequency: 600, duration: 0.09, decay: 30 },
  { id: 'cowbell', label: 'Cencerro', type: 'synth', waveform: 'sine', frequency: 587, frequency2: 845, duration: 0.15, decay: 14 },
  { id: 'soft', label: 'Suave', type: 'synth', waveform: 'sine', frequency: 440, duration: 0.2, decay: 8 },
];

export const DEFAULT_BEEP_ID = BEEP_SOUNDS[0].id;

export function sampleAt(waveform, t, frequency, frequency2) {
  switch (waveform) {
    case 'square':
      return Math.sign(Math.sin(2 * Math.PI * frequency * t)) || 1;
    case 'triangle':
      return 2 * Math.abs(2 * ((frequency * t) % 1) - 1) - 1;
    case 'sine':
    default: {
      const primary = Math.sin(2 * Math.PI * frequency * t);
      if (!frequency2) return primary;
      return 0.6 * primary + 0.4 * Math.sin(2 * Math.PI * frequency2 * t);
    }
  }
}
