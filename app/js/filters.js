// filters.js — the checklist filters: text search, kind, grade, hide-earned,
// and the spoiler rule. Pure functions over the trophy list and the UI
// filter state, so the views stay thin.

export const FILTER_DEFAULTS = {
  query: '',
  kind: 'all',
  grade: 'all',
  hideEarned: false,
};

/** Does one trophy pass the current filters? */
export function trophyMatches(trophy, filters, earnedIds) {
  if (filters.hideEarned && earnedIds.has(trophy.id)) return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.kind === 'online') return false; // the list has no online trophies
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind !== 'all' && filters.kind !== 'missable' && trophy.kind !== filters.kind) return false;
  const q = filters.query.trim().toLowerCase();
  if (q) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

/** Filter the whole list; returns the visible trophies in list order. */
export function applyFilters(trophies, filters, earnedIds) {
  return trophies.filter((t) => trophyMatches(t, filters, earnedIds));
}

/** One-line note explaining what the filters are showing (or why nothing shows). */
export function filterNote(trophies, visible, filters) {
  if (filters.kind === 'online') {
    return 'Online: this list has no online trophies — every one of the 55 can be earned in single player, so this filter is empty on purpose.';
  }
  if (visible.length === 0) return 'No trophies match those filters. Clear the search or pick another kind or grade.';
  const parts = [];
  if (filters.query.trim()) parts.push(`matching “${filters.query.trim()}”`);
  if (filters.kind !== 'all') parts.push(`kind: ${filters.kind}`);
  if (filters.grade !== 'all') parts.push(`grade: ${filters.grade}`);
  if (filters.hideEarned) parts.push('earned hidden');
  if (parts.length === 0) return `Showing all ${trophies.length} trophies.`;
  return `Showing ${visible.length} of ${trophies.length} trophies (${parts.join(' · ')}).`;
}

/** Counts earned per grade, for the header line. */
export function gradeCounts(trophies, earnedIds) {
  const out = {};
  for (const t of trophies) {
    if (!out[t.grade]) out[t.grade] = { earned: 0, total: 0 };
    out[t.grade].total += 1;
    if (earnedIds.has(t.id)) out[t.grade].earned += 1;
  }
  return out;
}

/** Per-stage progress: { earned, total } for one roadmap stage. */
export function stageProgress(trophies, stageId, earnedIds) {
  const inStage = trophies.filter((t) => t.stage === stageId);
  return { earned: inStage.filter((t) => earnedIds.has(t.id)).length, total: inStage.length };
}
