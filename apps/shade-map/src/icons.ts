// Tabler Icons（MIT, Copyright (c) 2020-2026 Paweł Kuna）の outline 版。currentColor で塗るためインラインで持つ。
export const icons = {
  "arrows-up-down": "<path d=\"M7 3l0 18\" /> <path d=\"M10 6l-3 -3l-3 3\" /> <path d=\"M20 18l-3 3l-3 -3\" /> <path d=\"M17 21l0 -18\" />",
  "sun": "<path d=\"M8 12a4 4 0 1 0 8 0a4 4 0 1 0 -8 0\" /> <path d=\"M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7\" />",
  "umbrella": "<path d=\"M4 12a8 8 0 0 1 16 0l-16 0\" /> <path d=\"M12 12v6a2 2 0 0 0 4 0\" />",
  "clock": "<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0\" /> <path d=\"M12 7v5l3 3\" />",
  "walk": "<path d=\"M12 4a1 1 0 1 0 2 0a1 1 0 1 0 -2 0\" /> <path d=\"M7 21l3 -4\" /> <path d=\"M16 21l-2 -4l-3 -3l1 -6\" /> <path d=\"M6 12l2 -3l4 -1l3 3l3 1\" />",
  "map-pin": "<path d=\"M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0\" /> <path d=\"M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0\" />",
  "info-circle": "<path d=\"M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0\" /> <path d=\"M12 9h.01\" /> <path d=\"M11 12h1v4h1\" />",
  "alert-triangle": "<path d=\"M12 9v4\" /> <path d=\"M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0\" /> <path d=\"M12 16h.01\" />",
  "chevron-down": "<path d=\"M6 9l6 6l6 -6\" />",
  "flag": "<path d=\"M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9\" /> <path d=\"M5 21v-7\" />",
  "building-arch": "<path d=\"M3 21l18 0\" /> <path d=\"M4 21v-15a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v15\" /> <path d=\"M9 21v-8a3 3 0 0 1 6 0v8\" />",
  "stairs-down": "<path d=\"M22 21h-5v-5h-5v-5h-5v-5h-5\" /> <path d=\"M18 3v7\" /> <path d=\"M15 7l3 3l3 -3\" />",
  "external-link": "<path d=\"M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6\" /> <path d=\"M11 13l9 -9\" /> <path d=\"M15 4h5v5\" />",
} as const;

export type IconName = keyof typeof icons;

export function icon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
}
