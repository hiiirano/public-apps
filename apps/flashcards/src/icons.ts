// Tabler Icons（MIT, Copyright (c) 2020-2026 Paweł Kuna）の outline 版。currentColor で塗るためインラインで持つ。
export const icons = {
  "arrow-back-up": "<path d=\"M9 14l-4 -4l4 -4\" /> <path d=\"M5 10h11a4 4 0 1 1 0 8h-1\" />",
  "arrow-left": "<path d=\"M5 12l14 0\" /> <path d=\"M5 12l6 6\" /> <path d=\"M5 12l6 -6\" />",
  "cards": "<path d=\"M3.604 7.197l7.138 -3.109a.96 .96 0 0 1 1.27 .527l4.924 11.902a1 1 0 0 1 -.514 1.304l-7.137 3.109a.96 .96 0 0 1 -1.271 -.527l-4.924 -11.903a1 1 0 0 1 .514 -1.304l0 .001\" /> <path d=\"M15 4h1a1 1 0 0 1 1 1v3.5\" /> <path d=\"M20 6c.264 .112 .52 .217 .768 .315a1 1 0 0 1 .53 1.311l-2.298 5.374\" />",
  "check": "<path d=\"M5 12l5 5l10 -10\" />",
  "copy": "<path d=\"M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666\" /> <path d=\"M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1\" />",
  "download": "<path d=\"M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2\" /> <path d=\"M7 11l5 5l5 -5\" /> <path d=\"M12 4l0 12\" />",
  "keyboard": "<path d=\"M2 8a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2l0 -8\" /> <path d=\"M6 10l0 .01\" /> <path d=\"M10 10l0 .01\" /> <path d=\"M14 10l0 .01\" /> <path d=\"M18 10l0 .01\" /> <path d=\"M6 14l0 .01\" /> <path d=\"M18 14l0 .01\" /> <path d=\"M10 14l4 .01\" />",
  "pencil": "<path d=\"M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4\" /> <path d=\"M13.5 6.5l4 4\" />",
  "plus": "<path d=\"M12 5l0 14\" /> <path d=\"M5 12l14 0\" />",
  "rotate-2": "<path d=\"M15 4.55a8 8 0 0 0 -6 14.9m0 -4.45v5h-5\" /> <path d=\"M18.37 7.16l0 .01\" /> <path d=\"M13 19.94l0 .01\" /> <path d=\"M16.84 18.37l0 .01\" /> <path d=\"M19.37 15.1l0 .01\" /> <path d=\"M19.94 11l0 .01\" />",
  "trash": "<path d=\"M4 7l16 0\" /> <path d=\"M10 11l0 6\" /> <path d=\"M14 11l0 6\" /> <path d=\"M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12\" /> <path d=\"M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3\" />",
  "upload": "<path d=\"M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2\" /> <path d=\"M7 9l5 -5l5 5\" /> <path d=\"M12 4l0 12\" />",
  "x": "<path d=\"M18 6l-12 12\" /> <path d=\"M6 6l12 12\" />",
} as const;

export type IconName = keyof typeof icons;

export function icon(name: IconName): string {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
}
