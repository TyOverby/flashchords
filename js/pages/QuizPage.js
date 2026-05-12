import { html } from '../deps.js';

export default function QuizPage({ deckId }) {
  return html`
    <div class="stack">
      <a href="#/" class="back-link">← Back</a>
      <p class="text-center text-muted">Quiz for deck ${deckId} — coming soon</p>
    </div>
  `;
}
