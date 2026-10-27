import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import data from "../data/neighborhoods.json";
import { useQuery } from "../shared/useQuery";
import { json } from "../shared/http";
import { weatherSchema, type Weather } from "../shared/schemas";
export const views = [
  "overview",
  "forecast",
  "environment",
  "compare",
  "climate",
  "sources",
] as const;
export type View = (typeof views)[number];
export type Neighborhood = (typeof data.neighborhoods)[number];
export const neighborhoods = data.neighborhoods;
const read = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const store = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Preferences are optional. */
  }
};
export function weatherURL(n: Neighborhood) {
  const u = new URL("https://api.open-meteo.com/v1/forecast");
  u.search = new URLSearchParams({
    latitude: String(n.latitude),
    longitude: String(n.longitude),
    timezone: "America/Fortaleza",
    forecast_days: "2",
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,precipitation",
    hourly:
      "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,uv_index,weather_code",
  }).toString();
  return u.toString();
}
type AppState = {
  view: View;
  navigate: (view: View) => void;
  neighborhood: Neighborhood;
  setNeighborhood: (id: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  revision: number;
  refresh: () => void;
  weather: ReturnType<typeof useQuery<Weather>>;
};
const AppContext = createContext<AppState | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>(() =>
    views.includes(location.hash.slice(1) as View)
      ? (location.hash.slice(1) as View)
      : "overview",
  );
  const [id, setId] = useState(() => read("er-place", "centro"));
  const neighborhood =
    neighborhoods.find((n) => n.id === id) ||
    neighborhoods.find((n) => n.id === "centro")!;
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    read("er-theme", "light") === "dark" ? "dark" : "light",
  );
  const [revision, setRevision] = useState(0);
  const weather = useQuery(
    "weather:" + neighborhood.id,
    (s) => json(weatherURL(neighborhood), weatherSchema, s),
    {
      enabled: ["overview", "forecast", "environment"].includes(view),
      revision,
    },
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    store("er-theme", theme);
  }, [theme]);
  useEffect(() => {
    store("er-place", neighborhood.id);
  }, [neighborhood.id]);
  useEffect(() => {
    const change = () => {
      const hash = location.hash.slice(1);
      if (views.includes(hash as View)) setView(hash as View);
      else if (!hash) setView("overview");
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const navigate = useCallback((v: View) => {
    location.hash = v;
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  return (
    <AppContext.Provider
      value={{
        view,
        navigate,
        neighborhood,
        setNeighborhood: setId,
        theme,
        toggleTheme: () => setTheme((t) => (t === "light" ? "dark" : "light")),
        revision,
        refresh: () => setRevision((n) => n + 1),
        weather,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw Error("AppProvider ausente");
  return c;
}
