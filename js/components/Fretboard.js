import { html, React } from '../deps.js';

const { useState, useCallback } = React;

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

export default function Fretboard({ positions = [null,null,null,null,null,null], onPositionChange, displayMode, feedbackData, muteMarkers, interactive = false, size = "normal" }) {
  const scale = size === "small" ? 0.45 : 1;
  const svgW = WIDTH * scale;
  const svgH = HEIGHT * scale;

  const handlePointerUp = useCallback((e) => {
    if (!interactive || !onPositionChange) return;
    e.preventDefault();
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = svgPt.x;
    const y = svgPt.y;

    // Find closest string
    let closestString = 0;
    let minDist = Infinity;
    for (let s = 0; s < NUM_STRINGS; s++) {
      const d = Math.abs(x - stringX(s));
      if (d < minDist) { minDist = d; closestString = s; }
    }
    if (minDist > STRING_SPACING * 0.7) return;

    // Check if clicking in mute/open zone (above nut)
    if (y < NUT_Y) {
      const current = positions[closestString];
      // Cycle: open -> X -> open
      const newVal = (current === "X") ? null : "X";
      onPositionChange(closestString, newVal);
      return;
    }

    // Find closest fret
    let closestFret = 1;
    let minFretDist = Infinity;
    for (let f = 1; f <= NUM_FRETS; f++) {
      const d = Math.abs(y - fretY(f));
      if (d < minFretDist) { minFretDist = d; closestFret = f; }
    }

    const current = positions[closestString];
    // Toggle: if same fret, clear to open; otherwise set fret
    const newVal = (current === closestFret) ? null : closestFret;
    onPositionChange(closestString, newVal);
  }, [interactive, onPositionChange, positions]);

  return html`
    <div className="fretboard-container">
      <svg
        width=${svgW}
        height=${svgH}
        viewBox="0 0 ${WIDTH} ${HEIGHT}"
        onPointerUp=${handlePointerUp}
        style=${{ cursor: interactive ? 'pointer' : 'default', touchAction: 'none' }}
      >
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
          const mute = muteMarkers ? muteMarkers[i] : null;
          if (pos === "X") {
            const fill = mute === 'wrong-mute' ? '#f44336' : '#999';
            return html`<text key=${"mark-"+i} x=${x} y=${y} textAnchor="middle"
                              fontSize="14" fontWeight="bold" fill=${fill}
                              dominantBaseline="middle">X</text>`;
          }
          const elements = [];
          if (pos === null || pos === 0) {
            elements.push(html`<circle key=${"mark-"+i} cx=${x} cy=${y} r="6"
                                fill="none" stroke="#aaa" strokeWidth="1.5" />`);
          }
          if (mute === 'missed-mute') {
            elements.push(html`<text key=${"missed-"+i} x=${x + (elements.length ? 10 : 0)} y=${y}
                                    textAnchor="middle" fontSize="14" fontWeight="bold"
                                    fill="#333" stroke="#999" strokeWidth="0.5"
                                    dominantBaseline="middle">X</text>`);
          }
          return elements.length ? elements : null;
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
    </div>
  `;
}

// Mini fretboard for thumbnails
export function FretboardMini(props) {
  return html`<${Fretboard} ...${props} size="small" interactive=${false} />`;
}
