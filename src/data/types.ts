// Shapes of the data in items.json and levels.json. See design/design.md §6.

export interface Item {
  id: string;
  word: string;
  image: string;
  wordAudio: string;
  sound: string | null;
  category: string;
}

export interface Progression {
  roundsPerSet: number;
  stepUpStreak: number;
  stepDownStruggles: number;
  startLevel: number;
}

export interface ListenLevel {
  level: number;
  choices: number;
  distractorCategory: 'any' | 'same';
}

export interface OddLevel {
  level: number;
  total: number;
  oddness: 'far' | 'near';
  demo?: boolean; // level 1: the mascot demonstrates, then the child tries once
}

// Patterns: `unit` is the repeating block written as letters (AB =
// cow, pig, cow, pig…; AABB = cow, cow, pig, pig…). `shown` is how many items
// are visible before the empty "?" slot; the answer is whatever comes next.
export interface PatternLevel {
  level: number;
  unit: string;
  shown: number;
  choices: number;
  demo?: boolean; // level 1: the mascot demonstrates, then the child tries once
}

export interface MemoryLevel {
  level: number;
  pairs: number;
  matchType: 'identical';
}
