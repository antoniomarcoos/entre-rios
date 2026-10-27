import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { queryClient, type QueryState } from "./query-client";
const idle: QueryState<never> = { status: "idle" };
export function useQuery<T>(
  key: string,
  loader: (signal: AbortSignal) => Promise<T>,
  {
    enabled = true,
    ttl = 300000,
    revision = 0,
  }: { enabled?: boolean; ttl?: number; revision?: number } = {},
) {
  const load = useRef(loader);
  useEffect(() => {
    load.current = loader;
  });
  const previous = useRef(revision);
  const subscribe = useCallback(
    (listener: () => void) =>
      enabled ? queryClient.subscribe(key, listener) : () => {},
    [key, enabled],
  );
  const snapshot = useCallback(() => queryClient.snapshot<T>(key), [key]);
  const state = useSyncExternalStore(subscribe, snapshot, () => idle);
  const refresh = useCallback(
    () => queryClient.fetch(key, (s) => load.current(s), ttl, true),
    [key, ttl],
  );
  useEffect(() => {
    if (!enabled) return;
    const force = previous.current !== revision;
    previous.current = revision;
    void queryClient.fetch(key, (s) => load.current(s), ttl, force);
    const check = () => {
      if (!document.hidden)
        void queryClient.fetch(key, (s) => load.current(s), ttl);
    };
    const id = setInterval(check, 60000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, [key, enabled, ttl, revision]);
  return { ...state, refresh };
}
