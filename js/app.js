import { React, ReactDOM, html } from './deps.js';
import { seedIfNeeded } from './data/seedData.js';

seedIfNeeded();

const { useState, useEffect } = React;

// Lazy imports for pages
const pageModules = {
  home: () => import('./pages/HomePage.js'),
  chords: () => import('./pages/ChordListPage.js'),
  deckCreate: () => import('./pages/DeckCreatePage.js'),
  quiz: () => import('./pages/QuizPage.js'),
};

function parseHash() {
  const hash = window.location.hash || '#/';
  const parts = hash.slice(1).split('/').filter(Boolean);
  if (parts.length === 0) return { page: 'home', params: {} };
  if (parts[0] === 'chords') return { page: 'chords', params: {} };
  if (parts[0] === 'deck' && parts[1] === 'create') return { page: 'deckCreate', params: {} };
  if (parts[0] === 'quiz' && parts[1]) return { page: 'quiz', params: { deckId: parts[1] } };
  return { page: 'home', params: {} };
}

function App() {
  const [route, setRoute] = useState(parseHash);
  const [PageComponent, setPageComponent] = useState(null);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    setPageComponent(null);
    const loader = pageModules[route.page];
    if (loader) {
      loader().then(mod => {
        setPageComponent(() => mod.default);
      });
    }
  }, [route.page]);

  return html`
    <div>
      <h1 onClick=${() => window.location.hash = '#/'} style=${{ cursor: 'pointer' }}>
        FlashChords
      </h1>
      ${PageComponent
        ? html`<${PageComponent} ...${route.params} />`
        : html`<p className="text-center text-muted">Loading...</p>`
      }
    </div>
  `;
}

ReactDOM.render(html`<${App} />`, document.getElementById('root'));
