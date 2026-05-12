import { getAllChords, importChords } from './chordStore.js';
import { randomId } from './util.js';

const SEED_KEY = 'flashchords_seeded';

// Common open guitar chords
// Fingering: [lowE, A, D, G, B, highE]
// null = open, "X" = muted, 1-4 = fret number
const DEFAULT_CHORDS = [
  { name: 'C',  fingering: ['X', 3, 2, null, 1, null] },
  { name: 'D',  fingering: ['X', 'X', null, 2, 3, 2] },
  { name: 'E',  fingering: [null, 2, 2, 1, null, null] },
  { name: 'G',  fingering: [3, 2, null, null, null, 3] },
  { name: 'A',  fingering: ['X', null, 2, 2, 2, null] },
  { name: 'Am', fingering: ['X', null, 2, 2, 1, null] },
  { name: 'Em', fingering: [null, 2, 2, null, null, null] },
  { name: 'Dm', fingering: ['X', 'X', null, 2, 3, 1] },
];

export function seedIfNeeded() {
  if (localStorage.getItem(SEED_KEY)) return;
  if (getAllChords().length > 0) {
    localStorage.setItem(SEED_KEY, '1');
    return;
  }

  const chords = DEFAULT_CHORDS.map(c => ({
    id: randomId(),
    name: c.name,
    fingering: c.fingering,
  }));

  importChords(chords);
  localStorage.setItem(SEED_KEY, '1');
}
