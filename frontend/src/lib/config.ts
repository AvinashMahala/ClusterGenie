// frontend/src/lib/config.ts
// Centralize environment-driven URLs for the frontend
export const API_BASE = (
  import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:8080'
) + '/api/v1'

// Grafana base used by embeds and external links. Default points to dev Grafana on port 3000.
// Default Grafana URL should point to the host port used by the repo (3001)
export const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL ?? 'http://localhost:3001'
