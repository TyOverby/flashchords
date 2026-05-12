import { React, html } from '../deps.js';
import { getAllChords, addChord, deleteChord } from '../data/chordStore.js';
import Fretboard, { FretboardMini } from '../components/Fretboard.js';

const { useState, useCallback } = React;

const EMPTY_FINGERING = [null, null, null, null, null, null];

export default function ChordListPage() {
  const [chords, setChords] = useState(() => getAllChords());
  const [name, setName] = useState('');
  const [fingering, setFingering] = useState([...EMPTY_FINGERING]);
  const [showAdd, setShowAdd] = useState(false);

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
      <a href="#/" className="back-link">← Back</a>
      <div className="row-between">
        <h2>Chords (${chords.length})</h2>
        <button onClick=${() => setShowAdd(!showAdd)}>
          ${showAdd ? 'Cancel' : '+ Add Chord'}
        </button>
      </div>

      ${showAdd && html`
        <div className="card">
          <div className="stack">
            <input type="text" placeholder="Chord name (e.g. Am)"
                   value=${name} onInput=${e => setName(e.target.value)} />
            <${Fretboard}
              positions=${fingering}
              onPositionChange=${handlePositionChange}
              interactive=${true}
            />
            <div className="row">
              <button onClick=${handleSave} disabled=${!name.trim()}>Save Chord</button>
              <button className="secondary" onClick=${() => setFingering([...EMPTY_FINGERING])}>Clear</button>
            </div>
          </div>
        </div>
      `}

      ${chords.length === 0 && !showAdd && html`
        <p className="text-muted text-center">No chords yet. Add some!</p>
      `}

      <div className="stack">
        ${chords.map(chord => html`
          <div key=${chord.id} className="card">
            <div className="row-between">
              <div className="row">
                <${FretboardMini} positions=${chord.fingering} />
                <div>
                  <div style=${{ fontWeight: 'bold', fontSize: '1.1rem' }}>${chord.name}</div>
                </div>
              </div>
              <button className="danger" onClick=${() => handleDelete(chord.id)}>Delete</button>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}
