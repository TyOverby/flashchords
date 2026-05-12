import { React, html } from '../deps.js';
import { getAllChords } from '../data/chordStore.js';
import { addDeck } from '../data/deckStore.js';
import { FretboardMini } from '../components/Fretboard.js';

const { useState, useMemo, useCallback } = React;

export default function DeckCreatePage() {
  const allChords = useMemo(() => getAllChords(), []);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deckName, setDeckName] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return allChords;
    const q = search.toLowerCase();
    return allChords.filter(c => c.name.toLowerCase().includes(q));
  }, [allChords, search]);

  const toggleChord = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const autoName = useMemo(() => {
    const names = allChords
      .filter(c => selectedIds.has(c.id))
      .map(c => c.name);
    return names.join(', ');
  }, [allChords, selectedIds]);

  const handleSave = useCallback(() => {
    if (selectedIds.size === 0) return;
    const name = deckName.trim() || autoName;
    addDeck(name, [...selectedIds]);
    window.location.hash = '#/';
  }, [deckName, autoName, selectedIds]);

  return html`
    <div class="stack">
      <a href="#/" class="back-link">← Back</a>
      <h2>Create Deck</h2>

      <input type="text" placeholder=${autoName || "Deck name"}
             value=${deckName} onInput=${e => setDeckName(e.target.value)} />

      <input type="text" class="search-input" placeholder="Search chords..."
             value=${search} onInput=${e => setSearch(e.target.value)} />

      ${allChords.length === 0 && html`
        <p class="text-muted text-center">No chords available. Add some chords first!</p>
      `}

      <div class="stack">
        ${filtered.map(chord => {
          const checked = selectedIds.has(chord.id);
          return html`
            <div key=${chord.id}
                 class=${`checkbox-row ${checked ? 'checked' : ''}`}
                 onClick=${() => toggleChord(chord.id)}>
              <div class="checkbox-indicator">${checked ? '✓' : ''}</div>
              <${FretboardMini} positions=${chord.fingering} />
              <div style=${{ fontWeight: 'bold' }}>${chord.name}</div>
            </div>
          `;
        })}
      </div>

      <button onClick=${handleSave} disabled=${selectedIds.size === 0}
              style=${{ position: 'sticky', bottom: 16 }}>
        Create Deck (${selectedIds.size} chord${selectedIds.size !== 1 ? 's' : ''})
      </button>
    </div>
  `;
}
