export type Sfx = "chip" | "deal" | "win" | "lose" | "spin" | "click";

const MUTE_KEY = "midnight-crown-muted";

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
  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  return ctx;
}

export function unlockAudio(): void {
  void audio()?.resume();
}

export function playSfx(kind: Sfx, muted: boolean): void {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  void ac.resume();
  const now = ac.currentTime;

  const beep = (
    freq: number,
    offset: number,
    duration = 0.08,
    type: OscillatorType = "triangle",
    gain = 0.045,
  ) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + offset);
    g.gain.setValueAtTime(gain, now + offset);
    g.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(now + offset);
    osc.stop(now + offset + duration + 0.02);
  };

  switch (kind) {
    case "chip":
      beep(440, 0, 0.05, "square", 0.03);
      break;
    case "click":
      beep(920, 0, 0.04, "square", 0.02);
      break;
    case "deal":
      beep(310, 0, 0.06);
      beep(390, 0.05, 0.07);
      break;
    case "spin":
      beep(196, 0, 0.22, "sawtooth", 0.02);
      break;
    case "win":
      beep(523, 0, 0.09);
      beep(659, 0.09, 0.09);
      beep(784, 0.18, 0.16);
      break;
    case "lose":
      beep(140, 0, 0.2, "sine", 0.05);
      break;
  }
}
