import { useEffect, useState } from "react";
import { AppProvider, neighborhoods, useApp, type View } from "./AppProvider";
import { ErrorBoundary } from "../shared/ErrorBoundary";
import { TZ } from "../shared/format";
import {
  WeatherOverview,
  WeatherStatus,
  HourlyForecast,
} from "../features/weather/WeatherOverview";
import { CityWarnings } from "../features/weather/CityWarnings";
import { WeeklyForecast } from "../features/forecast/WeeklyForecast";
import { CityMap } from "../features/maps/CityMap";
import { OfficialMaps } from "../features/maps/OfficialMaps";
import EnvironmentalView from "../features/environment/EnvironmentalView";
import CompareView from "../features/compare/CompareView";
import ClimateView from "../features/climate/ClimateView";
import SourcesView from "../features/sources/SourcesView";
const navigation: [View, string, string][] = [
  ["overview", "◈", "Visão geral"],
  ["forecast", "☀", "Previsão do tempo"],
  ["environment", "◎", "Ambiente e rios"],
  ["compare", "⇄", "Comparar bairros"],
  ["climate", "◴", "Clima e história"],
  ["sources", "≋", "Dados e fontes"],
];
const titles: Record<View, [string, string]> = {
  overview: [
    "Como está o tempo por aí?",
    "Escolha seu bairro e confira as próximas horas.",
  ],
  forecast: [
    "Como fica a semana?",
    "Sete dias de previsão, comparação de modelos e índice UV.",
  ],
  environment: [
    "Ambiente e rios",
    "Ar, chuva medida, focos de fogo e os rios de Teresina.",
  ],
  compare: [
    "Como fica o tempo em cada bairro?",
    "Compare as previsões para o mesmo horário.",
  ],
  climate: [
    "O clima de Teresina ao longo do tempo",
    "Histórico regional, comparação mensal e fontes para conferir.",
  ],
  sources: [
    "De onde vêm os dados?",
    "Fontes, horários de consulta e limites das informações.",
  ],
};
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <time id="clock" aria-label="Horário de Teresina">
      {now.toLocaleTimeString("pt-BR", { timeZone: TZ })}
    </time>
  );
}
function Today() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="day">
      {new Intl.DateTimeFormat("pt-BR", {
        timeZone: TZ,
        day: "numeric",
        month: "long",
        weekday: "long",
      }).format(now)}
    </div>
  );
}
function Dashboard() {
  const {
    view,
    navigate,
    neighborhood,
    setNeighborhood,
    theme,
    toggleTheme,
    refresh,
  } = useApp();
  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <a className="brand" href="#overview">
          <span className="brandmark">
            <svg viewBox="0 0 40 40" aria-hidden="true">
              <path d="M6 12c8-10 18 10 28 0M6 20c8-10 18 10 28 0M6 28c8-10 18 10 28 0" />
            </svg>
          </span>
          <span>
            entre<b>rios</b>
            <small>TEMPO E AMBIENTE</small>
          </span>
        </a>
        <div className="navlabel">EXPLORE A CIDADE</div>
        <nav aria-label="Navegação principal">
          {navigation.map(([id, icon, label]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              aria-current={view === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="tiny-dot" /> Teresina, do seu jeito
          <p>Veja a previsão antes de sair.</p>
          <span className="version">TERESINA · PIAUÍ</span>
        </div>
      </aside>
      <div className="main">
        <header>
          <div className="location">
            ⌖ &nbsp; Teresina, Piauí <span>Brasil</span>
          </div>
          <div className="header-actions">
            <Clock />
            <button
              className="refresh"
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
            >
              {theme === "dark" ? "☀ Tema claro" : "☾ Tema escuro"}
            </button>
            <button className="refresh" onClick={refresh}>
              ↻ Atualizar dados
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <section className="heading">
            <div>
              <div className="eyebrow">TERESINA · PIAUÍ</div>
              <h1>{titles[view][0]}</h1>
              <p>{titles[view][1]}</p>
            </div>
            <Today />
          </section>
          {["overview", "forecast", "environment"].includes(view) && (
            <>
              <section className="location-controls">
                <label>
                  Onde você quer ver o tempo?
                  <select
                    value={neighborhood.id}
                    onChange={(e) => setNeighborhood(e.target.value)}
                  >
                    {neighborhoods.map((n) => (
                      <option value={n.id} key={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <strong>{neighborhood.name} · Teresina</strong>
                  <p>Previsão para o ponto de referência do bairro.</p>
                </div>
                <span className="auto-label">
                  Consultas automáticas com a tela aberta
                </span>
              </section>
              <WeatherStatus />
            </>
          )}
          <ErrorBoundary key={view}>
            {view === "overview" && (
              <section aria-label="Visão geral">
                <CityWarnings />
                <WeatherOverview />
                <OfficialMaps />
                <CityMap />
                <div className="section-heading">
                  <h2>Além da previsão</h2>
                  <button
                    className="refresh"
                    onClick={() => navigate("environment")}
                  >
                    Abrir monitor ambiental ↗
                  </button>
                </div>
                <div className="future-grid">
                  {[
                    [
                      "Ar e calor noturno",
                      "Poluentes previstos e comparação entre bairros.",
                    ],
                    [
                      "Focos de fogo",
                      "Detecções de satélite nas últimas 24 horas.",
                    ],
                    [
                      "Rios e inundações",
                      "Coletas de água, níveis e cenários fluviais.",
                    ],
                  ].map(([title, desc]) => (
                    <button
                      key={title}
                      className="panel feature-panel overview-link"
                      onClick={() => navigate("environment")}
                    >
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {view === "forecast" && (
              <section aria-label="Previsão do tempo">
                <WeeklyForecast />
                <HourlyForecast />
              </section>
            )}
            {view === "environment" && <EnvironmentalView />}
            {view === "compare" && <CompareView />}
            {view === "climate" && <ClimateView />}
            {view === "sources" && <SourcesView />}
          </ErrorBoundary>
          <footer>
            <div className="footer-brand">
              <span>
                entre<b>rios</b> <small>· Tempo e ambiente em Teresina.</small>
              </span>
              <small>© 2026 Antonio Marcos · Entre Rios</small>
            </div>
            <button onClick={() => navigate("sources")}>
              Fontes e limites dos dados ↗
            </button>
          </footer>
        </main>
      </div>
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Dashboard />
      </AppProvider>
    </ErrorBoundary>
  );
}
