import { React, html } from '../deps.js';
import { getAllDecks, deleteDeck } from '../data/deckStore.js';
import { getAllChords } from '../data/chordStore.js';
import { exportData, importData, clearData } from '../data/exportImport.js';
import { PencilIcon, PlusIcon, TrashIcon, DownloadIcon, UploadIcon } from '../components/Icons.js';

const { useState, useCallback, useRef } = React;

export default function HomePage() {
  const [decks, setDecks] = useState(() => getAllDecks());
  const chords = getAllChords();

  const fileInputRef = useRef(null);

  const handleDeleteDeck = useCallback((id) => {
    if (!confirm('Delete this deck?')) return;
    deleteDeck(id);
    setDecks(getAllDecks());
  }, []);

  const handleImport = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = importData(reader.result);
        alert(`Imported ${result.chords} chords and ${result.decks} decks.`);
        setDecks(getAllDecks());
      } catch (err) {
        alert('Failed to import: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleClear = useCallback(() => {
    if (!confirm('Clear all chords and decks? This cannot be undone.')) return;
    clearData();
    setDecks(getAllDecks());
  }, []);

  const chordNames = [...new Set(chords.map(c => c.name))].join(', ');

  return html`
    <div className="stack">
      <section>
        <div className="row-between" style=${{ marginBottom: 8 }}>
          <h2 style=${{ margin: 0 }}>Chords</h2>
          <div className="row" style=${{ gap: 4 }}>
            <button className="icon-btn" title="Add chord" onClick=${() => { window.location.hash = '#/chords/add'; }}><${PlusIcon} size=${18} /></button>
            <button className="icon-btn" title="Edit chords" onClick=${() => { window.location.hash = '#/chords'; }}><${PencilIcon} size=${18} /></button>
          </div>
        </div>
        ${chordNames && html`<div className="text-muted" style=${{ fontSize: '0.95rem' }}>${chordNames}</div>`}
      </section>

      <section>
        <div className="row-between" style=${{ marginBottom: 8 }}>
          <h2 style=${{ margin: 0 }}>Decks</h2>
          <button className="icon-btn" title="New deck" onClick=${() => { window.location.hash = '#/deck/create'; }}><${PlusIcon} size=${18} /></button>
        </div>

        ${decks.length === 0 && html`
          <p className="text-muted">No decks yet. Create one to start quizzing!</p>
        `}

        <div className="stack">
          ${decks.map(deck => html`
            <div key=${deck.id} className="row-between" style=${{ padding: '8px 0' }}>
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

      <section>
        <h2 style=${{ margin: '0 0 8px' }}>Storage</h2>
        <div className="row" style=${{ gap: 8, justifyContent: 'center' }}>
          <button className="icon-btn" onClick=${exportData} title="Download data as JSON">
            <${DownloadIcon} size=${18} />
          </button>
          <button className="icon-btn" onClick=${() => fileInputRef.current.click()} title="Upload data from JSON">
            <${UploadIcon} size=${18} />
          </button>
          <button className="icon-btn danger" onClick=${handleClear} title="Clear all data">
            <${TrashIcon} size=${18} />
          </button>
          <input type="file" accept=".json" ref=${fileInputRef} onChange=${handleImport}
                 style=${{ display: 'none' }} />
        </div>
      </section>
    </div>
  `;
}
