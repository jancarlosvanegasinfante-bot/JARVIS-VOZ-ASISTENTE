// Web Audio API chimes & Web Speech API TTS wrapper

class AudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playWakeChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.frequency.setValueAtTime(659.25, now); // E5
      osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.15); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {
      // Ignore audio context errors if muted
    }
  }

  playSuccessPing() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5
      osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // Ignore
    }
  }

  speak(text: string, onEnd?: () => void) {
    if (!text) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // 1. Direct AndroidBridge native TTS support if present
      if (typeof window !== 'undefined' && (window as any).AndroidBridge && typeof (window as any).AndroidBridge.speak === 'function') {
        (window as any).AndroidBridge.speak(text);
        if (onEnd) setTimeout(onEnd, 2000);
        return;
      }

      // 2. Web Speech API with fallback
      if (!('speechSynthesis' in window)) {
        this.fallbackAudioSpeak(text, onEnd);
        return;
      }

      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CO';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      let spoke = false;

      const doSpeak = () => {
        if (spoke) return;
        spoke = true;

        const voices = window.speechSynthesis.getVoices();
        const esVoice = voices.find(
          (v) => v.lang.startsWith('es') || v.name.toLowerCase().includes('spanish') || v.name.toLowerCase().includes('monica') || v.name.toLowerCase().includes('diego') || v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('sabina') || v.name.toLowerCase().includes('jorge')
        );
        if (esVoice) {
          utterance.voice = esVoice;
        }

        utterance.onend = () => {
          if (onEnd) onEnd();
        };

        utterance.onerror = (err) => {
          console.warn("SpeechSynthesis error, falling back to Audio TTS:", err);
          this.fallbackAudioSpeak(text, onEnd);
        };

        window.speechSynthesis.speak(utterance);
      };

      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          doSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
        setTimeout(doSpeak, 150);
      } else {
        doSpeak();
      }
    } catch (e) {
      console.warn("Error initiating TTS:", e);
      this.fallbackAudioSpeak(text, onEnd);
    }
  }

  private fallbackAudioSpeak(text: string, onEnd?: () => void) {
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=es&client=tw-ob`;
      const audio = new Audio(url);
      audio.onended = () => { if (onEnd) onEnd(); };
      audio.onerror = () => { if (onEnd) onEnd(); };
      audio.play().catch((err) => {
        console.warn("Fallback audio play failed:", err);
        if (onEnd) onEnd();
      });
    } catch {
      if (onEnd) onEnd();
    }
  }

  stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const audioEngine = new AudioEngine();
