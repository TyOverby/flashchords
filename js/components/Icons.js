import { html } from '../deps.js';

// Inline SVG icons based on Lucide icon set
// All icons are 20x20 with stroke-based rendering

const iconStyle = { display: 'inline-block', verticalAlign: 'middle', lineHeight: 0 };

function Icon({ d, size = 20, stroke = 'currentColor', strokeWidth = 2 }) {
  return html`
    <span style=${iconStyle}>
      <svg width=${size} height=${size} viewBox="0 0 24 24" fill="none"
           stroke=${stroke} strokeWidth=${strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        ${d}
      </svg>
    </span>
  `;
}

export function TrashIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  `} />`;
}

export function PlusIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  `} />`;
}

export function PlayIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <polygon points="5 3 19 12 5 21 5 3" />
  `} />`;
}

export function DownloadIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  `} />`;
}

export function ArrowLeftIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  `} />`;
}

export function PencilIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  `} />`;
}

export function ArrowRightIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  `} />`;
}

export function CheckIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <polyline points="20 6 9 17 4 12" />
  `} />`;
}

export function XIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  `} />`;
}

export function UploadIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  `} />`;
}

export function EraserIcon({ size }) {
  return html`<${Icon} size=${size} d=${html`
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
    <line x1="7" y1="21" x2="21" y2="21" />
  `} />`;
}
