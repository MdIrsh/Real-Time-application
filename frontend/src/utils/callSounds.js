// Web Audio API Ringtone & Call Audio Synthesizer
let audioContext = null;
let outgoingInterval = null;
let incomingInterval = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContext = new AudioCtx();
    }
  }
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
};

export const stopCallSounds = () => {
  if (outgoingInterval) {
    clearInterval(outgoingInterval);
    outgoingInterval = null;
  }
  if (incomingInterval) {
    clearInterval(incomingInterval);
    incomingInterval = null;
  }
};

/**
 * Standard Phone Outgoing Ringing (dual-tone 440Hz + 480Hz in pulses)
 */
export const startOutgoingRingtone = () => {
  stopCallSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const playRingPulse = () => {
    try {
      const now = ctx.currentTime;
      [440, 480].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.6);
        gain.gain.linearRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.8);
      });
    } catch (e) {
      console.log("Ringtone error:", e);
    }
  };

  playRingPulse();
  outgoingInterval = setInterval(playRingPulse, 3800);
};

/**
 * WhatsApp-style Melodic Incoming Ringtone
 */
export const startIncomingRingtone = () => {
  stopCallSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const playMelodicChime = () => {
    try {
      const now = ctx.currentTime;
      // Friendly marimba melody notes (E5, G#5, B5, E6)
      const notes = [
        { f: 659.25, time: 0, dur: 0.15 },
        { f: 830.61, time: 0.16, dur: 0.15 },
        { f: 987.77, time: 0.32, dur: 0.15 },
        { f: 1318.51, time: 0.48, dur: 0.35 },
        { f: 987.77, time: 0.9, dur: 0.15 },
        { f: 1318.51, time: 1.06, dur: 0.4 },
      ];

      notes.forEach(({ f, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + time);

        gain.gain.setValueAtTime(0, now + time);
        gain.gain.linearRampToValueAtTime(0.12, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (e) {
      console.log("Incoming ringtone error:", e);
    }
  };

  playMelodicChime();
  incomingInterval = setInterval(playMelodicChime, 2400);
};

/**
 * Positive chime when call connects successfully
 */
export const playCallConnectedTone = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.1 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.25);
    });
  } catch (e) {
    console.log("Connect tone error:", e);
  }
};
