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
}

export interface MemoryLevel {
  level: number;
  pairs: number;
  matchType: 'identical';
}
