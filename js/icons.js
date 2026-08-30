const ICON_KEYS = [
  "person", "robot", "database", "document", "lock", "chart", "cycle",
  "rocket", "bulb", "target", "gear", "book", "network", "chat",
  "shield", "check", "star", "calendar", "money",
];

const ICON_PATHS = {
  person: '<circle cx="12" cy="8" r="3.2"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"/>',
  robot: '<rect x="6" y="8" width="12" height="10" rx="2"/><circle cx="9.5" cy="13" r="1"/><circle cx="14.5" cy="13" r="1"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 12v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6"/>',
  document: '<path d="M8 3h6l4 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  chart: '<path d="M4 19h16"/><path d="M6 15l4-4 3 3 5-6"/>',
  cycle: '<path d="M4 12a8 8 0 0 1 13.9-5.4"/><path d="M20 12a8 8 0 0 1-13.9 5.4"/><path d="M18 4v4h-4"/><path d="M6 20v-4h4"/>',
  rocket: '<path d="M12 2c3 1 5 4 5 8 0 3-1.5 6-5 10-3.5-4-5-7-5-10 0-4 2-7 5-8Z"/><circle cx="12" cy="9" r="1.6"/><path d="M9 17l-3 3M15 17l3 3"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3 11c.6.4 1 1 1 1.7V17h4v-1.3c0-.7.4-1.3 1-1.7A6 6 0 0 0 12 3Z"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.4M12 18.6V21M4.6 7.5l2 1.2M17.4 15.3l2 1.2M3 12h2.4M18.6 12H21M4.6 16.5l2-1.2M17.4 8.7l2-1.2M7.5 4.6l1.2 2M15.3 17.4l1.2 2"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 1 4 17.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 0 2.5-2.5Z"/>',
  network: '<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="18" r="2.2"/><path d="M7.7 7.2 10.5 16M16.3 7.2 13.5 16M8.2 6h7.6"/>',
  chat: '<path d="M4 5h16v10H9l-4 4V5Z"/>',
  shield: '<path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6Z"/>',
  check: '<path d="M5 13l4 4 10-10"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.6-4.6 4 1.4 6-5.5-3.2-5.5 3.2 1.4-6-4.6-4 6.1-.6Z"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  money: '<rect x="3" y="7" width="18" height="10" rx="2"/><circle cx="12" cy="12" r="2.6"/>',
  arrowRight: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  dot: '<circle cx="12" cy="12" r="3"/>',
};

function iconSvg(key) {
  const inner = ICON_PATHS[key] || ICON_PATHS.dot;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}
