// Tabler Icons（MIT, Copyright (c) 2020-2026 Paweł Kuna）の outline 版。currentColor で塗るためインラインで持つ。
export const icons = {
  "refresh": "<path d=\"M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4\" /> <path d=\"M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4\" />",
  "share": "<path d=\"M3 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\" /> <path d=\"M15 6a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\" /> <path d=\"M15 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0\" /> <path d=\"M8.7 10.7l6.6 -3.4\" /> <path d=\"M8.7 13.3l6.6 3.4\" />",
  "clock": "<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0\" /> <path d=\"M12 7v5l3 3\" />",
  "arrows-exchange": "<path d=\"M7 10h14l-4 -4\" /> <path d=\"M17 14h-14l4 4\" />",
  "bulb": "<path d=\"M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7\" /> <path d=\"M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3\" /> <path d=\"M9.7 17l4.6 0\" />",
} as const;

export type IconName = keyof typeof icons;

export function icon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
}
