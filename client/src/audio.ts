/**
 * Singleton audio engine. Owns one AudioContext (created on the first user
 * gesture so the TV browser allows playback), plays MP3s returned by the
 * /api/tts proxy, and exposes a live amplitude reading used for lip-sync.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;
  private source: AudioBufferSourceNode | null = null;
  private smoothed = 0;

  /** Must be called from within a user gesture (e.g. the Start click). */
  ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.6;
      this.analyser.connect(this.ctx.destination);
      this.timeData = new Uint8Array(new ArrayBuffer(this.analyser.fftSize));
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Fetch speech for `text` and play it. Resolves when playback ends. */
  async speak(text: string, signal?: AbortSignal): Promise<void> {
    const ctx = this.ensureContext();
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`TTS request failed (${res.status}): ${detail}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    this.stop();

    return new Promise<void>((resolve) => {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser!);
      source.onended = () => {
        if (this.source === source) this.source = null;
        this.smoothed = 0;
        resolve();
      };
      this.source = source;
      source.start();

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            try {
              source.stop();
            } catch {
              /* already stopped */
            }
            resolve();
          },
          { once: true }
        );
      }
    });
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.onended = null;
        this.source.stop();
      } catch {
        /* already stopped */
      }
      this.source = null;
    }
    this.smoothed = 0;
  }

  /** Current smoothed mouth-open amount, 0..1. Safe to call every frame. */
  getAmplitude(): number {
    if (!this.analyser || !this.timeData || !this.source) {
      this.smoothed *= 0.8;
      return this.smoothed;
    }
    this.analyser.getByteTimeDomainData(this.timeData);
    let sumSquares = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const v = (this.timeData[i] - 128) / 128;
      sumSquares += v * v;
    }
    const rms = Math.sqrt(sumSquares / this.timeData.length);
    // Map RMS into a lively 0..1 range and smooth it for natural motion.
    const target = Math.min(1, rms * 3.2);
    this.smoothed += (target - this.smoothed) * 0.35;
    return this.smoothed;
  }
}

export const audioEngine = new AudioEngine();
