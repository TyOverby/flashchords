import { randomId } from './util.js';

const STORAGE_KEY = 'flashchords_chords';

function loadChords() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveChords(chords) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chords));
}

export function getAllChords() {
  return loadChords();
}

export function getChord(id) {
  return loadChords().find(c => c.id === id) || null;
}

export function addChord(name, fingering) {
  const chords = loadChords();
  const chord = {
    id: randomId(),
    name: name.trim(),
    fingering: [...fingering],
  };
  chords.push(chord);
  saveChords(chords);
  return chord;
}

export function deleteChord(id) {
  const chords = loadChords().filter(c => c.id !== id);
  saveChords(chords);
}

export function updateChord(id, updates) {
  const chords = loadChords();
  const idx = chords.findIndex(c => c.id === id);
  if (idx === -1) return null;
  chords[idx] = { ...chords[idx], ...updates };
  saveChords(chords);
  return chords[idx];
}

// Bulk import (used by seed/import)
export function importChords(chords) {
  saveChords(chords);
}
