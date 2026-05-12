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
    <div className="stack">
      <div className="card">
        <div className="row-between">
          <h2 style=${{ margin: 0 }}>Chords</h2>
          <a href="#/chords">
            <button className="secondary">Manage Chords (${chords.length})</button>
          </a>
        </div>
      </div>

      <div className="card">
        <div className="row-between" style=${{ marginBottom: 12 }}>
          <h2 style=${{ margin: 0 }}>Decks</h2>
          <a href="#/deck/create">
            <button>+ New Deck</button>
          </a>
        </div>

        ${decks.length === 0 && html`
          <p className="text-muted">No decks yet. Create one to start quizzing!</p>
        `}

        <div className="stack">
          ${decks.map(deck => html`
            <div key=${deck.id} className="row-between" style=${{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style=${{ flex: 1 }}>
                <div style=${{ fontWeight: 'bold' }}>${deck.name}</div>
                <div className="text-muted">${deck.chordIds.length} chord${deck.chordIds.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="row">
                <a href=${`#/quiz/${deck.id}`}>
                  <button className="secondary" style=${{ fontSize: '0.85rem', padding: '6px 12px' }}>Quiz</button>
                </a>
                <button className="danger" onClick=${() => handleDeleteDeck(deck.id)}>Delete</button>
              </div>
            </div>
          `)}
        </div>
      </div>

      <div style=${{ textAlign: 'center', marginTop: 8 }}>
        <button className="secondary" onClick=${exportData} style=${{ fontSize: '0.85rem' }}>
          Export Data (JSON)
        </button>
      </div>
    </div>
  `;
}
