/**
 * Modern synthesized sound effects for SkillSync micro-interactions
 * Built with the standard Web Audio API — zero external assets, zero network latency,
 * and guaranteed to fail safely without affecting any application functionality.
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a light, crisp ascending whoosh/chime when sending a connection request.
 * Frequency sweeps up smoothly to give a positive "sent" feedback.
 */
export function playSendRequestSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Primary ascending swoosh tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(740, now + 0.16);

    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);

    // Secondary higher chime overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.07);
    osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.22);

    gain2.gain.setValueAtTime(0.001, now + 0.07);
    gain2.gain.linearRampToValueAtTime(0.12, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.07);
    osc2.stop(now + 0.35);
  } catch (err) {
    // Fail silently without disrupting user operations
  }
}

/**
 * Play a warm, celebratory success chord when accepting a connection request.
 * Plays an upbeat harmonic arpeggio (C5 -> E5 -> G5 -> C6).
 */
export function playAcceptRequestSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.35, gain: 0.15 },
      { freq: 659.25, time: 0.08, dur: 0.35, gain: 0.17 },
      { freq: 783.99, time: 0.16, dur: 0.42, gain: 0.19 },
      { freq: 1046.50, time: 0.24, dur: 0.55, gain: 0.22 },
    ];

    notes.forEach(({ freq, time, dur, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'triangle'; // warm acoustic bell/marimba tone
      osc.frequency.setValueAtTime(freq, now + time);

      gainNode.gain.setValueAtTime(0.001, now + time);
      gainNode.gain.linearRampToValueAtTime(gain, now + time + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + time);
      osc.stop(now + time + dur + 0.05);
    });
  } catch (err) {
    // Fail silently without disrupting user operations
  }
}
