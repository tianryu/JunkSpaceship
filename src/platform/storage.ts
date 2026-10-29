import { clone, newSave, normalize, type Save } from "../game/model";
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const SAVE_KEY = "scrapship-save-v1";
export class SaveStore {
  state: Save;
  warning = "";
  constructor(
    private storage: StorageLike,
    now = Date.now(),
  ) {
    this.state = newSave(now);
    try {
      const raw = storage.getItem(SAVE_KEY);
      if (raw) this.state = normalize(JSON.parse(raw), now);
    } catch {
      this.warning = "存档读取失败，已恢复新航程";
    }
  }
  save(state = this.state) {
    try {
      this.storage.setItem(SAVE_KEY, JSON.stringify(state));
      this.state = state;
      this.warning = "";
      return true;
    } catch {
      this.warning = "存档空间不足，请保留当前页面";
      return false;
    }
  }
  transaction<T>(fn: (next: Save) => T): { ok: boolean; value: T } {
    const next = clone(this.state);
    const value = fn(next);
    return { ok: this.save(next), value };
  }
  reset() {
    return this.save(newSave());
  }
}
