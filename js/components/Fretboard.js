import { html, React } from '../deps.js';

const { useState, useCallback, useRef } = React;

// Fretboard dimensions
const PADDING_LEFT = 40;
const PADDING_RIGHT = 20;
const PADDING_TOP = 30;
const PADDING_BOTTOM = 20;
const NUM_STRINGS = 6;
const NUM_FRETS = 4;
const FRET_SPACING = 50;
const STRING_SPACING = 30;
const WIDTH = PADDING_LEFT + (NUM_STRINGS - 1) * STRING_SPACING + PADDING_RIGHT;
const HEIGHT = PADDING_TOP + NUM_FRETS * FRET_SPACING + PADDING_BOTTOM;
const NUT_Y = PADDING_TOP;
const DOT_RADIUS = 10;

function stringX(stringIndex) {
  // String 0 = low E (leftmost), String 5 = high E (rightmost)
  return PADDING_LEFT + stringIndex * STRING_SPACING;
}

function fretY(fret) {
  // Fret 1 top, fret 4 bottom. Dot goes in the middle of the fret space.
  return NUT_Y + (fret - 0.5) * FRET_SPACING;
}

// positions: array of 6 values
//   null or 0 = open string
//   "X" = muted
//   1-4 = fret number
//
// displayMode: null (interactive/static) or "feedback"
// feedbackData: array of 6 arrays, each containing { fret, color } objects
//   colors: "green" = correct, "red" = wrong, "black" = missing
// interactive: whether clicking changes positions
// size: "normal" or "small" for thumbnails

