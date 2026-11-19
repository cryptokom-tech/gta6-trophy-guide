// main.js — boot and wiring: loads the trophy data, owns the UI state,
// switches views, binds the toolbar, settings, export/import, keyboard
// shortcuts and the ?shot= staging seeds used only for screenshots.
// The default state (no ?shot=) is clean: 0 earned, spoilers on.

import { loadTrophies } from './data.js';
import { FILTER_DEFAULTS } from './filters.js';
import {
  loadState, saveState, setEarned, setCount, setNote,
  exportProgress, importProgress, resetProgress,
} from './store.js';
import {
  renderHeader, renderChecklist, renderDetail,
  renderRoadmap, renderMissables, renderPlanner,
} from './views.js';

const VIEWS = ['checklist', 'roadmap', 'missables', 'planner', 'settings'];

/** Demo progress seeded only when ?shot= is present (screenshots). */
const SHOT_SEED = {
  earned: [2, 3, 8, 15, 16, 20, 21, 31, 33, 37, 44, 46, 51],
  counts: { 15: 120, 31: 40, 35: 55, 32: 22, 17: 12, 42: 20 },
  openId: 15,
};

async function boot() {
  const trophies = await loadTrophies();
  const state = loadState();
  const filters = { ...FILTER_DEFAULTS, hideEarned: state.hideEarned };
  let selectedId = null;
  let activeView = 'checklist';

  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  const staging = shot !== null && ['cover', 'roadmap', 'missables', 'filters'].includes(shot);
  if (staging) {
    state.earned = [...SHOT_SEED.earned];
    state.counts = { ...SHOT_SEED.counts };
    state.spoiler = true;
    selectedId = SHOT_SEED.openId;
    if (shot === 'roadmap') activeView = 'roadmap';
    if (shot === 'missables') activeView = 'missables';
    if (shot === 'filters') {
      filters.kind = 'story';
      activeView = 'checklist';
    }
  }

  const ctx = {
    get selectedId() { return selectedId; },
    onSelect(id, view) {
      selectedId = id;
      if (view) switchView(view);
      else renderAll();
    },
    onToggleEarned(id, on) {
      setEarned(state, id, on);
      if (on && !staging) {
        const t = trophies.find((x) => x.id === id);
        if (t && t.count) setCount(state, id, t.count.target);
      }
      renderAll();
    },
    onCountChange(id, value) {
      const t = trophies.find((x) => x.id === id);
      const clamped = Math.max(0, Math.min(t.count.target, value));
      setCount(state, id, clamped);
      if (clamped >= t.count.target) setEarned(state, id, true);
      renderAll();
    },
    onNoteChange(id, text) {
      setNote(state, id, text);
    },
  };

  function renderAll() {
    renderHeader(trophies, state);
    renderChecklist(trophies, state, filters, ctx);
    renderDetail(trophies, state, selectedId, ctx);
    renderRoadmap(trophies, state);
    renderMissables(trophies, state, ctx);
    renderPlanner(trophies, state, ctx);
    syncControls();
    window.__shotReady = true;
  }

  function switchView(view) {
    activeView = VIEWS.includes(view) ? view : 'checklist';
    for (const v of VIEWS) {
      document.getElementById(`view-${v}`).classList.toggle('active', v === activeView);
      document.querySelector(`.tab[data-view="${v}"]`).classList.toggle('active', v === activeView);
    }
    if (activeView === 'checklist') document.getElementById('searchBox').focus({ preventScroll: true });
  }

  function syncControls() {
    document.getElementById('spoilerToggle').textContent = state.spoiler ? 'Spoilers: ON' : 'Spoilers: OFF';
    document.getElementById('spoilerCheck').checked = state.spoiler;
    document.getElementById('themeCheck').checked = state.theme === 'paper';
    document.getElementById('themeToggle').textContent = state.theme === 'paper' ? '☀ Paper' : '☾ Night';
    document.documentElement.dataset.theme = state.theme;
    document.getElementById('hideEarned').checked = filters.hideEarned;
    for (const chip of document.querySelectorAll('#kindChips .chip')) {
      chip.classList.toggle('active', chip.dataset.kind === filters.kind);
    }
    for (const chip of document.querySelectorAll('#gradeChips .chip')) {
      chip.classList.toggle('active', chip.dataset.grade === filters.grade);
    }
  }

  function toggleSpoiler() {
    state.spoiler = !state.spoiler;
    saveState(state);
    renderAll();
  }

  function toggleTheme() {
    state.theme = state.theme === 'paper' ? 'night' : 'paper';
    saveState(state);
    renderAll();
  }

  // Tabs.
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  }

  // Toolbar: search, kind chips, grade chips, hide-earned.
  const searchBox = document.getElementById('searchBox');
  searchBox.addEventListener('input', () => {
    filters.query = searchBox.value;
    renderChecklist(trophies, state, filters, ctx);
  });
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.addEventListener('click', () => {
      filters.kind = chip.dataset.kind;
      renderChecklist(trophies, state, filters, ctx);
      syncControls();
    });
  }
  for (const chip of document.querySelectorAll('#gradeChips .chip')) {
    chip.addEventListener('click', () => {
      filters.grade = chip.dataset.grade;
      renderChecklist(trophies, state, filters, ctx);
      syncControls();
    });
  }
  document.getElementById('hideEarned').addEventListener('change', (e) => {
    filters.hideEarned = e.target.checked;
    state.hideEarned = e.target.checked;
    saveState(state);
    renderChecklist(trophies, state, filters, ctx);
  });

  // Header + settings controls.
  document.getElementById('spoilerToggle').addEventListener('click', toggleSpoiler);
  document.getElementById('spoilerCheck').addEventListener('change', toggleSpoiler);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('themeCheck').addEventListener('change', toggleTheme);

  // Export / import / reset.
  document.getElementById('exportBtn').addEventListener('click', () => exportProgress(state));
  document.getElementById('exportBtnTop').addEventListener('click', () => exportProgress(state));
  async function handleImport(file) {
    const status = document.getElementById('importStatus');
    const result = await importProgress(file);
    if (result.error) {
      status.textContent = result.error;
    } else {
      Object.assign(state, result.state);
      filters.hideEarned = state.hideEarned;
      status.textContent = `Imported: ${state.earned.length} trophies earned.`;
      renderAll();
    }
  }
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleImport(file);
    e.target.value = '';
  });
  document.getElementById('importFileTop').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await handleImport(file);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Reset all progress, counters and notes?')) return;
    Object.assign(state, resetProgress());
    selectedId = null;
    renderAll();
  });

  // Help overlay.
  const overlay = document.getElementById('helpOverlay');
  document.getElementById('helpBtn').addEventListener('click', () => { overlay.hidden = false; });
  document.getElementById('helpClose').addEventListener('click', () => { overlay.hidden = true; });
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.hidden = true; });

  // Keyboard shortcuts.
  document.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input, textarea, select');
    if (e.key === 'Escape') { overlay.hidden = true; return; }
    if (typing) return;
    if (e.key === '/') { e.preventDefault(); switchView('checklist'); searchBox.focus(); }
    else if (e.key === '?') { overlay.hidden = false; }
    else if (e.key >= '1' && e.key <= '5') { switchView(VIEWS[Number(e.key) - 1]); }
    else if (e.key === 's' || e.key === 'S') { toggleSpoiler(); }
    else if (e.key === 't' || e.key === 'T') { toggleTheme(); }
    else if (e.key === 'e' || e.key === 'E') { exportProgress(state); }
  });

  renderAll();
  switchView(activeView);
  if (staging) window.__shotReady = true;
}

boot().catch((err) => {
  document.getElementById('main').innerHTML = `<p style="padding:20px">Could not load the trophy guide: ${err.message}</p>`;
  console.error(err);
});
