// Tabler Icons（MIT, Copyright (c) 2020-2026 Paweł Kuna）の outline 版。currentColor で塗るためインラインで持つ。
export const icons = {
  "alert-triangle": "<path d=\"M12 9v4\" /> <path d=\"M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0\" /> <path d=\"M12 16h.01\" />",
  "arrows-shuffle": "<path d=\"M18 4l3 3l-3 3\" /> <path d=\"M18 20l3 -3l-3 -3\" /> <path d=\"M3 7h3a5 5 0 0 1 5 5a5 5 0 0 0 5 5h5\" /> <path d=\"M21 7h-5a4.978 4.978 0 0 0 -3 1m-4 8a4.984 4.984 0 0 1 -3 1h-3\" />",
  "baby-carriage": "<path d=\"M6 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" /> <path d=\"M16 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" /> <path d=\"M2 5h2.5l1.632 4.897a6 6 0 0 0 5.693 4.103h2.675a5.5 5.5 0 0 0 0 -11h-.5v6\" /> <path d=\"M6 9h14\" /> <path d=\"M9 17l1 -3\" /> <path d=\"M16 14l1 3\" />",
  "calendar-week": "<path d=\"M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12\" /> <path d=\"M16 3v4\" /> <path d=\"M8 3v4\" /> <path d=\"M4 11h16\" /> <path d=\"M7 14h.013\" /> <path d=\"M10.01 14h.005\" /> <path d=\"M13.01 14h.005\" /> <path d=\"M16.015 14h.005\" /> <path d=\"M13.015 17h.005\" /> <path d=\"M7.01 17h.005\" /> <path d=\"M10.01 17h.005\" />",
  "check": "<path d=\"M5 12l5 5l10 -10\" />",
  "chevron-down": "<path d=\"M6 9l6 6l6 -6\" />",
  "clock": "<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0\" /> <path d=\"M12 7v5l3 3\" />",
  "copy": "<path d=\"M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666\" /> <path d=\"M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1\" />",
  "minus": "<path d=\"M5 12l14 0\" />",
  "plus": "<path d=\"M12 5l0 14\" /> <path d=\"M5 12l14 0\" />",
  "refresh": "<path d=\"M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4\" /> <path d=\"M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4\" />",
  "shopping-cart": "<path d=\"M4 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" /> <path d=\"M15 19a2 2 0 1 0 4 0a2 2 0 1 0 -4 0\" /> <path d=\"M17 17h-11v-14h-2\" /> <path d=\"M6 5l14 1l-1 7h-13\" />",
  "trash": "<path d=\"M4 7l16 0\" /> <path d=\"M10 11l0 6\" /> <path d=\"M14 11l0 6\" /> <path d=\"M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12\" /> <path d=\"M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3\" />",
  "user": "<path d=\"M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0\" /> <path d=\"M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2\" />",
  "x": "<path d=\"M18 6l-12 12\" /> <path d=\"M6 6l12 12\" />",
} as const;

export type IconName = keyof typeof icons;

export function icon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
}
