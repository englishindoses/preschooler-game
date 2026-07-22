import type { Progression } from '../data/types';

// Shared adaptive-difficulty engine (design/design.md §5.3). One instance per
// game. Level steps UP after a run of first-try correct answers, HOLDS on a
// miss, and steps DOWN only after repeated rounds that needed the answer shown.
// The current level is remembered between sessions via localStorage.
export class Difficulty {
  private levelIndex: number;
  private streak = 0;
  private struggles = 0;

  constructor(
    private readonly levelCount: number,
    private readonly prog: Progression,
    private readonly storageKey?: string,
  ) {
    const start = clamp(prog.startLevel - 1, 0, levelCount - 1);
    this.levelIndex = start;

    if (storageKey) {
      const saved = Number(localStorage.getItem(storageKey));
      if (Number.isInteger(saved) && saved >= 0 && saved < levelCount) {
        this.levelIndex = saved;
      }
    }
  }

  get index(): number {
    return this.levelIndex;
  }

  // Jump straight to a level, outside the normal streak rules (e.g. passing
  // Odd One Out's demo level promotes immediately). Resets the counters.
  jumpTo(index: number): void {
    this.levelIndex = clamp(index, 0, this.levelCount - 1);
    this.streak = 0;
    this.struggles = 0;
    if (this.storageKey) {
      localStorage.setItem(this.storageKey, String(this.levelIndex));
    }
  }

  // Call once when a round ends.
  recordRound(firstTryCorrect: boolean, neededHighlight: boolean): void {
    if (firstTryCorrect) {
      this.struggles = 0;
      this.streak += 1;
      if (this.streak >= this.prog.stepUpStreak && this.levelIndex < this.levelCount - 1) {
        this.levelIndex += 1;
        this.streak = 0;
      }
    } else {
      this.streak = 0;
      if (neededHighlight) {
        this.struggles += 1;
        if (this.struggles >= this.prog.stepDownStruggles && this.levelIndex > 0) {
          this.levelIndex -= 1;
          this.struggles = 0;
        }
      }
    }

    if (this.storageKey) {
      localStorage.setItem(this.storageKey, String(this.levelIndex));
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
