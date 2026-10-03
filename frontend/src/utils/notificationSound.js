// Web Audio API synthesized notification sound
// Reliable, zero network latency, no external file dependencies

let audioCtx = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

// Auto-unlock AudioContext on first user interaction
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    window.removeEventListener("click", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("touchstart", unlockAudio);
  };
  window.addEventListener("click", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });
  window.addEventListener("touchstart", unlockAudio, { passive: true });
}

/**
 * Plays a pleasant, WhatsApp-style incoming message chime.
 * Two smooth harmonic marimba/bell notes (784Hz [G5] then 1046.5Hz [C6]).
 */
export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const playHarmonicTone = (freq, startTime, duration, peakGain) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Soft sine tone
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack and natural exponential decay
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Note 1: G5 (784 Hz)
    playHarmonicTone(784, now, 0.18, 0.22);
    // Note 2: C6 (1046.5 Hz) - slightly higher and lingering
    playHarmonicTone(1046.5, now + 0.11, 0.32, 0.28);
  } catch (error) {
    console.log("Could not play notification sound:", error);
  }
};
