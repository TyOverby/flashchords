// Karplus-Strong plucked string synthesis
// Adapted for FlashChords app fingering format:
//   null = open (fret 0), "X" = muted (skip), 1-4 = fret number

let context;
let dampening = 0.99;

function ensureContext() {
  if (!context) {
    context = new AudioContext();
  }
  return context;
}

function pluck(frequency) {
  const ctx = ensureContext();
  const pluckSize = Math.round(ctx.sampleRate / frequency);
  const buffer = new Float32Array(pluckSize);

  // Fill with noise burst
  for (let i = 0; i < pluckSize; i++) {
    buffer[i] = Math.random() * 2 - 1;
  }

  let bufferIndex = 0;
  const node = ctx.createScriptProcessor(4096, 0, 1);
  node.onaudioprocess = function (e) {
    const output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < output.length; i++) {
      buffer[bufferIndex] =
        ((buffer[bufferIndex] + buffer[(bufferIndex + 1) % pluckSize]) / 2) *
        dampening;
      output[i] = buffer[bufferIndex];
      bufferIndex = (bufferIndex + 1) % pluckSize;
    }
  };

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = frequency;
  bandpass.Q.value = 1;

  node.connect(bandpass);

  setTimeout(() => { node.disconnect(); }, 2000);
  setTimeout(() => { bandpass.disconnect(); }, 2000);

  return bandpass;
}

function getFrequency(string, fret) {
  // Concert A = 110 Hz (A2)
  const A = 110;
  // Semitone offsets from A for standard tuning (E A D G B E)
  const offsets = [-5, 0, 5, 10, 14, 19];
  return A * Math.pow(2, (fret + offsets[string]) / 12);
}

// Convert app fingering value to a numeric fret (or null to skip)
function toFret(pos) {
  if (pos === 'X') return null;
  if (pos === null || pos === undefined || pos === 0) return 0;
  return pos;
}

/**
 * Play a full chord strum.
 * @param {Array} fingering - App-format fingering array (6 elements)
 * @param {number} stagger  - Milliseconds between each string pluck
 */
export function playChord(fingering, stagger = 25) {
  const ctx = ensureContext();
  dampening = 0.99;

  ctx.resume().then(() => {
    const dst = ctx.destination;
    for (let i = 0; i < 6; i++) {
      const fret = toFret(fingering[i]);
      if (fret !== null) {
        setTimeout(() => {
          pluck(getFrequency(i, fret)).connect(dst);
        }, stagger * i);
      }
    }
  });
}

/**
 * Play a single string at a given fret.
 * @param {number} stringIndex - 0 (low E) to 5 (high E)
 * @param {*} fretValue        - App-format value: null/0 = open, "X" = skip, 1-4 = fret
 */
export function playString(stringIndex, fretValue) {
  const fret = toFret(fretValue);
  if (fret === null) return; // muted — nothing to play

  const ctx = ensureContext();
  dampening = 0.99;

  ctx.resume().then(() => {
    pluck(getFrequency(stringIndex, fret)).connect(ctx.destination);
  });
}
