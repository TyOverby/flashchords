import { React, html } from '../deps.js';
import { getDeck } from '../data/deckStore.js';
import { getChord } from '../data/chordStore.js';
import Fretboard from '../components/Fretboard.js';

const { useState, useCallback, useEffect, useMemo, useRef } = React;

const MODES = [
  { id: 'name2fret', label: 'A → ●' },
  { id: 'fret2name', label: 'A ← ●' },
  { id: 'both',      label: 'A ↔ ●' },
];

const EMPTY_FINGERING = [null, null, null, null, null, null];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildFeedback(guess, answer) {
  // Returns feedbackData: array of 6 arrays of { fret, color }
  const feedback = [];
  for (let s = 0; s < 6; s++) {
    const dots = [];
    const g = normalizePos(guess[s]);
    const a = normalizePos(answer[s]);

    if (g === a) {
      // Correct — show green if there's a fret dot
      if (a !== null && a !== "X" && a > 0) {
        dots.push({ fret: a, color: 'green' });
      }
    } else {
      // Show the wrong guess in red
      if (g !== null && g !== "X" && g > 0) {
        dots.push({ fret: g, color: 'red' });
      }
      // Show the correct answer in black (missing)
      if (a !== null && a !== "X" && a > 0) {
        dots.push({ fret: a, color: 'black' });
      }
    }
    feedback.push(dots);
  }
  return feedback;
}

function normalizePos(p) {
  if (p === null || p === undefined || p === 0) return null;
  return p;
}

function isCorrect(guess, answer) {
  for (let s = 0; s < 6; s++) {
    if (normalizePos(guess[s]) !== normalizePos(answer[s])) return false;
  }
  return true;
}

export default function QuizPage({ deckId }) {
  const [mode, setMode] = useState('name2fret');
  const [deck, setDeck] = useState(null);
  const [chords, setChords] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [guess, setGuess] = useState([...EMPTY_FINGERING]);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
  const [feedbackData, setFeedbackData] = useState(null);
  const [disabledNames, setDisabledNames] = useState(new Set());
  const [effectiveMode, setEffectiveMode] = useState('name2fret');
  const timerRef = useRef(null);

  // Load deck and chords
  useEffect(() => {
    const d = getDeck(deckId);
    if (!d) return;
    setDeck(d);
    const cs = d.chordIds.map(getChord).filter(Boolean);
    setChords(cs);
    setQueue(shuffle(cs));
    setCurrentIdx(0);
  }, [deckId]);

  // Pick effective mode for current card
  useEffect(() => {
    if (mode === 'both') {
      setEffectiveMode(Math.random() < 0.5 ? 'name2fret' : 'fret2name');
    } else {
      setEffectiveMode(mode);
    }
  }, [mode, currentIdx]);

  const currentChord = queue[currentIdx] || null;

  const nextCard = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setFeedback(null);
    setFeedbackData(null);
    setGuess([...EMPTY_FINGERING]);
    setDisabledNames(new Set());
    if (currentIdx + 1 >= queue.length) {
      // Reshuffle
      setQueue(prev => shuffle(prev));
      setCurrentIdx(0);
    } else {
      setCurrentIdx(prev => prev + 1);
    }
  }, [currentIdx, queue.length]);

  // --- Name → Fingering mode ---
  const handlePositionChange = useCallback((stringIndex, value) => {
    if (feedback) return;
    setGuess(prev => {
      const next = [...prev];
      next[stringIndex] = value;
      return next;
    });
  }, [feedback]);

  const handleGuess = useCallback(() => {
    if (!currentChord) return;
    const correct = isCorrect(guess, currentChord.fingering);
    if (correct) {
      setFeedback('correct');
      timerRef.current = setTimeout(nextCard, 600);
    } else {
      setFeedback('wrong');
      setFeedbackData(buildFeedback(guess, currentChord.fingering));
    }
  }, [guess, currentChord, nextCard]);

  // --- Fingering → Name mode ---
  const handleNameGuess = useCallback((chordName) => {
    if (!currentChord) return;
    if (chordName === currentChord.name) {
      setFeedback('correct');
      timerRef.current = setTimeout(nextCard, 600);
    } else {
      setFeedback('tryagain');
      setDisabledNames(prev => new Set([...prev, chordName]));
    }
  }, [currentChord, nextCard]);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!deck) {
    return html`
      <div class="stack">
        <a href="#/" class="back-link">← Back</a>
        <p class="text-center text-muted">Deck not found.</p>
      </div>
    `;
  }

  if (chords.length === 0) {
    return html`
      <div class="stack">
        <a href="#/" class="back-link">← Back</a>
        <p class="text-center text-muted">This deck has no valid chords.</p>
      </div>
    `;
  }

  const uniqueNames = useMemo(() => {
    return [...new Set(chords.map(c => c.name))];
  }, [chords]);

  const progress = `${(currentIdx % queue.length) + 1} / ${queue.length}`;

  return html`
    <div class="stack">
      <a href="#/" class="back-link">← Back</a>

      <div class="text-center text-muted" style=${{ marginBottom: 4 }}>${deck.name}</div>

      <div class="mode-selector">
        ${MODES.map(m => html`
          <button key=${m.id}
                  class=${`mode-btn ${mode === m.id ? 'active' : ''}`}
                  onClick=${() => { setMode(m.id); nextCard(); }}>
            ${m.label}
          </button>
        `)}
      </div>

      <div class="text-center text-muted" style=${{ fontSize: '0.8rem' }}>${progress}</div>

      ${currentChord && effectiveMode === 'name2fret' && html`
        <${NameToFretQuiz}
          chord=${currentChord}
          guess=${guess}
          feedback=${feedback}
          feedbackData=${feedbackData}
          onPositionChange=${handlePositionChange}
          onGuess=${handleGuess}
          onNext=${nextCard}
        />
      `}

      ${currentChord && effectiveMode === 'fret2name' && html`
        <${FretToNameQuiz}
          chord=${currentChord}
          names=${uniqueNames}
          feedback=${feedback}
          disabledNames=${disabledNames}
          onNameGuess=${handleNameGuess}
          onNext=${nextCard}
        />
      `}
    </div>
  `;
}

