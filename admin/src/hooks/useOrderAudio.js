import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom Hook: useOrderAudio
 * Manages two-tone audio alert synthesis using the Web Audio API with zero external asset dependencies,
 * handles browser autoplay unlock, and persists mute state.
 */
export const useOrderAudio = () => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('bujang_order_sound');
    return saved !== null ? saved === 'true' : true;
  });

  // Browser Autoplay Policy: Unlock AudioContext upon initial user interaction
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
        }
      } catch (err) {
        // Suppress audio unlock errors
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Synthesize clean POS two-tone alert chime (587.33Hz D5 -> 880Hz A5)
  const playOrderChime = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2 (Upper harmonic tone)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);
    } catch (err) {
      console.warn('Order audio chime error:', err);
    }
  }, [soundEnabled]);

  const handleToggleSound = useCallback(() => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem('bujang_order_sound', String(nextState));

    if (nextState) {
      // Play sample chime to confirm audio is active
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.2);
        }
      } catch {
        // ignore
      }
      toast.success('Suara notifikasi pesanan diaktifkan', {
        toastId: 'sound-toggle-toast',
      });
    } else {
      toast.info('Suara notifikasi pesanan dinonaktifkan', {
        toastId: 'sound-toggle-toast',
      });
    }
  }, [soundEnabled]);

  return {
    soundEnabled,
    playOrderChime,
    handleToggleSound,
  };
};

export default useOrderAudio;
