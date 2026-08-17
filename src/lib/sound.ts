export type Sfx = "chip" | "deal" | "win" | "lose" | "spin" | "click" | "reel";

const MUTE_KEY = "midnight-crown-sound-off";

export function loadMuted(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}

export function persistMuted(muted: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

export function unlockAudio(): void {
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
}

function tone(
  ac: AudioContext,
  freq: number,
  offset: number,
  duration: number,
  type: OscillatorType,
  gain: number,
) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + offset);
  amp.gain.setValueAtTime(Math.max(gain, 0.001), ac.currentTime + offset);
  amp.gain.linearRampToValueAtTime(0.0001, ac.currentTime + offset + duration);
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(ac.currentTime + offset);
  osc.stop(ac.currentTime + offset + duration + 0.02);
}

export function playSfx(kind: Sfx, muted: boolean): void {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  switch (kind) {
    case "chip":
      tone(ac, 520, 0, 0.09, "square", 0.12);
      break;
    case "click":
      tone(ac, 880, 0, 0.05, "square", 0.1);
      break;
    case "reel":
      tone(ac, 240, 0, 0.06, "square", 0.08);
      break;
    case "deal":
      tone(ac, 330, 0, 0.08, "triangle", 0.14);
      tone(ac, 420, 0.07, 0.1, "triangle", 0.14);
      break;
    case "spin":
      tone(ac, 180, 0, 0.12, "sawtooth", 0.1);
      tone(ac, 260, 0.1, 0.12, "sawtooth", 0.08);
      tone(ac, 140, 0.22, 0.18, "sawtooth", 0.08);
      break;
    case "win":
      tone(ac, 523.25, 0, 0.12, "triangle", 0.16);
      tone(ac, 659.25, 0.1, 0.12, "triangle", 0.16);
      tone(ac, 783.99, 0.2, 0.18, "triangle", 0.18);
      tone(ac, 1046.5, 0.32, 0.22, "triangle", 0.14);
      break;
    case "lose":
      tone(ac, 196, 0, 0.12, "sine", 0.12);
      tone(ac, 146, 0.1, 0.2, "sine", 0.1);
      break;
  }
}
