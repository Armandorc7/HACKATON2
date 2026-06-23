export function LoadingBlock({ label = "Cargando datos" }: { label?: string }) {
  return (
    <div className="status-box" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="status-box error-box" role="alert">
      <div>
        <strong>No se pudo cargar</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button className="btn secondary" type="button" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function EmptyBlock({ title, message }: { title: string; message: string }) {
  return (
    <div className="status-box empty-box">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
