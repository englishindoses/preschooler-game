import { ChoiceGameScene, RoundPlan } from './ChoiceGameScene';
import { ITEMS, ODD_LEVELS, pickOne, shuffle } from '../core/content';
import { praise, speak, speakSound } from '../core/audio';
import type { Item } from '../data/types';

// Irregular plurals for the spoken reason ("These are all sheep…").
const PLURALS: Record<string, string> = { sheep: 'sheep', bus: 'buses' };

function plural(word: string): string {
  return PLURALS[word] ?? `${word}s`;
}

// Game #2 — Odd One Out (design/design.md §8). The board is several copies of
// ONE item plus a single different one (all dogs and one elephant); tap the odd
// one. The mascot then says WHY, which is what makes it teach rather than test.
//
// Level 1 is a pre-game example: Gigi asks the question, picks the odd one
// (so the child sees what "choosing" looks like) and explains that it's
// different. Then the child tries one; right first time → straight to level 2,
// otherwise the demo plays again.
export class OddOneOutScene extends ChoiceGameScene {
  protected storageKey = 'pg.level.odd_one_out';
  protected levelCount = ODD_LEVELS.length;
  // The word appears only after the child picks the odd one (design brief).
  protected revealWordAtStart = false;

  // Spoken in the demo: names the majority and the odd one.
  private explainLine = '';

  constructor() {
    super('OddOneOut');
  }

  protected planRound(levelIndex: number): RoundPlan {
    const level = ODD_LEVELS[levelIndex];
    const majorityCount = level.total - 1;

    // One item repeated + a single odd one. 'far' takes the odd one from a
    // different category (dogs + a car — obvious); 'near' from the same
    // category (cows + a sheep — subtler).
    const majorityItem = pickOne(ITEMS);
    const oddPool =
      level.oddness === 'near'
        ? ITEMS.filter((it) => it.id !== majorityItem.id && it.category === majorityItem.category)
        : ITEMS.filter((it) => it.category !== majorityItem.category);
    const odd = pickOne(oddPool.length > 0 ? oddPool : ITEMS.filter((it) => it.id !== majorityItem.id));
    const majority: Item[] = Array.from({ length: majorityCount }, () => majorityItem);

    const isDemo = !!level.demo && this.round === 0;
    this.explainLine = `These are all ${plural(majorityItem.word)}. The ${odd.word} is different!`;

    return {
      items: shuffle([odd, ...majority]),
      target: odd,
      instruction: isDemo
        ? 'Watch me! Which one is different?'
        : level.demo
          ? 'Now you! Which one is different?'
          : 'Which one is different?',
      parentLabel: 'odd one out',
      successLine: `${praise()} ${this.explainLine}`,
      demo: isDemo,
    };
  }

  // The example round: Gigi asks, "chooses" the odd card — it lifts above the
  // rest with a burst of stars and its word appears — then explains why.
  protected runDemo(): void {
    const oddCard = this.cards.find((c) => c.item.id === this.plan.target.id);
    speak(this.plan.instruction, () => {
      if (!oddCard) {
        this.finishDemoRound();
        return;
      }
      this.showTargetWord();
      this.tweens.add({
        targets: oddCard.parts,
        scale: '*=1.3',
        duration: 320,
        ease: 'Back.easeOut',
      });
      this.starBurst(oddCard.hit.x, oddCard.hit.y);
      speakSound(this.plan.target.id, () =>
        speak(this.explainLine, () => this.finishDemoRound()),
      );
    });
  }

  // The demo level's set is just demo + one try.
  protected roundsThisSet(): number {
    return ODD_LEVELS[this.difficulty.index].demo ? 2 : super.roundsThisSet();
  }

  // On the demo level the child's try decides progress directly: right first
  // time → level 2. Otherwise stay, and the next set repeats demo + try.
  protected recordProgress(firstTry: boolean, neededHighlight: boolean): void {
    if (ODD_LEVELS[this.difficulty.index].demo) {
      if (firstTry) this.difficulty.jumpTo(1);
      return; // the demo level never feeds the normal streak counters
    }
    super.recordProgress(firstTry, neededHighlight);
  }
}
