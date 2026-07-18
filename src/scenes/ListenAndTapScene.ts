import { ChoiceGameScene, RoundPlan } from './ChoiceGameScene';
import {
  ITEMS,
  LISTEN_LEVELS,
  categoriesWithAtLeast,
  pickOne,
  pickItems,
  shuffle,
} from '../core/content';
import { praise, findPrompt } from '../core/audio';
import type { Item } from '../data/types';

// Game #1 — Listen & Tap (design/design.md §7). Hear a word, tap the matching
// picture. Distractors get more similar as the level rises.
export class ListenAndTapScene extends ChoiceGameScene {
  protected storageKey = 'pg.level.listen_and_tap';
  protected levelCount = LISTEN_LEVELS.length;

  constructor() {
    super('ListenAndTap');
  }

  protected planRound(levelIndex: number): RoundPlan {
    const level = LISTEN_LEVELS[levelIndex];

    // For a "same category" round the target must come from a category big
    // enough to supply all the distractors too.
    let target: Item;
    if (level.distractorCategory === 'same') {
      const category = pickOne(categoriesWithAtLeast(level.choices));
      target = pickOne(ITEMS.filter((it) => it.category === category));
    } else {
      target = pickOne(ITEMS);
    }

    const distractors = pickItems(level.choices - 1, {
      exclude: [target.id],
      category: level.distractorCategory === 'same' ? target.category : undefined,
    });

    return {
      items: shuffle([target, ...distractors]),
      target,
      instruction: findPrompt(target.word),
      parentLabel: target.word,
      successLine: `${praise()} The ${target.word}!`,
    };
  }
}
