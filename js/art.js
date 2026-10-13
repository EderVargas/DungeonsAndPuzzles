/** Small drawings for the vowel buttons. Markup is ours, never player text. */

const ARTS = {
  spider: `
    <ellipse cx="32" cy="40" rx="14" ry="11" fill="#8a5a32"/>
    <circle cx="32" cy="24" r="9" fill="#a56b42"/>
    <circle cx="29" cy="23" r="1.6" fill="#2a2110"/>
    <circle cx="35" cy="23" r="1.6" fill="#2a2110"/>
    <path d="M20 34 Q8 28 6 18 M18 40 Q6 42 4 52 M22 46 Q12 58 16 62 M44 34 Q56 28 58 18 M46 40 Q58 42 60 52 M42 46 Q52 58 48 62 M24 30 Q14 22 12 12 M40 30 Q50 22 52 12" fill="none" stroke="#5b3a2e" stroke-width="2.4" stroke-linecap="round"/>
  `,
  star: `
    <polygon points="32,6 38,24 58,24 42,36 48,54 32,44 16,54 22,36 6,24 26,24" fill="#f0c14a" stroke="#8a6a2a" stroke-width="2"/>
  `,
  island: `
    <ellipse cx="32" cy="44" rx="24" ry="10" fill="#3b8fd4"/>
    <ellipse cx="32" cy="42" rx="16" ry="8" fill="#d8b15a"/>
    <path d="M32 40 L32 16" stroke="#6a4428" stroke-width="3" stroke-linecap="round"/>
    <path d="M32 20 Q18 18 14 28 Q24 22 32 24 Q40 18 50 26 Q42 16 32 20" fill="#3e9d62"/>
  `,
  bear: `
    <circle cx="18" cy="18" r="8" fill="#6a4428"/>
    <circle cx="46" cy="18" r="8" fill="#6a4428"/>
    <circle cx="32" cy="34" r="18" fill="#8a5a32"/>
    <ellipse cx="32" cy="40" rx="8" ry="6" fill="#e6c2a0"/>
    <circle cx="25" cy="32" r="2.2" fill="#2a2110"/>
    <circle cx="39" cy="32" r="2.2" fill="#2a2110"/>
    <ellipse cx="32" cy="40" rx="3" ry="2" fill="#2a2110"/>
  `,
  grapes: `
    <circle cx="32" cy="22" r="7" fill="#7a4bb5"/>
    <circle cx="24" cy="32" r="7" fill="#6a3aa8"/>
    <circle cx="40" cy="32" r="7" fill="#6a3aa8"/>
    <circle cx="28" cy="44" r="7" fill="#7a4bb5"/>
    <circle cx="38" cy="44" r="7" fill="#8a5cc4"/>
    <path d="M32 16 Q40 8 48 12" fill="none" stroke="#3e9d62" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="44" cy="14" rx="6" ry="3.5" fill="#3e9d62" transform="rotate(30 44 14)"/>
  `,
};

export function artSvg(name) {
  const body = ARTS[name];
  if (!body) {
    throw new Error(`Unknown art: ${name}`);
  }
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
}

export function shapeSvg(shape, fill) {
  const ink = fill || "#3b6fe2";
  const edge = `fill="${ink}" stroke="#2a2110" stroke-width="3"`;
  let body = "";
  if (shape === "circle") {
    body = `<circle cx="32" cy="32" r="22" ${edge}/>`;
  } else if (shape === "square") {
    body = `<rect x="12" y="12" width="40" height="40" rx="8" ${edge}/>`;
  } else if (shape === "triangle") {
    body = `<polygon points="32,8 56,52 8,52" ${edge}/>`;
  } else if (shape === "star") {
    body = `<polygon points="32,6 39,24 58,26 43,38 48,56 32,46 16,56 21,38 6,26 25,24" ${edge}/>`;
  } else {
    throw new Error(`Unknown shape: ${shape}`);
  }
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${body}</svg>`;
}
