export interface Rng {
  next(): number;
  int(max: number): number;
}

export function createRng(seed = 1): Rng {
  let state = seed >>> 0 || 1;
  return {
    next() {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    int(max: number) {
      if (max <= 0) throw new Error("max must be positive");
      return Math.floor(this.next() * max);
    },
  };
}

export function cryptoRng(): Rng {
  return {
    next() {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] / 0x100000000;
    },
    int(max: number) {
      if (max <= 0) throw new Error("max must be positive");
      const limit = Math.floor(0x100000000 / max) * max;
      const buf = new Uint32Array(1);
      let value = 0;
      do {
        crypto.getRandomValues(buf);
        value = buf[0];
      } while (value >= limit);
      return value % max;
    },
  };
}
