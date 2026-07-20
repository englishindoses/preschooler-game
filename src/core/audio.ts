// TEMPORARY placeholder audio using the browser's built-in speech synthesis.
// This lets us test the audio-first flow before any voice is recorded. It will
// be replaced by recorded British-English clips (Item.wordAudio + mascot VO).
//
// Browsers only allow audio after a user gesture, so call unlockAudio() from the
// first tap (the "tap to play" screen) before speaking anything.

let unlocked = false;

export function unlockAudio(): void {
  unlocked = true;
}

// Global mute, toggled by the volume button and remembered between sessions.
// When muted, speak()/speakSound() play nothing but still call onEnd (after a
// short delay that mimics the spoken length) so game pacing is unchanged.
let muted = localStorage.getItem('pg.muted') === '1';

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  localStorage.setItem('pg.muted', value ? '1' : '0');
  if (value) window.speechSynthesis?.cancel(); // stop anything mid-sentence
}

// Speaks the text. If onEnd is given, it fires once when the line finishes (so
// callers can wait for the audio before moving on). onEnd is always eventually
// called — even if speech is unavailable or errors — so game flow never stalls.
export function speak(text: string, onEnd?: () => void): void {
  const synth = window.speechSynthesis;

  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    onEnd?.();
  };

  if (muted || !unlocked || !synth) {
    // No speech (muted / locked / unsupported): fall back to a readable delay so
    // flow continues at roughly the pace the line would have taken.
    if (onEnd) window.setTimeout(finish, muted ? Math.min(3000, 400 + text.length * 55) : 700);
    return;
  }

  synth.cancel(); // stop any previous line so instructions don't overlap
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.9;
  u.pitch = 1.15;
  u.onend = finish;
  u.onerror = finish;
  synth.speak(u);

  // Safety net: some browsers don't reliably fire onend. Estimate a max length.
  if (onEnd) window.setTimeout(finish, Math.min(6000, 900 + text.length * 75));
}

// Placeholder animal / vehicle sounds SPOKEN by the browser voice — the same
// stand-in approach as the rest of the audio. The voice says the noise (e.g.
// "Moo!"), which will be swapped for a real recorded clip later. Items not
// listed here (quiet animals, food) make no sound.
const SOUND_WORDS: Record<string, string> = {
  cow: 'Moo!',
  horse: 'Neigh!',
  sheep: 'Baa!',
  pig: 'Oink oink!',
  chicken: 'Cluck cluck!',
  duck: 'Quack quack!',
  goat: 'Maa!',
  dog: 'Woof woof!',
  cat: 'Meow!',
  lion: 'Roar!',
  elephant: 'Pawoo!',
  monkey: 'Ooh ooh, ah ah!',
  tractor: 'Brrm brrm!',
  car: 'Vroom!',
  bus: 'Beep beep!',
};

// Speaks an item's placeholder sound if it has one, then fires onEnd. onEnd is
// always eventually called (even when the item has no sound) so flow continues.
export function speakSound(id: string, onEnd?: () => void): void {
  const word = SOUND_WORDS[id];
  if (!word) {
    onEnd?.();
    return;
  }
  speak(word, onEnd);
}

const PRAISE = ['Yes!', 'Well done!', 'You did it!', 'Lovely!', 'Great!', 'Brilliant!'];
const TRY_AGAIN = ['Oops!', 'Not quite!', 'Try again!'];

// Varied ways to ask the child to find an item (Listen & Tap), so it doesn't
// always say the same thing. British English.
const FIND_PROMPTS: Array<(word: string) => string> = [
  (w) => `Find the ${w}!`,
  (w) => `Where is the ${w}?`,
  (w) => `Can you see the ${w}?`,
  (w) => `Can you find the ${w}?`,
  (w) => `Where's the ${w}?`,
  (w) => `Show me the ${w}!`,
];

export function praise(): string {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function tryAgain(): string {
  return TRY_AGAIN[Math.floor(Math.random() * TRY_AGAIN.length)];
}

export function findPrompt(word: string): string {
  return FIND_PROMPTS[Math.floor(Math.random() * FIND_PROMPTS.length)](word);
}
