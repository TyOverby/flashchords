import { React, html } from '../deps.js';
import { getAllChords, addChord, deleteChord } from '../data/chordStore.js';
import Fretboard, { FretboardMini } from '../components/Fretboard.js';
import { TrashIcon, PlusIcon, XIcon, CheckIcon, EraserIcon, ArrowLeftIcon } from '../components/Icons.js';

const { useState, useCallback } = React;

const EMPTY_FINGERING = [null, null, null, null, null, null];

export default function ChordListPage() {
  const [chords, setChords] = useState(() => getAllChords());
  const [name, setName] = useState('');
  const [fingering, setFingering] = useState([...EMPTY_FINGERING]);
  const [showAdd, setShowAdd] = useState(() => window.location.hash.includes('/chords/add'));

  const handlePositionChange = useCallback((stringIndex, value) => {
    setFingering(prev => {
      const next = [...prev];
      next[stringIndex] = value;
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    addChord(name, fingering);
    setChords(getAllChords());
    setName('');
    setFingering([...EMPTY_FINGERING]);
    setShowAdd(false);
  }, [name, fingering]);

  const handleDelete = useCallback((id) => {
    if (!confirm('Delete this chord?')) return;
    deleteChord(id);
    setChords(getAllChords());
  }, []);

  return html`
    <div className="stack">
      <a href="#/" className="back-link"><${ArrowLeftIcon} size=${16} /> Back</a>
      <div className="row-between">
        <h2>Chords (${chords.length})</h2>
        <button className="icon-btn" onClick=${() => setShowAdd(!showAdd)} title=${showAdd ? 'Cancel' : 'Add chord'}>
          ${showAdd ? html`<${XIcon} size=${18} />` : html`<${PlusIcon} size=${18} />`}
        </button>
      </div>

      ${showAdd && html`
        <div className="stack" style=${{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <input type="text" placeholder="Chord name (e.g. Am)"
                 value=${name} onInput=${e => setName(e.target.value)} />
          <${Fretboard}
            positions=${fingering}
            onPositionChange=${handlePositionChange}
            interactive=${true}
          />
          <div className="row">
            <button onClick=${handleSave} disabled=${!name.trim()}><${CheckIcon} size=${16} /> Save</button>
            <button className="secondary" onClick=${() => setFingering([...EMPTY_FINGERING])}><${EraserIcon} size=${16} /> Clear</button>
          </div>
        </div>
      `}

      ${chords.length === 0 && !showAdd && html`
        <p className="text-muted text-center">No chords yet. Add some!</p>
      `}

      <div className="stack">
        ${chords.map(chord => html`
          <div key=${chord.id} className="row-between" style=${{ padding: '8px 0' }}>
            <div className="row">
              <${FretboardMini} positions=${chord.fingering} />
              <div style=${{ fontWeight: 'bold', fontSize: '1.1rem' }}>${chord.name}</div>
            </div>
            <button className="icon-btn danger" onClick=${() => handleDelete(chord.id)} title="Delete chord"><${TrashIcon} size=${16} /></button>
          </div>
        `)}
      </div>
    </div>
  `;
}
