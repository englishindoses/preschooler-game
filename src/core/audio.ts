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

export function speak(text: string): void {
  if (!unlocked) return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  synth.cancel(); // stop any previous line so instructions don't overlap
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 0.9;
  u.pitch = 1.15;
  synth.speak(u);
}

const PRAISE = ['Yes!', 'Well done!', 'You did it!', 'Lovely!', 'Great!', 'Brilliant!'];
const TRY_AGAIN = ['Hmm, try again!', 'Nearly!', 'Have another go!'];

export function praise(): string {
  return PRAISE[Math.floor(Math.random() * PRAISE.length)];
}

export function tryAgain(): string {
  return TRY_AGAIN[Math.floor(Math.random() * TRY_AGAIN.length)];
}
