// store.js — saved progress: earned ticks, per-trophy counters, notes,
// spoiler and theme settings, all in localStorage. Export downloads a
// JSON backup; import reads one back. Nothing leaves the browser.

const KEY = 'leonida-platinum-v1';

export const DEFAULT_STATE = {
  earned: [],
  counts: {},
  notes: {},
  spoiler: true,
  theme: 'night',
  hideEarned: false,
};

/** Read the saved state, tolerating a missing or damaged entry. */
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE, earned: [], counts: {}, notes: {} };
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      spoiler: parsed.spoiler !== false,
      theme: parsed.theme === 'paper' ? 'paper' : 'night',
      hideEarned: parsed.hideEarned === true,
    };
  } catch {
    return { ...DEFAULT_STATE, earned: [], counts: {}, notes: {} };
  }
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function earnedSet(state) {
  return new Set(state.earned);
}

export function setEarned(state, id, on) {
  const set = earnedSet(state);
  if (on) set.add(id);
  else set.delete(id);
  state.earned = [...set].sort((a, b) => a - b);
  saveState(state);
}

export function setCount(state, id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  if (n === 0) delete state.counts[id];
  else state.counts[id] = n;
  saveState(state);
}

export function setNote(state, id, text) {
  const clean = String(text ?? '').slice(0, 500);
  if (clean.trim() === '') delete state.notes[id];
  else state.notes[id] = clean;
  saveState(state);
}

/** Download the whole state as a JSON backup file. */
export function exportProgress(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-platinum-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Import a backup file. Returns { state } on success or { error } on failure.
 * Only the known fields are taken; anything else in the file is ignored.
 */
export async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const base = loadState();
    const state = {
      earned: Array.isArray(parsed.earned) ? parsed.earned.filter((n) => Number.isInteger(n)) : base.earned,
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : base.counts,
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : base.notes,
      spoiler: typeof parsed.spoiler === 'boolean' ? parsed.spoiler : base.spoiler,
      theme: parsed.theme === 'paper' ? 'paper' : base.theme,
      hideEarned: parsed.hideEarned === true,
    };
    saveState(state);
    return { state };
  } catch (err) {
    return { error: `Could not read that file: ${err.message}` };
  }
}

export function resetProgress() {
  const fresh = { ...DEFAULT_STATE, earned: [], counts: {}, notes: {} };
  saveState(fresh);
  return fresh;
}
