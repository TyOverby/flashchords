import { React, html } from '../deps.js';
import { getAllDecks, deleteDeck } from '../data/deckStore.js';
import { getAllChords } from '../data/chordStore.js';
import { exportData } from '../data/exportImport.js';
import { PencilIcon, PlusIcon, TrashIcon, DownloadIcon } from '../components/Icons.js';

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
      <section>
        <div className="row-between" style=${{ marginBottom: 8 }}>
          <h2 style=${{ margin: 0 }}>Chords</h2>
          <span className="text-muted">${chords.length}</span>
          <div className="row" style=${{ gap: 4 }}>
            <a href="#/chords">
              <button className="icon-btn" title="Edit chords"><${PencilIcon} size=${18} /></button>
            </a>
          </div>
        </div>
      </section>

      <section>
        <div className="row-between" style=${{ marginBottom: 8 }}>
          <h2 style=${{ margin: 0 }}>Decks</h2>
          <a href="#/deck/create">
            <button className="icon-btn" title="New deck"><${PlusIcon} size=${18} /></button>
          </a>
        </div>

        ${decks.length === 0 && html`
          <p className="text-muted">No decks yet. Create one to start quizzing!</p>
        `}

        <div className="stack">
          ${decks.map(deck => html`
            <div key=${deck.id} className="row-between" style=${{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <a href=${`#/quiz/${deck.id}`} style=${{ flex: 1, textDecoration: 'none', color: 'inherit' }}>
                <div style=${{ fontWeight: 'bold' }}>${deck.name}</div>
                <div className="text-muted">${deck.chordIds.length} chord${deck.chordIds.length !== 1 ? 's' : ''}</div>
              </a>
              <button className="icon-btn danger" onClick=${() => handleDeleteDeck(deck.id)} title="Delete deck">
                <${TrashIcon} size=${16} />
              </button>
            </div>
          `)}
        </div>
      </section>

      <div style=${{ textAlign: 'center', marginTop: 8 }}>
        <button className="icon-btn" onClick=${exportData} title="Export data as JSON">
          <${DownloadIcon} size=${18} />
        </button>
      </div>
    </div>
  `;
}
