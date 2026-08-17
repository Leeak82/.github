export function formatChips(n: number): string {
  return n.toLocaleString("en-US");
}

export function signedChips(n: number): string {
  const abs = formatChips(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return "0";
}
