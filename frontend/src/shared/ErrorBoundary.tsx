import { Component, type ReactNode } from "react";
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <article className="panel feature-panel">
        <h2>Esta parte da página não carregou</h2>
        <p>Tente recarregar a página. Nenhum dado foi enviado.</p>
        <button className="refresh" onClick={() => location.reload()}>
          Recarregar
        </button>
      </article>
    ) : (
      this.props.children
    );
  }
}
