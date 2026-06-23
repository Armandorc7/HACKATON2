import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { SectorStoryResponse, StoryStage } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ErrorBlock, LoadingBlock } from "../components/Status";
import { label } from "../utils/format";

export function SectorStoryPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const [story, setStory] = useState<SectorStoryResponse | null>(null);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stageRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    if (!token || !id) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .sectorStory(token, id, controller.signal)
      .then((response) => {
        setStory(response);
        setActive(0);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof ApiError ? caught.message : "No se pudo cargar la historia del sector");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id, token]);

  useEffect(() => {
    if (!story) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible) setActive(Number((visible.target as HTMLElement).dataset.stageIndex ?? 0));
      },
      { threshold: [0.45, 0.65, 0.85] },
    );
    for (const element of stageRefs.current) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [story]);

  const activeStage = story?.stages[active];
  const progress = story ? ((active + 1) / story.stages.length) * 100 : 0;
  const colorStyle = useMemo(
    () => ({ "--story-color": activeStage?.colorToken ?? "#2f7d6b" }) as CSSProperties,
    [activeStage?.colorToken],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (!story) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const nextIndex = event.key === "ArrowDown" ? Math.min(story.stages.length - 1, index + 1) : Math.max(0, index - 1);
    stageRefs.current[nextIndex]?.focus();
    stageRefs.current[nextIndex]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <section className="story-page" style={colorStyle}>
      <div className="story-topbar">
        <Link className="btn secondary" to="/sectors">
          Volver a sectores
        </Link>
        <div className="story-progress" aria-label={`Progreso ${Math.round(progress)}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      {loading ? (
        <div className="page-section">
          <LoadingBlock label="Cargando historia" />
        </div>
      ) : null}
      {error ? (
        <div className="page-section">
          <ErrorBlock message={error} />
        </div>
      ) : null}
      {!loading && !error && story && activeStage ? (
        <div className="story-layout">
          <aside className="story-visual" aria-live="polite">
            <div className={`visual-core climate-${story.sector.climate.toLowerCase()}`}>
              <span className="visual-orbit one" />
              <span className="visual-orbit two" />
              <span className="visual-center">{activeStage.assetKey.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="visual-caption">
              <p className="eyebrow">{story.sector.climate}</p>
              <h1>{story.sector.name}</h1>
              <strong>{activeStage.title}</strong>
            </div>
            <MetricTriplet stage={activeStage} />
          </aside>
          <main className="story-stages">
            {story.stages.map((stage, index) => (
              <section
                key={stage.id}
                ref={(element) => {
                  stageRefs.current[index] = element;
                }}
                tabIndex={0}
                data-stage-index={index}
                className={index === active ? "story-stage active" : "story-stage"}
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <span className="stage-number">{String(index + 1).padStart(2, "0")}</span>
                <p className="eyebrow">{label(stage.dominantEvent)}</p>
                <h2>{stage.title}</h2>
                <p>{stage.narrative}</p>
                <MetricTriplet stage={stage} compact />
              </section>
            ))}
          </main>
        </div>
      ) : null}
    </section>
  );
}

function MetricTriplet({ stage, compact = false }: { stage: StoryStage; compact?: boolean }) {
  return (
    <div className={compact ? "story-metrics compact" : "story-metrics"}>
      <Metric label="Estabilidad" value={stage.metrics.stability} />
      <Metric label="Energia" value={stage.metrics.energy} />
      <Metric label="Alertas" value={stage.metrics.alerts} />
    </div>
  );
}

function Metric({ label: metricLabel, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{metricLabel}</span>
      <strong>{value}</strong>
    </div>
  );
}
