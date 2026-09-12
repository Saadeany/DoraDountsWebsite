// Lightweight "new order" chime built with the Web Audio API — no audio
// file to host or bundle. Browsers block audio autoplay until the user has
// interacted with the page at least once; `unlockAudioContext()` is wired
// up to the first click/keydown anywhere in the app (see NotificationContext)
// so the very first real alert isn't silently swallowed.

let audioCtx = null;

const getContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

export const unlockAudioContext = () => {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
};

// A short two-tone "ding-dong" chime, roughly 0.4s total.
export const playNewOrderChime = () => {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const playTone = (freq, startTime, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const now = ctx.currentTime;
  playTone(880, now, 0.18);          // ding
  playTone(659.25, now + 0.2, 0.22); // dong
};
