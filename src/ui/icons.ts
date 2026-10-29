const paths: Record<string, string> = {
  coin: '<circle cx="12" cy="12" r="9"/><path d="m14 6-5 6h6l-5 6"/>',
  power: '<path d="M5 4v9a7 7 0 0 0 14 0V4h-5v9a2 2 0 0 1-4 0V4Z"/>',
  range:
    '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2"/>',
  drones:
    '<rect x="5" y="8" width="14" height="10" rx="5"/><path d="M8 12v2m8-2v2M4 8V4m16 4V4M1 4h6m10 0h6M8 18l-1 3m9-3 1 3"/>',
  value:
    '<path d="m9 3 1-2h4l1 2 3 2 2 0 2 4-1 2v3l1 2-2 4h-3l-2 2h-5l-2-2H5l-3-4 1-2v-3L2 9l2-4h3Z"/><circle cx="12" cy="12" r="4"/>',
  bolt: '<path d="m14 1-11 13h8l-1 9 11-14h-8Z"/>',
  arc: '<path d="m1 15 3-1 2 3 5-13 4 16 3-9 2 3 3-1"/>',
  sorter:
    '<path d="M9 2h6v5H9Zm3 5v4M6 12h12l4 7-3 4-4-7H9l-4 7-3-4Zm4-2h4v4h-4Z"/>',
  dice: '<path d="m12 2 9 5v10l-9 5-9-5V7Zm0 10L3 7m9 5 9-5m-9 5v10"/><circle cx="9" cy="7" r=".8"/><circle cx="15" cy="7" r=".8"/><circle cx="7" cy="13" r=".8"/><circle cx="7" cy="17" r=".8"/><circle cx="17" cy="15" r=".8"/>',
  upgrade: '<path d="m12 2 10 9h-6v8H8v-8H2Zm-4 21h8"/>',
  research: '<path d="M8 2h8m-6 0v7L3 20q-1 2 2 2h14q3 0 2-2L14 9V2M7 16h10"/>',
  warehouse: '<path d="m2 8 10-6 10 6v14h-4V11H6v11H2Zm6 8h8m-8 5h8"/>',
  supply:
    '<path d="M3 8h18v4H3Zm2 4v10h14V12M12 8v14m0-14C1 7 7-4 12 8c11-1 5-12 0 0Z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-11v1"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  sound: '<path d="m12 3-7 6H2v6h3l7 6Zm4 5q5 4 0 8m3-11q8 7 0 14"/>',
  arrow: '<path d="m6 9 6 6 6-6"/>',
  core: '<path d="m12 1 10 6v10l-10 6-10-6V7Z"/><circle cx="12" cy="12" r="5"/>',
  trophy:
    '<path d="M6 2h12v8a6 6 0 0 1-12 0ZM6 4H2v5q0 5 5 5m11-10h4v5q0 5-5 5m-5 2v6m-5 0h10"/>',
};
export function icon(name: string, cls = "") {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] ?? paths.bolt}</svg>`;
}
export const pluginIcon: Record<string, string> = {
  arc: "arc",
  magnet: "power",
  swarm: "drones",
  cutter: "value",
  resonance: "range",
  sorter: "sorter",
};
