import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { SectorSummary } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../components/Status";

export function SectorsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [sectors, setSectors] = useState<SectorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .sectors(token, controller.signal)
      .then((response) => setSectors(response.items))
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof ApiError ? caught.message : "No se pudieron cargar sectores");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [reloadKey, token]);

  function openStory(id: string) {
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate(`/sectors/${id}/story`));
      return;
    }
    navigate(`/sectors/${id}/story`);
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Story Engine</p>
          <h1>Sectores</h1>
        </div>
        <button className="btn secondary" type="button" onClick={() => setReloadKey((value) => value + 1)}>
          Actualizar
        </button>
      </div>
      {loading ? <LoadingBlock /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
      {!loading && !error && sectors.length === 0 ? <EmptyBlock title="Sin sectores" message="El workspace no devolvio sectores." /> : null}
      <div className="sector-grid">
        {sectors.map((sector) => (
          <button key={sector.id} className="sector-card" type="button" onClick={() => openStory(sector.id)}>
            <span>{sector.sectorCode}</span>
            <strong>{sector.name}</strong>
            <small>{sector.climate}</small>
            <div className="sector-load">
              <span style={{ width: `${Math.min(100, (sector.currentLoad / sector.capacity) * 100)}%` }} />
            </div>
            <dl>
              <div>
                <dt>Carga</dt>
                <dd>{sector.currentLoad}/{sector.capacity}</dd>
              </div>
              <div>
                <dt>Estabilidad</dt>
                <dd>{sector.stabilityLevel}</dd>
              </div>
            </dl>
          </button>
        ))}
      </div>
    </section>
  );
}
