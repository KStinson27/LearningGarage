/*
 * Art: hand-drawn SVG pictures that can be recolored (emoji can't).
 * All vehicles face LEFT to match Apple's vehicle emoji.
 */
window.Art = (() => {
  const S = '#222'; // outline color

  function car(color = '#e53935') {
    return `<svg viewBox="0 0 124 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 46 Q6 33 20 31 L34 29 L46 13 Q50 9 58 9 L88 9 Q95 9 99 16 L107 29 Q118 31 118 42 L118 48 Q118 53 113 53 L11 53 Q6 53 6 46Z"
        fill="${color}" stroke="${S}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M40 29 L50 15 L69 15 L69 29Z" fill="#bfe6ff" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M75 29 L75 15 L89 15 Q93 15 95 19 L101 29Z" fill="#bfe6ff" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="13" cy="39" r="4" fill="#ffe066" stroke="${S}" stroke-width="2"/>
      <rect x="111" y="36" width="5" height="7" rx="2" fill="#ff5252"/>
      <g stroke="${S}" stroke-width="3">
        <circle cx="31" cy="54" r="12" fill="#333"/><circle cx="31" cy="54" r="5" fill="#cfd8dc"/>
        <circle cx="93" cy="54" r="12" fill="#333"/><circle cx="93" cy="54" r="5" fill="#cfd8dc"/>
      </g>
    </svg>`;
  }

  function wheel(cx, cy) {
    return `<g>
      <circle cx="${cx}" cy="${cy}" r="38" fill="#222"/>
      <circle cx="${cx}" cy="${cy}" r="35" fill="none" stroke="#3d3d3d" stroke-width="7" stroke-dasharray="7 6"/>
      <circle cx="${cx}" cy="${cy}" r="17" fill="#cfd8dc" stroke="${S}" stroke-width="3"/>
      <circle cx="${cx}" cy="${cy}" r="6" fill="#78909c"/>
    </g>`;
  }

  function monster(color = '#e53935') {
    return `<svg viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="40" y="80" width="120" height="14" rx="5" fill="#555" stroke="${S}" stroke-width="3"/>
      <path d="M44 90 l8 6 -8 6 8 6 -8 6 8 6" fill="none" stroke="#ffb300" stroke-width="5" stroke-linejoin="round"/>
      <path d="M144 90 l8 6 -8 6 8 6 -8 6 8 6" fill="none" stroke="#ffb300" stroke-width="5" stroke-linejoin="round"/>
      ${wheel(50, 128)}
      ${wheel(150, 128)}
      <path d="M12 78 L12 58 Q12 50 22 50 L62 48 L78 22 Q82 16 90 16 L120 16 Q127 16 127 24 L127 46 L186 46 Q193 46 193 53 L193 78 Q193 85 186 85 L19 85 Q12 85 12 78Z"
        fill="${color}" stroke="${S}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72 46 L84 27 Q86 23 91 23 L119 23 L119 46Z" fill="#bfe6ff" stroke="${S}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M26 68 L186 68" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".55"/>
      <circle cx="19" cy="59" r="5" fill="#ffe066" stroke="${S}" stroke-width="2.5"/>
      <rect x="88" y="10" width="26" height="7" rx="3" fill="#ffb300" stroke="${S}" stroke-width="2.5"/>
    </svg>`;
  }

  function starPoints(cx, cy, R, r, n = 5) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 ? r : R;
      const a = -Math.PI / 2 + (i * Math.PI) / n;
      pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  }

  const SHAPES = {
    circle: c => `<circle cx="50" cy="50" r="42" fill="${c}"/>`,
    square: c => `<rect x="10" y="10" width="80" height="80" rx="6" fill="${c}"/>`,
    triangle: c => `<polygon points="50,8 94,88 6,88" fill="${c}"/>`,
    rectangle: c => `<rect x="4" y="24" width="92" height="52" rx="6" fill="${c}"/>`,
    star: c => `<polygon points="${starPoints(50, 53, 46, 20)}" fill="${c}"/>`,
    heart: c => `<path d="M50 88 C12 62 4 34 24 20 C38 10 50 20 50 32 C50 20 62 10 76 20 C96 34 88 62 50 88Z" fill="${c}"/>`,
    oval: c => `<ellipse cx="50" cy="50" rx="45" ry="30" fill="${c}"/>`,
    diamond: c => `<polygon points="50,4 92,50 50,96 8,50" fill="${c}"/>`,
  };

  function shape(id, color) {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="${S}" stroke-width="4" stroke-linejoin="round">${SHAPES[id](color)}</g>
    </svg>`;
  }

  return { car, monster, shape };
})();
