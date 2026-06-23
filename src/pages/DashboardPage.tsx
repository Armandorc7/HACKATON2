import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { DashboardSummary, SectorSummary } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../components/Status";
import { formatDateTime } from "../utils/format";

export function DashboardPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sectors, setSectors] = useState<SectorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const isEmpty = summary ? summary.totalTropels === 0 && summary.openSignals === 0 && sectors.length === 0 : false;

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    Promise.all([api.dashboard(token, controller.signal), api.sectors(token, controller.signal)])
      .then(([summaryResponse, sectorsResponse]) => {
        setSummary(summaryResponse);
        setSectors(sectorsResponse.items);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof ApiError ? caught.message : "No se pudo cargar el dashboard");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [reloadKey, token]);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Operacion en vivo</p>
          <h1>Dashboard</h1>
        </div>
        <button className="btn secondary" type="button" onClick={() => setReloadKey((value) => value + 1)}>
          Actualizar
        </button>
      </div>

      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
      {!loading && !error && isEmpty ? (
        <EmptyBlock title="Workspace sin actividad" message="No hay tropeles, senales abiertas ni sectores para mostrar." />
      ) : null}
      {!loading && !error && summary && !isEmpty ? (
        <>
          <div className="metric-grid">
            <Metric label="Tropeles" value={summary.totalTropels} />
            <Metric label="Criticos" value={summary.criticalTropels} tone="danger" />
            <Metric label="Senales abiertas" value={summary.openSignals} tone="warning" />
            <Metric label="Estabilidad promedio" value={summary.sectorStabilityAvg.toFixed(1)} />
          </div>
          <div className="content-grid">
            <section className="panel">
              <div className="panel-title">
                <h2>Senales por severidad</h2>
                <small>Generado {formatDateTime(summary.generatedAt)}</small>
              </div>
              <div className="severity-bars">
                {Object.entries(summary.signalsBySeverity).map(([severity, count]) => (
                  <div key={severity} className="bar-row">
                    <span>{severity}</span>
                    <div className="bar-track">
                      <span style={{ width: `${Math.min(100, Number(count) * 8)}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="panel-title">
                <h2>Sectores</h2>
                <Link to="/sectors">Ver todos</Link>
              </div>
              <div className="sector-list compact">
                {sectors.slice(0, 4).map((sector) => (
                  <Link key={sector.id} to={`/sectors/${sector.id}/story`} className="sector-row">
                    <span>{sector.sectorCode}</span>
                    <strong>{sector.name}</strong>
                    <small>{sector.currentLoad}/{sector.capacity}</small>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}

function Metric({ label, value, tone = "default" }: { label: string; value: number | string; tone?: "default" | "danger" | "warning" }) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
