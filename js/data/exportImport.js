import { getAllChords, importChords } from './chordStore.js';
import { getAllDecks, importDecks } from './deckStore.js';

export function exportData() {
  const data = {
    version: 1,
    chords: getAllChords(),
    decks: getAllDecks(),
    exportedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `flashchords-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function clearData() {
  importChords([]);
  importDecks([]);
  localStorage.removeItem('flashchords_seeded');
}

export function importData(jsonString) {
  const data = JSON.parse(jsonString);
  if (!data.chords || !data.decks) {
    throw new Error('Invalid data format');
  }
  importChords(data.chords);
  importDecks(data.decks);
  return { chords: data.chords.length, decks: data.decks.length };
}
