import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { FeedResponse, Signal } from "../api/types";
import { severityOptions, signalStatusOptions, signalTypeOptions } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { SeverityBadge, StatusBadge } from "../components/Badges";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../components/Status";
import { formatDateTime, label } from "../utils/format";

interface FeedCache {
  key: string;
  response: FeedResponse;
  scrollY: number;
}

const feedCacheKey = "tropelcare.feed.cache";
const signalUpdatesKey = "tropelcare.signal.updates";

export function SignalsFeedPage() {
  const { token } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<Signal[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalEstimate, setTotalEstimate] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestKeyRef = useRef("");
  const inFlightRef = useRef(false);

  const filters = useMemo(
    () => ({
      signalType: searchParams.get("signalType") ?? "",
      severity: searchParams.get("severity") ?? "",
      status: searchParams.get("status") ?? "",
      q: searchParams.get("q") ?? "",
    }),
    [searchParams],
  );
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const persistCache = useCallback(
    (scrollY: number) => {
      const cache: FeedCache = {
        key: filtersKey,
        response: { items, nextCursor, hasMore, totalEstimate },
        scrollY,
      };
      sessionStorage.setItem(feedCacheKey, JSON.stringify(cache));
    },
    [filtersKey, hasMore, items, nextCursor, totalEstimate],
  );

  const mergeItems = useCallback((current: Signal[], incoming: Signal[]) => {
    const map = new Map<string, Signal>();
    for (const item of current) map.set(item.id, item);
    for (const item of incoming) map.set(item.id, item);
    return Array.from(map.values());
  }, []);

  const applyStoredUpdates = useCallback((current: Signal[]) => {
    const raw = sessionStorage.getItem(signalUpdatesKey);
    if (!raw) return current;
    try {
      const updates = JSON.parse(raw) as Record<string, Signal>;
      return current.map((item) => updates[item.id] ?? item);
    } catch {
      sessionStorage.removeItem(signalUpdatesKey);
      return current;
    }
  }, []);

  const loadPage = useCallback(
    async (cursor: string | null, mode: "replace" | "append") => {
      if (!token) return;
      if (mode === "append" && inFlightRef.current) return;
      if (mode === "replace") {
        controllerRef.current?.abort();
        inFlightRef.current = false;
      }
      controllerRef.current?.abort();
      inFlightRef.current = true;
      const controller = new AbortController();
      controllerRef.current = controller;
      const requestKey = `${filtersKey}:${cursor ?? "first"}`;
      requestKeyRef.current = requestKey;
      if (mode === "replace") {
        setInitialLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
        setPageError(null);
      }
      try {
        const response = await api.signalFeed(
          token,
          {
            limit: 15,
            cursor: cursor ?? undefined,
            signalType: filters.signalType,
            severity: filters.severity,
            status: filters.status,
            q: filters.q,
          },
          controller.signal,
        );
        if (requestKeyRef.current !== requestKey) return;
        setItems((current) => applyStoredUpdates(mode === "replace" ? response.items : mergeItems(current, response.items)));
        setNextCursor(response.nextCursor);
        setHasMore(response.hasMore);
        setTotalEstimate(response.totalEstimate);
      } catch (caught: unknown) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        const message = caught instanceof ApiError ? caught.message : "No se pudo cargar el feed";
        if (mode === "replace") setError(message);
        else setPageError(message);
      } finally {
        if (requestKeyRef.current === requestKey) {
          setInitialLoading(false);
          setLoadingMore(false);
          inFlightRef.current = false;
        }
      }
    },
    [applyStoredUpdates, filters, filtersKey, mergeItems, token],
  );

  useEffect(() => {
    const raw = sessionStorage.getItem(feedCacheKey);
    if (raw) {
      try {
        const cache = JSON.parse(raw) as FeedCache;
        if (cache.key === filtersKey) {
          setItems(applyStoredUpdates(cache.response.items));
          setNextCursor(cache.response.nextCursor);
          setHasMore(cache.response.hasMore);
          setTotalEstimate(cache.response.totalEstimate);
          setInitialLoading(false);
          window.requestAnimationFrame(() => window.scrollTo({ top: cache.scrollY, behavior: "instant" }));
          return;
        }
      } catch {
        sessionStorage.removeItem(feedCacheKey);
      }
    }
    setItems([]);
    setNextCursor(null);
    setHasMore(true);
    setTotalEstimate(0);
    void loadPage(null, "replace");
    return () => controllerRef.current?.abort();
  }, [applyStoredUpdates, filtersKey, loadPage]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && hasMore && !initialLoading && !loadingMore && !pageError) {
          void loadPage(nextCursor, "append");
        }
      },
      { rootMargin: "320px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, initialLoading, loadPage, loadingMore, nextCursor, pageError]);

  useEffect(() => {
    return () => persistCache(window.scrollY);
  }, [persistCache]);

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
    sessionStorage.removeItem(feedCacheKey);
  }

  function rememberScroll() {
    persistCache(window.scrollY);
  }

  return (
    <section className="page-section feed-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Monitor cursor-based</p>
          <h1>Feed de Senales</h1>
        </div>
        <span className="total-pill">{totalEstimate} estimadas</span>
      </div>
      <div className="filter-panel">
        <label>
          Buscar
          <input value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Contenido o tropel" />
        </label>
        <label>
          Tipo
          <select value={filters.signalType} onChange={(event) => updateFilter("signalType", event.target.value)}>
            <option value="">Todos</option>
            {signalTypeOptions.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Severidad
          <select value={filters.severity} onChange={(event) => updateFilter("severity", event.target.value)}>
            <option value="">Todas</option>
            {severityOptions.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}>
            <option value="">Todos</option>
            {signalStatusOptions.map((option) => (
              <option key={option} value={option}>
                {label(option)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {initialLoading ? <LoadingBlock label="Cargando senales" /> : null}
      {error ? <ErrorBlock message={error} onRetry={() => loadPage(null, "replace")} /> : null}
      {!initialLoading && !error && items.length === 0 ? (
        <EmptyBlock title="Sin senales" message="No hay elementos para los filtros actuales." />
      ) : null}

      <div className="feed-list">
        {items.map((signal) => (
          <Link
            key={signal.id}
            className="signal-card"
            to={`/signals/${signal.id}`}
            state={{ from: `${location.pathname}${location.search}` }}
            onClick={rememberScroll}
          >
            <div className="signal-main">
              <span className="signal-type">{label(signal.signalType)}</span>
              <h2>{signal.tropel.name}</h2>
              <p>{signal.rawContent}</p>
            </div>
            <div className="signal-meta">
              <SeverityBadge value={signal.severity} />
              <StatusBadge value={signal.status} />
              <time>{formatDateTime(signal.createdAt)}</time>
            </div>
          </Link>
        ))}
      </div>

      {pageError ? <ErrorBlock message={pageError} onRetry={() => loadPage(nextCursor, "append")} /> : null}
      {loadingMore ? <LoadingBlock label="Cargando mas senales" /> : null}
      {!initialLoading && !hasMore && items.length > 0 ? <p className="end-line">Fin del feed</p> : null}
      <div ref={sentinelRef} className="feed-sentinel" aria-hidden="true" />
    </section>
  );
}
