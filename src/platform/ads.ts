export type AdResult = "completed" | "cancelled" | "unavailable" | "error";
export interface AdProvider {
  available(): boolean;
  show(): Promise<AdResult>;
}
export class UnavailableAds implements AdProvider {
  available() {
    return false;
  }
  async show(): Promise<AdResult> {
    return "unavailable";
  }
}
// Generic event boundary. The host factory is supplied only after the selected
// application's current MCP monetization status and configuration are verified.
export interface RewardedHost {
  onClose(fn: (event?: { isEnded?: boolean }) => void): void;
  onError(fn: (error: unknown) => void): void;
  show(): Promise<void>;
  load(): Promise<void>;
}
export class RewardedAds implements AdProvider {
  private finish: ((r: AdResult) => void) | null = null;
  private backoffUntil = 0;
  constructor(private ad: RewardedHost) {
    ad.onClose((e) =>
      this.close(e?.isEnded === true ? "completed" : "cancelled"),
    );
    ad.onError(() => {
      this.backoffUntil = Date.now() + 15000;
      this.close("error");
    });
  }
  available() {
    return !this.finish && Date.now() >= this.backoffUntil;
  }
  private close(r: AdResult) {
    const fn = this.finish;
    this.finish = null;
    fn?.(r);
  }
  async show(): Promise<AdResult> {
    if (!this.available()) return "unavailable";
    return new Promise((resolve) => {
      this.finish = resolve;
      // Resolving show is never interpreted as a completed view. One documented
      // load/show retry is allowed, and only while this request is still active.
      this.ad.show().catch(() => {
        if (!this.finish) return;
        this.ad
          .load()
          .then(() => {
            if (this.finish) return this.ad.show();
          })
          .catch(() => {
            this.backoffUntil = Date.now() + 15000;
            this.close("error");
          });
      });
    });
  }
}
