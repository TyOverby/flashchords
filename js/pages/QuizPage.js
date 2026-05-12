import { React, html } from '../deps.js';
import { getDeck } from '../data/deckStore.js';
import { getChord } from '../data/chordStore.js';
import Fretboard from '../components/Fretboard.js';
import { ArrowLeftIcon, ArrowRightIcon } from '../components/Icons.js';

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
  // Returns { feedbackDots, muteMarkers }
  // feedbackDots: array of 6 arrays of { fret, color } (fret dot feedback)
  // muteMarkers: array of 6 (null | 'wrong-mute' | 'missed-mute')
  const feedbackDots = [];
  const muteMarkers = [];
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
      // Show the wrong guess as a red outline
      if (g !== null && g !== "X" && g > 0) {
        dots.push({ fret: g, color: 'red-outline' });
      }
      // Show the correct answer as solid red
      if (a !== null && a !== "X" && a > 0) {
        dots.push({ fret: a, color: 'red' });
      }
    }
    feedbackDots.push(dots);

    // Mute feedback: only about whether the string is muted or not
    const gMuted = g === "X";
    const aMuted = a === "X";
    if (gMuted && !aMuted) {
      muteMarkers.push('wrong-mute');
    } else if (!gMuted && aMuted) {
      muteMarkers.push('missed-mute');
    } else {
      muteMarkers.push(null);
    }
  }
  return { feedbackDots, muteMarkers };
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
  const [modeIndex, setModeIndex] = useState(0);
  const [deck, setDeck] = useState(null);
  const [chords, setChords] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [guess, setGuess] = useState([...EMPTY_FINGERING]);
  const [feedback, setFeedback] = useState(null); // null | 'correct' | 'wrong'
  const [feedbackData, setFeedbackData] = useState(null);
  const [muteMarkers, setMuteMarkers] = useState(null);
  const [disabledNames, setDisabledNames] = useState(new Set());
  const [effectiveMode, setEffectiveMode] = useState('name2fret');
  const [showTryAgain, setShowTryAgain] = useState(false);
  const timerRef = useRef(null);
  const tryAgainTimerRef = useRef(null);

  const mode = MODES[modeIndex].id;

  const cycleMode = useCallback(() => {
    setModeIndex(prev => (prev + 1) % MODES.length);
  }, []);

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
    if (tryAgainTimerRef.current) clearTimeout(tryAgainTimerRef.current);
    setFeedback(null);
    setFeedbackData(null);
    setMuteMarkers(null);
    setGuess([...EMPTY_FINGERING]);
    setDisabledNames(new Set());
    setShowTryAgain(false);
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
      const result = buildFeedback(guess, currentChord.fingering);
      setFeedbackData(result.feedbackDots);
      setMuteMarkers(result.muteMarkers);
    }
  }, [guess, currentChord, nextCard]);

  // --- Fingering → Name mode ---
  const handleNameGuess = useCallback((chordName) => {
    if (!currentChord) return;
    if (chordName === currentChord.name) {
      setFeedback('correct');
      timerRef.current = setTimeout(nextCard, 600);
    } else {
      setDisabledNames(prev => new Set([...prev, chordName]));
      setShowTryAgain(true);
      if (tryAgainTimerRef.current) clearTimeout(tryAgainTimerRef.current);
      tryAgainTimerRef.current = setTimeout(() => setShowTryAgain(false), 500);
    }
  }, [currentChord, nextCard]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (tryAgainTimerRef.current) clearTimeout(tryAgainTimerRef.current);
    };
  }, []);

  const uniqueNames = useMemo(() => {
    return [...new Set(chords.map(c => c.name))];
  }, [chords]);

  if (!deck) {
    return html`
      <div className="stack">
        <a href="#/" className="back-link"><${ArrowLeftIcon} size=${16} /> Back</a>
        <p className="text-center text-muted">Deck not found.</p>
      </div>
    `;
  }

  if (chords.length === 0) {
    return html`
      <div className="stack">
        <a href="#/" className="back-link"><${ArrowLeftIcon} size=${16} /> Back</a>
        <p className="text-center text-muted">This deck has no valid chords.</p>
      </div>
    `;
  }

  return html`
    <div className="stack">
      <div className="quiz-topbar">
        <a href="#/" className="back-link" style=${{ marginBottom: 0 }}><${ArrowLeftIcon} size=${16} /> Back</a>
        <span className="quiz-deck-name">${deck.name}</span>
        <button className="mode-cycle-btn" onClick=${() => { cycleMode(); nextCard(); }}>
          ${MODES[modeIndex].label}
        </button>
      </div>

      ${showTryAgain && html`
        <div className="try-again-overlay">Try again!</div>
      `}

      ${currentChord && effectiveMode === 'name2fret' && html`
        <${NameToFretQuiz}
          chord=${currentChord}
          guess=${guess}
          feedback=${feedback}
          feedbackData=${feedbackData}
          muteMarkers=${muteMarkers}
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
        />
      `}
    </div>
  `;
}

function NameToFretQuiz({ chord, guess, feedback, feedbackData, muteMarkers, onPositionChange, onGuess, onNext }) {
  return html`
    <div className="stack text-center">
      <div style=${{ fontSize: '2rem', fontWeight: 'bold' }}>${chord.name}</div>

      ${!feedback && html`
        <${Fretboard}
          positions=${guess}
          onPositionChange=${onPositionChange}
          interactive=${true}
        />
      `}

      ${feedback === 'correct' && html`
        <div className="feedback-correct">Correct!</div>
      `}

      ${feedback === 'wrong' && html`
        <${Fretboard}
          positions=${guess}
          displayMode="feedback"
          feedbackData=${feedbackData}
          muteMarkers=${muteMarkers}
        />
      `}

      ${!feedback && html`
        <button onClick=${onGuess}>Guess</button>
      `}

      ${feedback === 'wrong' && html`
        <div>
          <p className="feedback-wrong">Not quite! Tap to continue.</p>
          <button onClick=${onNext}>Next</button>
        </div>
      `}
    </div>
  `;
}

function FretToNameQuiz({ chord, names, feedback, disabledNames, onNameGuess }) {
  return html`
    <div className="stack text-center">
      <${Fretboard} positions=${chord.fingering} interactive=${false} />

      ${feedback === 'correct' && html`
        <div className="feedback-correct">Correct!</div>
      `}

      ${feedback !== 'correct' && html`
        <div className="chip-grid" style=${{ justifyContent: 'center' }}>
          ${names.map(name => html`
            <button key=${name}
                    className="chip"
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
