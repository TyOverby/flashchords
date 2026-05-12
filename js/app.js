import { React, ReactDOM, html } from './deps.js';
import { seedIfNeeded } from './data/seedData.js';
import HomePage from './pages/HomePage.js';
import ChordListPage from './pages/ChordListPage.js';
import DeckCreatePage from './pages/DeckCreatePage.js';
import QuizPage from './pages/QuizPage.js';

seedIfNeeded();

const { useState, useEffect } = React;

const pages = {
  home: HomePage,
  chords: ChordListPage,
  deckCreate: DeckCreatePage,
  quiz: QuizPage,
};

function parseHash() {
  const hash = window.location.hash || '#/';
  const parts = hash.slice(2).split('/').filter(Boolean);
  if (parts.length === 0) return { page: 'home', params: {} };
  if (parts[0] === 'chords') return { page: 'chords', params: {} };
  if (parts[0] === 'deck' && parts[1] === 'create') return { page: 'deckCreate', params: {} };
  if (parts[0] === 'quiz' && parts[1]) return { page: 'quiz', params: { deckId: parts[1] } };
  return { page: 'home', params: {} };
}

function App() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const PageComponent = pages[route.page];

  return html`
    <div>
      ${route.page !== 'quiz' && html`
        <h1 onClick=${() => window.location.hash = '#/'} style=${{ cursor: 'pointer' }}>
          FlashChords
        </h1>
      `}
      ${PageComponent
        ? html`<${PageComponent} ...${route.params} />`
        : html`<p className="text-center text-muted">Loading...</p>`
      }
    </div>
  `;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(html`<${App} />`);
