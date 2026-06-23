export type Species = "BLOBITO" | "CHISPA" | "GRUNON" | "DORMILON" | "GLITCHY";
export type VitalState = "ESTABLE" | "HAMBRIENTO" | "AGITADO" | "MUTANDO" | "CRITICO";
export type SignalType =
  | "HAMBRE"
  | "ABANDONO"
  | "MUTACION"
  | "FUGA"
  | "CONFLICTO"
  | "REPRODUCCION_MASIVA"
  | "SENAL_CORRUPTA";
export type Severity = "LEVE" | "MODERADO" | "GRAVE" | "CRITICO";
export type SignalStatus = "RECIBIDA" | "PROCESANDO" | "ATENDIDA";
export type MutableSignalStatus = "PROCESANDO" | "ATENDIDA";
export type Climate = "PIXEL_FOREST" | "NEON_CAVE" | "CLOUD_AQUARIUM" | "RETRO_ARCADE";

export interface ApiErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  path: string;
  details: Record<string, unknown>;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  teamCode: string;
  role: "OPERATOR";
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface SectorSummary {
  id: string;
  sectorCode: string;
  name: string;
  climate: Climate;
  capacity: number;
  currentLoad: number;
  stabilityLevel: number;
}

export interface Tropel {
  id: string;
  name: string;
  species: Species;
  vitalState: VitalState;
  energyLevel: number;
  chaosIndex: number;
  mutationStage: number;
  guardianName: string;
  sector: Pick<SectorSummary, "id" | "name" | "sectorCode">;
  createdAt: string;
  updatedAt: string;
}

export interface Signal {
  id: string;
  signalType: SignalType;
  severity: Severity;
  status: SignalStatus;
  rawContent: string;
  tropel: {
    id: string;
    name: string;
    species: Species;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalTropels: number;
  criticalTropels: number;
  openSignals: number;
  sectorStabilityAvg: number;
  signalsBySeverity: Record<Severity, number>;
  generatedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

export interface FeedResponse {
  items: Signal[];
  nextCursor: string | null;
  hasMore: boolean;
  totalEstimate: number;
}

export interface SectorsResponse {
  items: SectorSummary[];
}

export interface StoryStage {
  id: string;
  order: number;
  title: string;
  narrative: string;
  dominantEvent: SignalType;
  metrics: {
    stability: number;
    energy: number;
    alerts: number;
  };
  assetKey: string;
  colorToken: string;
  progress: number;
}

export interface SectorStoryResponse {
  sector: Pick<SectorSummary, "id" | "name" | "climate">;
  stages: StoryStage[];
}

export const speciesOptions: Species[] = ["BLOBITO", "CHISPA", "GRUNON", "DORMILON", "GLITCHY"];
export const vitalStateOptions: VitalState[] = ["ESTABLE", "HAMBRIENTO", "AGITADO", "MUTANDO", "CRITICO"];
export const signalTypeOptions: SignalType[] = [
  "HAMBRE",
  "ABANDONO",
  "MUTACION",
  "FUGA",
  "CONFLICTO",
  "REPRODUCCION_MASIVA",
  "SENAL_CORRUPTA",
];
export const severityOptions: Severity[] = ["LEVE", "MODERADO", "GRAVE", "CRITICO"];
export const signalStatusOptions: SignalStatus[] = ["RECIBIDA", "PROCESANDO", "ATENDIDA"];
export const mutableSignalStatusOptions: MutableSignalStatus[] = ["PROCESANDO", "ATENDIDA"];
