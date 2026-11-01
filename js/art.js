/*
 * Art: hand-drawn SVG pictures (Road Trip theme).
 * Vehicles face LEFT to match Apple's vehicle emoji, and can be any color.
 */
window.Art = (() => {
  const S = '#1b1b1b'; // outline color
  const INK = '#1f2d33';

  // ---- detailed car (viewBox 200 x 110) -------------------------------------
  function carWheel(x) {
    return `<g transform="translate(${x} 88)">
      <circle r="19" fill="#1c1c1c"/>
      <circle r="17" fill="none" stroke="#333" stroke-width="3" stroke-dasharray="4 3"/>
      <circle r="11" fill="#cfd8dc" stroke="${S}" stroke-width="1.5"/>
      <path d="M0-9V9M-7.8-4.5L7.8 4.5M-7.8 4.5L7.8-4.5" stroke="#90a4ae" stroke-width="3" stroke-linecap="round"/>
      <circle r="3.5" fill="#eceff1" stroke="#455a64" stroke-width="1.5"/>
    </g>`;
  }

  function car(color = '#e53935') {
    return `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="100" cy="103" rx="90" ry="5" fill="#000" opacity=".2"/>
      <path d="M12 74 Q10 58 26 54 L58 48 L80 24 Q86 18 96 18 L138 18 Q149 18 155 26 L170 46 Q190 50 190 64 L190 80 Q190 88 182 88 L20 88 Q12 88 12 80 Z"
        fill="${color}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M12 76 L190 74 L190 80 Q190 88 182 88 L20 88 Q12 88 12 80Z" fill="#000" opacity=".2"/>
      <path d="M24 60 L60 54 M120 52 L182 56" stroke="#fff" stroke-width="3.5" opacity=".5" stroke-linecap="round"/>
      <path d="M66 48 L84 26 Q87 23 92 23 L112 23 L112 48Z" fill="#9fd8f5" stroke="${S}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M118 23 L138 23 Q145 23 149 29 L161 48 L118 48Z" fill="#9fd8f5" stroke="${S}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M78 44 L92 26 L98 26 L84 44Z M124 44 L132 26 L136 26 L128 44Z" fill="#fff" opacity=".6"/>
      <path d="M115 50 V84 M64 50 Q60 66 64 84" stroke="${S}" stroke-width="2" fill="none" opacity=".45"/>
      <rect x="94" y="56" width="12" height="3.5" rx="1.75" fill="${S}" opacity=".5"/>
      <rect x="140" y="56" width="12" height="3.5" rx="1.75" fill="${S}" opacity=".5"/>
      <path d="M68 46 L60 44 Q57 44 57 47 L57 50 L68 50Z" fill="${color}" stroke="${S}" stroke-width="2"/>
      <path d="M13 64 Q14 57 26 56 L30 64 Q22 68 13 64Z" fill="#fff59d" stroke="${S}" stroke-width="2"/>
      <rect x="184" y="58" width="6" height="11" rx="2" fill="#ff5252" stroke="${S}" stroke-width="1.5"/>
      <rect x="10" y="74" width="16" height="8" rx="3" fill="#cfd8dc" stroke="${S}" stroke-width="1.5"/>
      <path d="M28 88 A24 24 0 0 1 76 88Z M126 88 A24 24 0 0 1 174 88Z" fill="${S}"/>
      ${carWheel(52)}${carWheel(150)}
    </svg>`;
  }

  // ---- detailed monster truck (viewBox 240 x 200) ---------------------------
  function bigWheel(x) {
    return `<g transform="translate(${x} 146)">
      <circle r="46" fill="#1c1c1c"/>
      <circle r="42" fill="none" stroke="#3a3a3a" stroke-width="8" stroke-dasharray="8 6"/>
      <circle r="31" fill="#2a2a2a"/>
      <circle r="23" fill="#b0bec5" stroke="${S}" stroke-width="2"/>
      <circle r="19" fill="#e0e6ea"/>
      <path d="M0-18V18M-15.6-9L15.6 9M-15.6 9L15.6-9" stroke="#78909c" stroke-width="5" stroke-linecap="round"/>
      <circle r="7" fill="#eceff1" stroke="#455a64" stroke-width="2"/>
      <path d="M-10-14a17 17 0 0 1 20 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>
    </g>`;
  }

  function monster(color = '#ff7043') {
    return `<svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <ellipse cx="120" cy="193" rx="108" ry="6" fill="#000" opacity=".22"/>
      <rect x="148" y="12" width="7" height="40" rx="3" fill="#90a4ae" stroke="${S}" stroke-width="2"/>
      <rect x="158" y="18" width="7" height="34" rx="3" fill="#90a4ae" stroke="${S}" stroke-width="2"/>
      <rect x="50" y="104" width="140" height="12" rx="4" fill="#37474f" stroke="${S}" stroke-width="2"/>
      <g stroke="${S}" stroke-width="2"><rect x="74" y="96" width="9" height="40" rx="3" fill="#cfd8dc"/><rect x="157" y="96" width="9" height="40" rx="3" fill="#cfd8dc"/></g>
      <path d="M71 102h15M71 109h15M71 116h15M71 123h15M154 102h15M154 109h15M154 116h15M154 123h15" stroke="#ff9100" stroke-width="4" stroke-linecap="round"/>
      ${bigWheel(62)}${bigWheel(178)}
      <path d="M20 100 L18 78 Q18 68 30 66 L78 62 L96 34 Q100 28 108 28 L146 28 Q154 28 154 36 L154 62 L218 62 Q226 62 226 70 L226 98 Q226 106 218 106 L28 106 Q20 106 20 100 Z"
        fill="${color}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M20 90 L226 90 L226 98 Q226 106 218 106 L28 106 Q20 106 20 100Z" fill="#000" opacity=".2"/>
      <path d="M28 71 Q28 68 33 68 L80 64 M158 66 L220 66" stroke="#fff" stroke-width="4" fill="none" opacity=".55" stroke-linecap="round"/>
      <path d="M38 66 L44 56 L70 56 L72 64Z" fill="${color}" stroke="${S}" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="47" y="59" width="18" height="4" rx="2" fill="${S}"/>
      <path d="M86 62 L100 38 Q102 35 106 35 L122 35 L122 62Z" fill="#9fd8f5" stroke="${S}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M128 35 L144 35 Q147 35 147 38 L147 62 L128 62Z" fill="#9fd8f5" stroke="${S}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M96 58 L108 38 L114 38 L102 58Z M132 58 L140 38 L143 38 L135 58Z" fill="#fff" opacity=".6"/>
      <path d="M125 64 V104 M154 62 V104" stroke="${S}" stroke-width="2" opacity=".5"/>
      <rect x="131" y="70" width="13" height="4" rx="2" fill="${S}" opacity=".55"/>
      <path d="M166 64 L190 64 L183 71 L204 71 L176 87 L183 76 L162 76Z" fill="#ffd600" stroke="${S}" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="104" y="19" width="46" height="9" rx="3" fill="#263238" stroke="${S}" stroke-width="2"/>
      <g fill="#fff59d"><circle cx="111" cy="23.5" r="3"/><circle cx="122" cy="23.5" r="3"/><circle cx="133" cy="23.5" r="3"/><circle cx="144" cy="23.5" r="3"/></g>
      <path d="M18 74 L28 73 L28 84 L19 84Z" fill="#fff59d" stroke="${S}" stroke-width="2"/>
      <rect x="10" y="90" width="24" height="12" rx="4" fill="#b0bec5" stroke="${S}" stroke-width="2"/>
      <rect x="220" y="70" width="6" height="11" rx="2" fill="#ff5252" stroke="${S}" stroke-width="1.5"/>
      <path d="M8 108 Q10 78 62 76 Q114 78 116 108 L104 108 Q102 90 62 89 Q22 90 20 108Z" fill="#263238" stroke="${S}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M124 108 Q126 78 178 76 Q230 78 232 108 L220 108 Q218 90 178 89 Q138 90 136 108Z" fill="#263238" stroke="${S}" stroke-width="2" stroke-linejoin="round"/>
    </svg>`;
  }

  // ---- shapes ----------------------------------------------------------------
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
      <g stroke="${INK}" stroke-width="4" stroke-linejoin="round">${SHAPES[id](color)}</g>
    </svg>`;
  }

  // ---- road signs for the home screen (viewBox 164 x 164) --------------------
  const SIGNS = {
    garage: `
      <rect x="30" y="30" width="104" height="104" rx="12" transform="rotate(45 82 82)" fill="#ffd600" stroke="${INK}" stroke-width="6"/>
      <rect x="38" y="38" width="88" height="88" rx="8" transform="rotate(45 82 82)" fill="none" stroke="${INK}" stroke-width="3"/>
      <g transform="translate(36 52) scale(.38)">
        <circle cx="62" cy="146" r="44" fill="${INK}"/><circle cx="178" cy="146" r="44" fill="${INK}"/>
        <circle cx="62" cy="146" r="16" fill="#ffd600"/><circle cx="178" cy="146" r="16" fill="#ffd600"/>
        <path d="M20 100 L18 78 Q18 68 30 66 L78 62 L96 34 Q100 28 108 28 L146 28 Q154 28 154 36 L154 62 L218 62 Q226 62 226 70 L226 98 Q226 106 218 106 L28 106 Q20 106 20 100 Z" fill="${INK}"/>
        <path d="M92 60 L104 40 L120 40 L120 60Z" fill="#ffd600"/>
        <rect x="60" y="104" width="120" height="12" fill="${INK}"/>
      </g>`,
    numbers: `
      <circle cx="82" cy="82" r="74" fill="#1e88e5" stroke="${INK}" stroke-width="6"/>
      <circle cx="82" cy="82" r="64" fill="none" stroke="#fff" stroke-width="4"/>
      <text x="82" y="100" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="54" fill="#fff">123</text>`,
    shapes: `
      <polygon points="52,8 112,8 156,52 156,112 112,156 52,156 8,112 8,52" fill="#e53935" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <polygon points="56,18 108,18 146,56 146,108 108,146 56,146 18,108 18,56" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="56" cy="64" r="20" fill="#fff"/>
      <polygon points="110,42 132,82 88,82" fill="#fff"/>
      <rect x="62" y="94" width="40" height="40" rx="4" fill="#fff"/>`,
    colors: `
      <rect x="50" y="2" width="64" height="160" rx="18" fill="#263238" stroke="${INK}" stroke-width="5"/>
      <path d="M50 30 L32 22 L32 46 L50 50Z M50 82 L32 74 L32 98 L50 102Z M50 132 L32 124 L32 148 L50 152Z M114 30 L132 22 L132 46 L114 50Z M114 82 L132 74 L132 98 L114 102Z M114 132 L132 124 L132 148 L114 152Z" fill="#37474f"/>
      <circle cx="82" cy="34" r="20" fill="#ff1744"/><circle cx="82" cy="82" r="20" fill="#ffd600"/><circle cx="82" cy="130" r="20" fill="#00e676"/>
      <path d="M72 26 a12 12 0 0 1 12 -6 M72 74 a12 12 0 0 1 12 -6 M72 122 a12 12 0 0 1 12 -6" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`,
    abc: `
      <rect x="4" y="30" width="156" height="104" rx="16" fill="#00843d" stroke="${INK}" stroke-width="6"/>
      <rect x="13" y="39" width="138" height="86" rx="10" fill="none" stroke="#fff" stroke-width="4"/>
      <text x="82" y="100" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="52" fill="#fff">ABC</text>`,
    stickers: `
      <polygon points="8,14 156,14 82,154" fill="#fff" stroke="#e53935" stroke-width="16" stroke-linejoin="round"/>
      <polygon points="8,14 156,14 82,154" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <polygon points="${starPoints(82, 62, 33, 14)}" fill="#ffc107" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`,
  };

  function sign(id) {
    return `<svg viewBox="0 0 164 164" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${SIGNS[id]}</svg>`;
  }

  // Round blue "home" sign used as the back button.
  function homeSign() {
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#1e88e5" stroke="${INK}" stroke-width="5"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fff" stroke-width="3"/>
      <path d="M50 24 L76 48 L68 48 L68 74 L56 74 L56 58 L44 58 L44 74 L32 74 L32 48 L24 48Z" fill="#fff" stroke-linejoin="round"/>
    </svg>`;
  }

  function star(size = 40) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polygon points="${starPoints(50, 53, 46, 20)}" fill="#ffc107" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    </svg>`;
  }

  // Background: sky, sun, clouds, rolling hills and a road along the bottom.
  function scenery() {
    return `<svg class="scenery-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="1200" height="800" fill="#a8defa"/>
      <circle cx="1100" cy="90" r="50" fill="#ffd54f"/>
      <circle cx="1100" cy="90" r="72" fill="#ffd54f" opacity=".25"/>
      <g fill="#fff" class="cloud cloud-a"><ellipse cx="140" cy="110" rx="72" ry="26"/><ellipse cx="180" cy="90" rx="46" ry="30"/><ellipse cx="106" cy="96" rx="32" ry="22"/></g>
      <g fill="#fff" opacity=".9" class="cloud cloud-b"><ellipse cx="760" cy="170" rx="60" ry="20"/><ellipse cx="790" cy="154" rx="36" ry="24"/></g>
      <path d="M0 560 Q220 490 460 546 T900 536 T1200 516 V800 H0Z" fill="#9ccc65"/>
      <path d="M0 620 Q300 566 640 610 T1200 600 V800 H0Z" fill="#7cb342"/>
      <g><rect x="1040" y="530" width="10" height="40" fill="#6d4c41"/><circle cx="1045" cy="516" r="30" fill="#558b2f"/>
         <rect x="70" y="560" width="10" height="36" fill="#6d4c41"/><circle cx="75" cy="548" r="26" fill="#558b2f"/></g>
      <rect y="676" width="1200" height="124" fill="#546e7a"/>
      <rect y="670" width="1200" height="10" fill="#cfd8dc"/>
      <path d="M0 742 H1200" stroke="#ffd54f" stroke-width="8" stroke-dasharray="54 40"/>
    </svg>`;
  }

  return { car, monster, shape, sign, homeSign, star, scenery };
})();