function NameToFretQuiz({ chord, guess, feedback, feedbackData, onPositionChange, onGuess, onNext }) {
  return html`
    <div class="stack text-center">
      <div style=${{ fontSize: '2rem', fontWeight: 'bold' }}>${chord.name}</div>

      ${!feedback && html`
        <${Fretboard}
          positions=${guess}
          onPositionChange=${onPositionChange}
          interactive=${true}
        />
      `}

      ${feedback === 'correct' && html`
        <div class="feedback-correct">Correct!</div>
      `}

      ${feedback === 'wrong' && html`
        <${Fretboard}
          positions=${guess}
          displayMode="feedback"
          feedbackData=${feedbackData}
        />
      `}

      ${!feedback && html`
        <button onClick=${onGuess}>Guess</button>
      `}

      ${feedback === 'wrong' && html`
        <div>
          <p class="feedback-wrong">Not quite! Tap to continue.</p>
          <button onClick=${onNext}>Next</button>
        </div>
      `}
    </div>
  `;
}

function FretToNameQuiz({ chord, names, feedback, disabledNames, onNameGuess, onNext }) {
  return html`
    <div class="stack text-center">
      <div style=${{ fontSize: '1rem', color: 'var(--text-muted)' }}>What chord is this?</div>

      <${Fretboard} positions=${chord.fingering} interactive=${false} />

      ${feedback === 'correct' && html`
        <div class="feedback-correct">Correct!</div>
      `}

      ${feedback === 'tryagain' && html`
        <div class="feedback-wrong">Try again!</div>
      `}

      ${feedback !== 'correct' && html`
        <div class="chip-grid" style=${{ justifyContent: 'center' }}>
          ${names.map(name => html`
            <button key=${name}
                    class=${`chip ${disabledNames.has(name) ? '' : ''}`}
                    disabled=${disabledNames.has(name)}
                    onClick=${() => onNameGuess(name)}>
              ${name}
            </button>
          `)}
        </div>
      `}
    </div>
  `;
}
