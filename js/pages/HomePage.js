import { React, html } from '../deps.js';
import { getAllDecks, deleteDeck } from '../data/deckStore.js';
import { getAllChords } from '../data/chordStore.js';
import { exportData } from '../data/exportImport.js';

const { useState, useCallback } = React;

export default function HomePage() {
  const [decks, setDecks] = useState(() => getAllDecks());
  const chords = getAllChords();

  const handleDeleteDeck = useCallback((id) => {
    if (!confirm('Delete this deck?')) return;
    deleteDeck(id);
    setDecks(getAllDecks());
  }, []);

  return html`
    <div class="stack">
      <div class="card">
        <div class="row-between">
          <h2 style=${{ margin: 0 }}>Chords</h2>
          <a href="#/chords">
            <button class="secondary">Manage Chords (${chords.length})</button>
          </a>
        </div>
      </div>

      <div class="card">
        <div class="row-between" style=${{ marginBottom: 12 }}>
          <h2 style=${{ margin: 0 }}>Decks</h2>
          <a href="#/deck/create">
            <button>+ New Deck</button>
          </a>
        </div>

        ${decks.length === 0 && html`
          <p class="text-muted">No decks yet. Create one to start quizzing!</p>
        `}

        <div class="stack">
          ${decks.map(deck => html`
            <div key=${deck.id} class="row-between" style=${{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style=${{ flex: 1 }}>
                <div style=${{ fontWeight: 'bold' }}>${deck.name}</div>
                <div class="text-muted">${deck.chordIds.length} chord${deck.chordIds.length !== 1 ? 's' : ''}</div>
              </div>
              <div class="row">
                <a href=${`#/quiz/${deck.id}`}>
                  <button class="secondary" style=${{ fontSize: '0.85rem', padding: '6px 12px' }}>Quiz</button>
                </a>
                <button class="danger" onClick=${() => handleDeleteDeck(deck.id)}>Delete</button>
              </div>
            </div>
          `)}
        </div>
      </div>

      <div style=${{ textAlign: 'center', marginTop: 8 }}>
        <button class="secondary" onClick=${exportData} style=${{ fontSize: '0.85rem' }}>
          Export Data (JSON)
        </button>
      </div>
    </div>
  `;
}
