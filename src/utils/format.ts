export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function label(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

export function percent(value: number) {
  return `${Math.round(value)}%`;
}
