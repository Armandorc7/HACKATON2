import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { MutableSignalStatus, Signal } from "../api/types";
import { mutableSignalStatusOptions } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { SeverityBadge, StatusBadge } from "../components/Badges";
import { ErrorBlock, LoadingBlock } from "../components/Status";
import { formatDateTime, label } from "../utils/format";

const signalUpdatesKey = "tropelcare.signal.updates";

export function SignalDetailPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<MutableSignalStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const from = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/signals";
  }, [location.state]);

  useEffect(() => {
    if (!token || !id) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api
      .signalDetail(token, id, controller.signal)
      .then((response) => setSignal(response))
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof ApiError ? caught.message : "No se pudo cargar la senal");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id, token]);

  async function updateStatus(status: MutableSignalStatus) {
    if (!token || !id) return;
    setSaving(status);
    setActionError(null);
    setConfirmation(null);
    try {
      const updated = await api.updateSignalStatus(token, id, status);
      setSignal(updated);
      persistSignalUpdate(updated);
      setConfirmation(`Estado actualizado a ${label(updated.status)}.`);
    } catch (caught: unknown) {
      setActionError(caught instanceof ApiError ? caught.message : "No se pudo actualizar el estado");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="page-section detail-page">
      <button className="btn secondary" type="button" onClick={() => navigate(from)}>
        Volver al feed
      </button>
      {loading ? <LoadingBlock label="Cargando detalle" /> : null}
      {error ? <ErrorBlock message={error} /> : null}
      {!loading && !error && signal ? (
        <article className="detail-panel">
          <div className="page-header detail-header">
            <div>
              <p className="eyebrow">{label(signal.signalType)}</p>
              <h1>{signal.tropel.name}</h1>
            </div>
            <div className="badge-line">
              <SeverityBadge value={signal.severity} />
              <StatusBadge value={signal.status} />
            </div>
          </div>
          <p className="signal-copy">{signal.rawContent}</p>
          <dl className="detail-grid">
            <div>
              <dt>Tropel</dt>
              <dd>{signal.tropel.name} ({label(signal.tropel.species)})</dd>
            </div>
            <div>
              <dt>Creada</dt>
              <dd>{formatDateTime(signal.createdAt)}</dd>
            </div>
            <div>
              <dt>Actualizada</dt>
              <dd>{formatDateTime(signal.updatedAt)}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{signal.id}</dd>
            </div>
          </dl>
          <div className="actions-panel">
            <strong>Cambiar estado</strong>
            <div className="button-row">
              {mutableSignalStatusOptions.map((status) => (
                <button
                  key={status}
                  className="btn primary"
                  type="button"
                  disabled={saving !== null || signal.status === status}
                  onClick={() => updateStatus(status)}
                >
                  {saving === status ? "Guardando..." : label(status)}
                </button>
              ))}
            </div>
            {confirmation ? <p className="success-text">{confirmation}</p> : null}
            {actionError ? (
              <div className="inline-error">
                <span>{actionError}</span>
                {signal.status !== "ATENDIDA" ? (
                  <button className="btn secondary" type="button" onClick={() => updateStatus("ATENDIDA")}>
                    Reintentar atendida
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <Link className="btn ghost" to={from}>
            Regresar conservando posicion
          </Link>
        </article>
      ) : null}
    </section>
  );
}

function persistSignalUpdate(signal: Signal) {
  const raw = sessionStorage.getItem(signalUpdatesKey);
  let updates: Record<string, Signal> = {};
  if (raw) {
    try {
      updates = JSON.parse(raw) as Record<string, Signal>;
    } catch {
      updates = {};
    }
  }
  updates[signal.id] = signal;
  sessionStorage.setItem(signalUpdatesKey, JSON.stringify(updates));
}
