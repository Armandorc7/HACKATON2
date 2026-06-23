import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { PageResponse, SectorSummary, Tropel } from "../api/types";
import { speciesOptions, vitalStateOptions } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { VitalBadge } from "../components/Badges";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../components/Status";
import { formatDateTime, label, percent } from "../utils/format";

const sizeOptions = [10, 20, 50] as const;
const sortOptions = ["updatedAt,desc", "name,asc", "chaosIndex,desc"] as const;

export function TropelsPage() {
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageData, setPageData] = useState<PageResponse<Tropel> | null>(null);
  const [sectors, setSectors] = useState<SectorSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const filters = useMemo(
    () => ({
      page: Number(searchParams.get("page") ?? "0"),
      size: Number(searchParams.get("size") ?? "20"),
      species: searchParams.get("species") ?? "",
      vitalState: searchParams.get("vitalState") ?? "",
      sectorId: searchParams.get("sectorId") ?? "",
      q: searchParams.get("q") ?? "",
      sort: searchParams.get("sort") ?? "updatedAt,desc",
    }),
    [searchParams],
  );

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    api
      .sectors(token, controller.signal)
      .then((response) => setSectors(response.items))
      .catch(() => undefined);
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const currentId = requestId.current + 1;
    requestId.current = currentId;
    setLoading(true);
    setError(null);
    api
      .tropels(
        token,
        {
          page: Number.isFinite(filters.page) ? filters.page : 0,
          size: sizeOptions.includes(filters.size as (typeof sizeOptions)[number]) ? filters.size : 20,
          species: filters.species,
          vitalState: filters.vitalState,
          sectorId: filters.sectorId,
          q: filters.q,
          sort: filters.sort,
        },
        controller.signal,
      )
      .then((response) => {
        if (requestId.current === currentId) setPageData(response);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        if (requestId.current === currentId) setError(caught instanceof ApiError ? caught.message : "No se pudieron cargar tropeles");
      })
      .finally(() => {
        if (requestId.current === currentId) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, token]);

  function updateFilter(key: string, value: string | number) {
    const next = new URLSearchParams(searchParams);
    if (value === "") next.delete(key);
    else next.set(key, String(value));
    if (key !== "page") next.set("page", "0");
    setSearchParams(next, { replace: false });
  }

  const totalPages = pageData?.totalPages ?? 0;
  const currentPage = pageData?.currentPage ?? filters.page;

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Atlas operativo</p>
          <h1>Tropeles</h1>
        </div>
        <span className="total-pill">{pageData?.totalElements ?? 0} resultados</span>
      </div>
      <div className="filter-panel">
        <label>
          Buscar
          <input value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Nombre del tropel" />
        </label>
        <label>
          Especie
          <select value={filters.species} onChange={(event) => updateFilter("species", event.target.value)}>
            <option value="">Todas</option>
            {speciesOptions.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado vital
          <select value={filters.vitalState} onChange={(event) => updateFilter("vitalState", event.target.value)}>
            <option value="">Todos</option>
            {vitalStateOptions.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sector
          <select value={filters.sectorId} onChange={(event) => updateFilter("sectorId", event.target.value)}>
            <option value="">Todos</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.sectorCode} - {sector.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Orden
          <select value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}>
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tamano
          <select value={filters.size} onChange={(event) => updateFilter("size", Number(event.target.value))}>
            {sizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-shell">
        {loading ? <LoadingBlock /> : null}
        {error ? <ErrorBlock message={error} /> : null}
        {!loading && !error && pageData?.content.length === 0 ? (
          <EmptyBlock title="Sin resultados" message="Ajusta la busqueda o limpia los filtros activos." />
        ) : null}
        {!error && pageData && pageData.content.length > 0 ? (
          <div className="data-table">
            <div className="table-head tropel-grid">
              <span>Nombre</span>
              <span>Sector</span>
              <span>Energia</span>
              <span>Caos</span>
              <span>Actualizado</span>
            </div>
            {pageData.content.map((tropel) => (
              <article key={tropel.id} className="table-row tropel-grid">
                <div>
                  <strong>{tropel.name}</strong>
                  <small>{label(tropel.species)} / guardian {tropel.guardianName}</small>
                  <VitalBadge value={tropel.vitalState} />
                </div>
                <span>{tropel.sector.sectorCode}</span>
                <Progress value={tropel.energyLevel} />
                <Progress value={tropel.chaosIndex} danger />
                <span>{formatDateTime(tropel.updatedAt)}</span>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      <div className="pagination">
        <button className="btn secondary" type="button" disabled={currentPage <= 0} onClick={() => updateFilter("page", currentPage - 1)}>
          Anterior
        </button>
        <span>
          Pagina {totalPages === 0 ? 0 : currentPage + 1} de {totalPages}
        </span>
        <button
          className="btn secondary"
          type="button"
          disabled={totalPages === 0 || currentPage >= totalPages - 1}
          onClick={() => updateFilter("page", currentPage + 1)}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}

function Progress({ value, danger = false }: { value: number; danger?: boolean }) {
  return (
    <div className="mini-progress" aria-label={percent(value)}>
      <span className={danger ? "danger" : ""} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      <small>{value}</small>
    </div>
  );
}
