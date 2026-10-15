// The play statuses a game can have.
export const STATUSES = [
  { key: 'playing', label: 'Playing' },
  { key: 'completed', label: 'Completed' },
  { key: 'want_to_play', label: 'Want to Play' },
  { key: 'dropped', label: 'Dropped' },
];
export const STATUS_KEYS = STATUSES.map((s) => s.key);
export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.key, s.label]));
