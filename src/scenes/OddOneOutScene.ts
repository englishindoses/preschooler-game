import { ChoiceGameScene, RoundPlan } from './ChoiceGameScene';
import {
  ITEMS,
  ODD_LEVELS,
  categoriesWithAtLeast,
  distinctCategories,
  pickOne,
  pickItems,
  shuffle,
} from '../core/content';
import { praise } from '../core/audio';

// Broad grouping so "far" rounds contrast clearly different kinds of thing
// (an animal vs a vehicle), while "near" rounds stay within animals.
const BROAD_GROUP: Record<string, string> = {
  farm_animal: 'animal',
  wild_animal: 'animal',
  vehicle: 'vehicle',
  food: 'food',
};

// Friendly noun for the spoken reason ("The car isn't a farm animal").
const CATEGORY_NOUN: Record<string, string> = {
  farm_animal: 'farm animal',
  wild_animal: 'wild animal',
  vehicle: 'vehicle',
  food: 'food',
};

// Game #2 — Odd One Out (design/design.md §8). Show N items where one doesn't
// belong; tap the odd one. The mascot then says WHY, which is what makes it
// teach rather than just test.
export class OddOneOutScene extends ChoiceGameScene {
  protected storageKey = 'pg.level.odd_one_out';
  protected levelCount = ODD_LEVELS.length;

  constructor() {
    super('OddOneOut');
  }

  protected planRound(levelIndex: number): RoundPlan {
    const level = ODD_LEVELS[levelIndex];
    const majorityCount = level.total - 1;

    let majorityCat: string;
    let oddCat: string;
    if (level.oddness === 'near') {
      // Subtle: a wild animal hiding among farm animals.
      majorityCat = 'farm_animal';
      oddCat = 'wild_animal';
    } else {
      // Obvious: the odd one is a completely different kind of thing.
      majorityCat = pickOne(categoriesWithAtLeast(majorityCount));
      const others = distinctCategories().filter(
        (c) => BROAD_GROUP[c] !== BROAD_GROUP[majorityCat],
      );
      oddCat = pickOne(others);
    }

    const majority = pickItems(majorityCount, { category: majorityCat });
    const odd = pickOne(ITEMS.filter((it) => it.category === oddCat));

    return {
      items: shuffle([odd, ...majority]),
      target: odd,
      instruction: 'Which one is different?',
      parentLabel: 'odd one out',
      successLine: `${praise()} The ${odd.word} isn't ${withArticle(CATEGORY_NOUN[majorityCat])}.`,
    };
  }
}

function withArticle(noun: string): string {
  return /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`;
}
