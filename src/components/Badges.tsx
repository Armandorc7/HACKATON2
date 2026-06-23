import type { Severity, SignalStatus, VitalState } from "../api/types";
import { label } from "../utils/format";

export function SeverityBadge({ value }: { value: Severity }) {
  return <span className={`badge severity-${value.toLowerCase()}`}>{label(value)}</span>;
}

export function StatusBadge({ value }: { value: SignalStatus }) {
  return <span className={`badge status-${value.toLowerCase()}`}>{label(value)}</span>;
}

export function VitalBadge({ value }: { value: VitalState }) {
  return <span className={`badge vital-${value.toLowerCase()}`}>{label(value)}</span>;
}
