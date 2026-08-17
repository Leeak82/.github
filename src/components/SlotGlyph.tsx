import type { SlotSymbol } from "../lib/slots";

export function SlotGlyph({ symbol }: { symbol: SlotSymbol }) {
  return (
    <div className={`slot-glyph sym-${symbol}`}>
      <svg viewBox="0 0 64 64" aria-hidden="true">
        {icon(symbol)}
      </svg>
      <small>{label(symbol)}</small>
    </div>
  );
}

function label(symbol: SlotSymbol): string {
  switch (symbol) {
    case "cherry":
      return "CHERRY";
    case "lemon":
      return "LEMON";
    case "plum":
      return "PLUM";
    case "grape":
      return "GRAPE";
    case "bell":
      return "BELL";
    case "bar":
      return "BAR";
    case "seven":
      return "SEVEN";
    case "wild":
      return "WILD";
    case "scatter":
      return "STAR";
  }
}

function icon(symbol: SlotSymbol) {
  switch (symbol) {
    case "cherry":
      return (
        <>
          <path d="M32 14c0 0-2-8-12-8" stroke="#1f7a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M32 14c0 0 4-8 12-6" stroke="#1f7a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="22" cy="40" r="14" fill="#e11d2e" />
          <circle cx="42" cy="44" r="13" fill="#c40f22" />
          <circle cx="18" cy="34" r="4" fill="#ff7a86" />
        </>
      );
    case "lemon":
      return (
        <>
          <ellipse cx="32" cy="34" rx="22" ry="16" fill="#f5d000" transform="rotate(-18 32 34)" />
          <ellipse cx="24" cy="28" rx="6" ry="3" fill="#fff4a3" transform="rotate(-18 24 28)" />
        </>
      );
    case "plum":
      return (
        <>
          <circle cx="32" cy="36" r="18" fill="#9b2d8a" />
          <path d="M32 18c6 4 8 10 6 16" stroke="#6a1860" strokeWidth="3" fill="none" />
          <ellipse cx="24" cy="28" rx="5" ry="3" fill="#d56bc4" />
        </>
      );
    case "grape":
      return (
        <>
          <circle cx="32" cy="22" r="8" fill="#7b2cff" />
          <circle cx="22" cy="32" r="8" fill="#6a1fe0" />
          <circle cx="42" cy="32" r="8" fill="#6a1fe0" />
          <circle cx="26" cy="44" r="8" fill="#5818c4" />
          <circle cx="38" cy="44" r="8" fill="#5818c4" />
          <path d="M32 12v8" stroke="#1f7a3a" strokeWidth="3" />
        </>
      );
    case "bell":
      return (
        <>
          <path d="M16 30c0-10 7-18 16-18s16 8 16 18v10H16z" fill="#ffd24a" />
          <rect x="14" y="40" width="36" height="8" rx="4" fill="#e6b800" />
          <circle cx="32" cy="52" r="4" fill="#c48a12" />
        </>
      );
    case "bar":
      return (
        <>
          <rect x="8" y="22" width="48" height="20" rx="4" fill="#1a1a1a" stroke="#ffd24a" strokeWidth="3" />
          <text
            x="32"
            y="37"
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="#ffd24a"
            style={{ fontFamily: "Outfit, Arial, sans-serif" }}
          >
            BAR
          </text>
        </>
      );
    case "seven":
      return (
        <text
          x="32"
          y="46"
          textAnchor="middle"
          fontSize="42"
          fontWeight="800"
          fill="#fff"
          style={{ fontFamily: "Outfit, Arial, sans-serif" }}
        >
          7
        </text>
      );
    case "wild":
      return (
        <>
          <polygon points="32,8 38,24 56,24 42,36 48,54 32,42 16,54 22,36 8,24 26,24" fill="#fff4c2" />
          <text
            x="32"
            y="40"
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fill="#7a4a00"
            style={{ fontFamily: "Outfit, Arial, sans-serif" }}
          >
            WILD
          </text>
        </>
      );
    case "scatter":
      return (
        <polygon points="32,8 38,24 56,24 42,36 48,54 32,42 16,54 22,36 8,24 26,24" fill="#ffe566" />
      );
  }
}
