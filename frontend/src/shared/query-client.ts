export type QueryState<T> = {
  status: "idle" | "loading" | "ready" | "error";
  data?: T;
  error?: string;
  checkedAt?: number;
};
type Entry = {
  state: QueryState<unknown>;
  listeners: Set<() => void>;
  controller?: AbortController;
  pending?: Promise<void>;
  lastAttempt: number;
};
export class QueryClient {
  private entries = new Map<string, Entry>();
  private entry(key: string) {
    let e = this.entries.get(key);
    if (!e) {
      if (this.entries.size >= 80) {
        const removable = [...this.entries].find(
          ([, x]) => !x.listeners.size && !x.pending,
        );
        if (removable) this.entries.delete(removable[0]);
      }
      e = { state: { status: "idle" }, listeners: new Set(), lastAttempt: 0 };
      this.entries.set(key, e);
    }
    return e;
  }
  snapshot<T>(key: string) {
    return this.entry(key).state as QueryState<T>;
  }
  subscribe(key: string, listener: () => void) {
    const e = this.entry(key);
    e.listeners.add(listener);
    return () => {
      e.listeners.delete(listener);
      if (!e.listeners.size && e.pending) {
        e.controller?.abort();
        e.pending = undefined;
        e.controller = undefined;
        e.state = { status: "idle" };
      }
    };
  }
  async fetch<T>(
    key: string,
    loader: (signal: AbortSignal) => Promise<T>,
    ttl: number,
    force = false,
  ) {
    const e = this.entry(key),
      now = Date.now();
    if (e.pending) return e.pending;
    if (
      !force &&
      ((e.state.status === "ready" && now - (e.state.checkedAt || 0) < ttl) ||
        (e.state.status === "error" && now - e.lastAttempt < 60000))
    )
      return;
    const controller = new AbortController();
    e.controller = controller;
    e.lastAttempt = now;
    e.state = { status: "loading" };
    e.listeners.forEach((f) => f());
    e.pending = (async () => {
      try {
        const data = await loader(controller.signal);
        if (controller.signal.aborted) return;
        e.state = { status: "ready", data, checkedAt: Date.now() };
      } catch {
        if (controller.signal.aborted) return;
        e.state = {
          status: "error",
          error: "Não foi possível consultar a fonte. Tente novamente.",
        };
      } finally {
        if (e.controller === controller) {
          e.pending = undefined;
          e.controller = undefined;
          e.listeners.forEach((f) => f());
        }
      }
    })();
    return e.pending;
  }
}
export const queryClient = new QueryClient();
