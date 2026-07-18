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

  if (!unlocked || !synth) {
    // No speech available: fall back to a short readable delay so flow continues.
    if (onEnd) window.setTimeout(finish, 700);
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

const PRAISE = ['Yes!', 'Well done!', 'You did it!', 'Lovely!', 'Great!', 'Brilliant!'];
const TRY_AGAIN = ['Hmm, try again!', 'Nearly!', 'Have another go!'];

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
