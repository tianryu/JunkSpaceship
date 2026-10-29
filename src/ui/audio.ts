export class AudioFeedback {
  private context: AudioContext | null = null;
  private last = 0;
  private music: HTMLAudioElement | null = null;
  private unlocked = false;
  private blocked = false;
  unlock(musicEnabled: boolean, blocked: boolean) {
    this.unlocked = true;
    this.syncMusic(musicEnabled, blocked);
  }
  syncMusic(enabled: boolean, blocked: boolean) {
    this.blocked = blocked;
    if (!enabled || blocked || !this.unlocked) {
      this.music?.pause();
      if (blocked) void this.context?.suspend().catch(() => {});
      return;
    }
    if (!this.music) {
      // Fetch only after a user gesture, keeping music out of the first screen.
      this.music = document.createElement("audio");
      this.music.id = "background-music";
      this.music.src = `${import.meta.env.BASE_URL}audio/outer-space.mp3`;
      this.music.preload = "none";
      this.music.loop = true;
      this.music.volume = 0.18;
      this.music.hidden = true;
      document.body.append(this.music);
    }
    if (this.music.paused)
      void this.music.play().catch(() => {
        // A host may still require another user gesture after returning from an ad.
      });
  }
  play(type: "buy" | "pickup" | "reward", enabled: boolean) {
    if (!enabled || !this.unlocked || this.blocked) return;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
      const ctx = this.context;
      if (type === "pickup" && ctx.currentTime - this.last < 0.12) return;
      this.last = ctx.currentTime;
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(
        type === "buy" ? 440 : type === "reward" ? 660 : 260,
        ctx.currentTime,
      );
      osc.frequency.exponentialRampToValueAtTime(
        type === "pickup" ? 500 : 880,
        ctx.currentTime + 0.08,
      );
      gain.gain.setValueAtTime(0.035, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      /* Audio is optional. */
    }
  }
  pause() {
    this.blocked = true;
    this.music?.pause();
    void this.context?.suspend().catch(() => {});
  }
}