export default function Fretboard({ positions = [null,null,null,null,null,null], onPositionChange, displayMode, feedbackData, interactive = false, size = "normal" }) {
  const scale = size === "small" ? 0.45 : 1;
  const svgW = WIDTH * scale;
  const svgH = HEIGHT * scale;

  const [eventLog, setEventLog] = useState([]);
  const logEvent = useCallback((entry) => {
    setEventLog(prev => [entry, ...prev].slice(0, 50));
  }, []);

  function computeHit(svg, clientX, clientY) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = svgPt.x;
    const y = svgPt.y;

    let closestString = 0;
    let minDist = Infinity;
    for (let s = 0; s < NUM_STRINGS; s++) {
      const d = Math.abs(x - stringX(s));
      if (d < minDist) { minDist = d; closestString = s; }
    }

    let zone, closestFret = null;
    if (minDist > STRING_SPACING * 0.7) {
      zone = 'rejected';
    } else if (y < NUT_Y) {
      zone = 'mute';
    } else {
      zone = 'fret';
      closestFret = 1;
      let minFretDist = Infinity;
      for (let f = 1; f <= NUM_FRETS; f++) {
        const d = Math.abs(y - fretY(f));
        if (d < minFretDist) { minFretDist = d; closestFret = f; }
      }
    }

    return { x: Math.round(x), y: Math.round(y), string: closestString, stringDist: Math.round(minDist), zone, fret: closestFret };
  }

  const handlePointerUp = useCallback((e) => {
    if (!interactive || !onPositionChange) return;
    e.preventDefault();
    const svg = e.currentTarget;
    const hit = computeHit(svg, e.clientX, e.clientY);
    logEvent({ type: 'pointerup', time: Date.now(), pointerType: e.pointerType, ...hit });

    if (hit.zone === 'rejected') return;

    if (hit.zone === 'mute') {
      const current = positions[hit.string];
      const newVal = (current === "X") ? null : "X";
      onPositionChange(hit.string, newVal);
      return;
    }

    const current = positions[hit.string];
    const newVal = (current === hit.fret) ? null : hit.fret;
    onPositionChange(hit.string, newVal);
  }, [interactive, onPositionChange, positions, logEvent]);

  const handleDebugEvent = useCallback((e) => {
    if (!interactive) return;
    const svg = e.currentTarget;
    const hit = computeHit(svg, e.clientX, e.clientY);
    logEvent({ type: e.type, time: Date.now(), pointerType: e.pointerType || '', ...hit });
  }, [interactive, logEvent]);

  return html`
    <div className="fretboard-container">
      <svg
        width=${svgW}
        height=${svgH}
        viewBox="0 0 ${WIDTH} ${HEIGHT}"
        onPointerDown=${handleDebugEvent}
        onPointerUp=${handlePointerUp}
        onClick=${handleDebugEvent}
        style=${{ cursor: interactive ? 'pointer' : 'default', touchAction: 'none' }}
      >
        <!-- Debug hit zones -->
        ${interactive && Array.from({length: NUM_STRINGS}, (_, s) => {
          const sx = stringX(s);
          const halfSpacing = STRING_SPACING / 2;
          const maxDist = STRING_SPACING * 0.7;
          const xLeft = s === 0 ? sx - maxDist : sx - halfSpacing;
          const xRight = s === NUM_STRINGS - 1 ? sx + maxDist : sx + halfSpacing;
          const w = xRight - xLeft;
          const rects = [];
          // Mute/open zone (above nut)
          rects.push(html`<rect key=${"dbg-mute-"+s} x=${xLeft} y=${0} width=${w} height=${NUT_Y}
            fill=${s % 2 === 0 ? "rgba(0,100,255,0.15)" : "rgba(255,100,0,0.15)"}
            stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />`);
          // Fret zones
          for (let f = 1; f <= NUM_FRETS; f++) {
            const yTop = f === 1 ? NUT_Y : (fretY(f-1) + fretY(f)) / 2;
            const yBottom = f === NUM_FRETS ? HEIGHT : (fretY(f) + fretY(f+1)) / 2;
            rects.push(html`<rect key=${"dbg-fret-"+s+"-"+f} x=${xLeft} y=${yTop} width=${w} height=${yBottom - yTop}
              fill=${(s + f) % 2 === 0 ? "rgba(0,100,255,0.15)" : "rgba(255,100,0,0.15)"}
              stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />`);
          }
          return rects;
        })}

        <!-- Nut -->
        <line x1=${stringX(0)} y1=${NUT_Y} x2=${stringX(NUM_STRINGS-1)} y2=${NUT_Y}
              stroke="#ccc" strokeWidth="4" />

        <!-- Frets -->
        ${Array.from({length: NUM_FRETS}, (_, i) => {
          const y = NUT_Y + (i + 1) * FRET_SPACING;
          return html`<line key=${"fret-"+i} x1=${stringX(0)} y1=${y} x2=${stringX(NUM_STRINGS-1)} y2=${y}
                            stroke="#666" strokeWidth="2" />`;
        })}

        <!-- Strings -->
        ${Array.from({length: NUM_STRINGS}, (_, i) => {
          const x = stringX(i);
          return html`<line key=${"string-"+i} x1=${x} y1=${NUT_Y} x2=${x} y2=${NUT_Y + NUM_FRETS * FRET_SPACING}
                            stroke="#aaa" strokeWidth=${1 + (NUM_STRINGS - 1 - i) * 0.3} />`;
        })}

        <!-- Open/Mute markers above nut -->
        ${positions.map((pos, i) => {
          const x = stringX(i);
          const y = NUT_Y - 14;
          if (pos === "X") {
            return html`<text key=${"mark-"+i} x=${x} y=${y} textAnchor="middle"
                              fontSize="14" fontWeight="bold" fill="#f44"
                              dominantBaseline="middle">X</text>`;
          }
          if (pos === null || pos === 0) {
            return html`<circle key=${"mark-"+i} cx=${x} cy=${y} r="6"
                                fill="none" stroke="#aaa" strokeWidth="1.5" />`;
          }
          return null;
        })}

        <!-- Finger dots (normal mode) -->
        ${displayMode !== "feedback" && positions.map((pos, i) => {
          if (pos === null || pos === 0 || pos === "X") return null;
          const fret = typeof pos === 'number' ? pos : parseInt(pos);
          if (isNaN(fret) || fret < 1 || fret > NUM_FRETS) return null;
          return html`<circle key=${"dot-"+i} cx=${stringX(i)} cy=${fretY(fret)} r=${DOT_RADIUS}
                              fill="#e94560" />`;
        })}

        <!-- Feedback dots -->
        ${displayMode === "feedback" && feedbackData && feedbackData.map((stringDots, i) => {
          if (!stringDots) return null;
          return stringDots.map((dot, j) => {
            const colors = { green: "#4caf50", red: "#f44336", black: "#333" };
            return html`<circle key=${"fb-"+i+"-"+j} cx=${stringX(i)} cy=${fretY(dot.fret)}
                                r=${DOT_RADIUS} fill=${colors[dot.color] || "#333"}
                                stroke=${dot.color === "black" ? "#999" : "none"} strokeWidth="1.5" />`;
          });
        })}
      </svg>
      ${interactive && html`
        <div style=${{ maxHeight: '150px', overflow: 'auto', fontSize: '11px', fontFamily: 'monospace', background: '#1a1a2e', border: '1px solid #333', borderRadius: '4px', padding: '4px', marginTop: '8px' }}>
          <div style=${{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <strong>Event Log</strong>
            <button onClick=${() => setEventLog([])} style=${{ fontSize: '10px', padding: '0 4px', cursor: 'pointer' }}>Clear</button>
          </div>
          ${eventLog.map((entry, i) => {
            const dt = entry.time % 100000;
            return html`<div key=${i} style=${{ color: entry.type === 'pointerup' ? '#4caf50' : '#888', borderBottom: '1px solid #222', padding: '1px 0' }}>
              <span>${entry.type}</span>${entry.pointerType ? html`<span>(${entry.pointerType})</span>` : null}
              ${' '}xy=(${entry.x},${entry.y}) str=${entry.string} dist=${entry.stringDist} ${entry.zone}${entry.fret != null ? html` f=${entry.fret}` : null}
            </div>`;
          })}
          ${eventLog.length === 0 && html`<div style=${{ color: '#666' }}>Tap the fretboard...</div>`}
        </div>
      `}
    </div>
  `;
}

// Mini fretboard for thumbnails
export function FretboardMini(props) {
  return html`<${Fretboard} ...${props} size="small" interactive=${false} />`;
}
