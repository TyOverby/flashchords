const STORAGE_KEY = 'flashchords_decks';

function loadDecks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveDecks(decks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

export function getAllDecks() {
  return loadDecks();
}

export function getDeck(id) {
  return loadDecks().find(d => d.id === id) || null;
}

export function addDeck(name, chordIds) {
  const decks = loadDecks();
  const deck = {
    id: crypto.randomUUID(),
    name: name.trim(),
    chordIds: [...chordIds],
  };
  decks.push(deck);
  saveDecks(decks);
  return deck;
}

export function deleteDeck(id) {
  const decks = loadDecks().filter(d => d.id !== id);
  saveDecks(decks);
}

export function updateDeck(id, updates) {
  const decks = loadDecks();
  const idx = decks.findIndex(d => d.id === id);
  if (idx === -1) return null;
  decks[idx] = { ...decks[idx], ...updates };
  saveDecks(decks);
  return decks[idx];
}

export function importDecks(decks) {
  saveDecks(decks);
}
