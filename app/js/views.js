// views.js — every screen the app shows: the checklist rows, the guide
// detail pane, the roadmap stages, the missables page and the Next-up
// planner. All text is set with textContent (source URLs are shown as
// plain text, never as links), so the app makes no network request.

import { STAGES } from './data.js';
import { applyFilters, filterNote, gradeCounts, stageProgress } from './filters.js';
import { isSpoilerHidden } from './data.js';

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function medalSwatch(grade) {
  const s = el('span', `swatch ${grade}`);
  s.title = grade;
  return s;
}

function gradeLabel(trophy) {
  const span = el('span', 'grade-label', trophy.grade);
  return span;
}

/** The name a row shows: the real name, or the spoiler placeholder. */
export function displayName(trophy, state) {
  const earned = state.earned.includes(trophy.id);
  if (isSpoilerHidden(trophy, state.spoiler, earned)) return 'Hidden story trophy';
  return trophy.name;
}

/* ---------------- header ---------------- */

export function renderHeader(trophies, state) {
  const earned = new Set(state.earned);
  const count = earned.size;
  document.getElementById('earnedCount').textContent = String(count);
  const bar = document.querySelector('.progress-bar');
  bar.setAttribute('aria-valuenow', String(count));
  document.getElementById('progressFill').style.width = `${(count / trophies.length) * 100}%`;
  const counts = gradeCounts(trophies, earned);
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map(
    (g) => `${counts[g].earned}/${counts[g].total} ${g}`,
  );
  document.getElementById('gradeCounts').textContent = parts.join(' · ');
  const next = nextUp(trophies, state, 1)[0];
  const mini = document.getElementById('nextUpMini');
  mini.replaceChildren();
  if (next) {
    mini.append(el('span', null, 'Next up: '));
    mini.append(el('strong', null, displayName(next, state)));
  } else if (count >= trophies.length) {
    mini.append(el('strong', null, 'Platinum earned — Leonida Legend!'));
  }
  document.getElementById('missableCount').textContent = String(
    trophies.filter((t) => t.missable).length,
  );
}

/* ---------------- checklist ---------------- */

export function renderChecklist(trophies, state, filters, ctx) {
  const earned = new Set(state.earned);
  const visible = applyFilters(trophies, filters, earned);
  document.getElementById('filterNote').textContent = filterNote(trophies, visible, filters);
  const list = document.getElementById('trophyList');
  list.replaceChildren();
  for (const t of visible) {
    const li = el('li', 'trophy-row');
    if (earned.has(t.id)) li.classList.add('earned');
    if (ctx.selectedId === t.id) li.classList.add('selected');
    li.dataset.id = String(t.id);

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${displayName(t, state)} earned`);
    box.addEventListener('change', () => ctx.onToggleEarned(t.id, box.checked));
    li.append(box);

    const body = el('div', 'row-body');
    const nameRow = el('div', 'row-name', displayName(t, state));
    if (isSpoilerHidden(t, state.spoiler, earned.has(t.id))) nameRow.classList.add('hidden-name');
    body.append(nameRow);
    if (!isSpoilerHidden(t, state.spoiler, earned.has(t.id))) {
      body.append(el('div', 'row-desc', t.description));
    } else {
      body.append(el('div', 'row-desc', 'Hidden story trophy — earn it to reveal.'));
    }
    const tags = el('div', 'row-tags');
    tags.append(medalSwatch(t.grade));
    tags.append(gradeLabel(t));
    tags.append(el('span', `tag kind-${t.kind}`, t.kind));
    if (t.missable) tags.append(el('span', 'tag missable', '⚠ missable'));
    if (t.hidden) tags.append(el('span', 'tag', 'hidden on PSN'));
    body.append(tags);
    li.append(body);

    if (t.count) {
      const now = Math.min(state.counts[t.id] || 0, t.count.target);
      li.append(el('div', 'row-count', `${now}/${t.count.target} ${t.count.unit}`));
    }
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      ctx.onSelect(t.id);
    });
    list.append(li);
  }
  if (visible.length === 0) {
    const empty = el('li', 'trophy-row');
    empty.append(el('div', 'row-body', 'Nothing here — try clearing the search or another filter.'));
    list.append(empty);
  }
}

/* ---------------- detail pane ---------------- */

export function renderDetail(trophies, state, selectedId, ctx) {
  const pane = document.getElementById('detailPane');
  pane.replaceChildren();
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    pane.append(el('p', 'empty-detail', 'Pick a trophy from the list to see its guide, sources and progress stepper.'));
    return;
  }
  const earned = state.earned.includes(t.id);
  const hidden = isSpoilerHidden(t, state.spoiler, earned);

  const gradeLine = el('div', 'grade-line');
  gradeLine.append(medalSwatch(t.grade));
  gradeLine.append(gradeLabel(t));
  gradeLine.append(el('span', `tag kind-${t.kind}`, t.kind));
  if (t.missable) gradeLine.append(el('span', 'tag missable', '⚠ missable'));
  pane.append(gradeLine);

  pane.append(el('h2', null, hidden ? 'Hidden story trophy' : t.name));
  pane.append(el('p', 'official', hidden
    ? 'Hidden story trophy — earn it to reveal.'
    : `Official description: “${t.description}”`));

  if (t.missable && t.missableReason) {
    const warn = el('p', null, `Missable — ${t.missableReason}`);
    warn.style.color = 'var(--warn)';
    pane.append(warn);
  }

  pane.append(el('h3', null, 'Guide'));
  pane.append(el('p', null, hidden
    ? 'This guide stays hidden while the spoiler setting is on. Earn the trophy to reveal it.'
    : t.guide));

  pane.append(el('h3', null, 'Sources'));
  const ul = el('ul', 'sources');
  for (const s of t.sources) {
    const li = el('li');
    li.append(el('span', 'src-label', s.label));
    if (s.url) li.append(el('span', null, ` — ${s.url}`));
    ul.append(li);
  }
  pane.append(ul);

  if (!hidden && t.steps && t.steps.length) {
    pane.append(el('h3', null, 'Steps'));
    const ol = el('ol', 'steps');
    for (const s of t.steps) ol.append(el('li', null, s));
    pane.append(ol);
  }

  if (t.count) {
    pane.append(el('h3', null, 'Progress'));
    const now = Math.min(state.counts[t.id] || 0, t.count.target);
    const stepper = el('div', 'stepper');
    const minus = el('button', 'btn small', '−');
    minus.type = 'button';
    minus.addEventListener('click', () => ctx.onCountChange(t.id, (state.counts[t.id] || 0) - 1));
    const plus = el('button', 'btn small', '+');
    plus.type = 'button';
    plus.addEventListener('click', () => ctx.onCountChange(t.id, (state.counts[t.id] || 0) + 1));
    const label = el('span', 'count-now', `${now} / ${t.count.target} ${t.count.unit}`);
    stepper.append(minus, label, plus);
    pane.append(stepper);
    const bar = el('div', 'stepper-bar');
    bar.append(el('div'));
    bar.firstChild.style.width = `${(now / t.count.target) * 100}%`;
    pane.append(bar);
    pane.append(el('p', null, `PSN tracks this one as a count to ${t.count.target} ${t.count.label}.`));
  }

  pane.append(el('h3', null, 'Your note'));
  const note = document.createElement('textarea');
  note.className = 'note-area';
  note.placeholder = 'Your own note for this trophy…';
  note.value = state.notes[t.id] || '';
  note.setAttribute('aria-label', 'Note for this trophy');
  note.addEventListener('change', () => ctx.onNoteChange(t.id, note.value));
  pane.append(note);

  const earnBtn = el('button', earned ? 'btn' : 'btn primary', earned ? '✓ Earned — tap to unmark' : 'Mark earned');
  earnBtn.type = 'button';
  earnBtn.style.marginTop = '14px';
  earnBtn.addEventListener('click', () => ctx.onToggleEarned(t.id, !earned));
  pane.append(earnBtn);
}

/* ---------------- roadmap ---------------- */

export function renderRoadmap(trophies, state) {
  const earned = new Set(state.earned);
  const wrap = document.getElementById('roadmapStages');
  wrap.replaceChildren();
  for (const stage of STAGES) {
    const card = el('div', 'stage');
    const head = el('div', 'stage-head');
    head.append(el('h2', null, stage.title));
    const prog = stageProgress(trophies, stage.id, earned);
    head.append(el('span', 'stage-count', `${prog.earned} / ${prog.total} earned`));
    card.append(head);
    const bar = el('div', 'stage-bar');
    const fill = el('div');
    fill.style.width = prog.total ? `${(prog.earned / prog.total) * 100}%` : '0%';
    bar.append(fill);
    card.append(bar);
    card.append(el('p', null, stage.blurb));
    const minis = el('div', 'stage-trophies');
    for (const t of trophies.filter((x) => x.stage === stage.id)) {
      const m = el('span', 'mini', displayName(t, state));
      if (earned.has(t.id)) m.classList.add('done');
      minis.append(m);
    }
    card.append(minis);
    wrap.append(card);
  }
  const plat = trophies.find((t) => t.grade === 'platinum');
  const platCard = el('div', 'stage');
  platCard.append(el('h2', null, 'Then the platinum'));
  platCard.append(el('p', null, `${plat.name} — ${plat.description} It unlocks when the other 54 are earned.`));
  wrap.append(platCard);
}

/* ---------------- missables ---------------- */

export function renderMissables(trophies, state, ctx) {
  const earned = new Set(state.earned);
  const wrap = document.getElementById('missableList');
  wrap.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const card = el('div', 'missable-card');
    if (earned.has(t.id)) card.classList.add('done');
    card.append(el('h3', null, `${earned.has(t.id) ? '✓ ' : '⚠ '}${displayName(t, state)}`));
    card.append(el('p', 'why', t.missableReason));
    if (!isSpoilerHidden(t, state.spoiler, earned.has(t.id))) {
      card.append(el('p', null, t.description));
    }
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => ctx.onSelect(t.id, 'checklist'));
    wrap.append(card);
  }
}

/* ---------------- planner ---------------- */

/** Next unearned trophies in roadmap order, missable first within a stage. */
export function nextUp(trophies, state, limit = 10) {
  const earned = new Set(state.earned);
  return trophies
    .filter((t) => !earned.has(t.id) && t.grade !== 'platinum')
    .sort((a, b) => (a.stage - b.stage) || ((b.missable ? 1 : 0) - (a.missable ? 1 : 0)) || (a.id - b.id))
    .slice(0, limit);
}

export function renderPlanner(trophies, state, ctx) {
  const list = document.getElementById('plannerList');
  list.replaceChildren();
  const next = nextUp(trophies, state, 10);
  if (next.length === 0) {
    const li = el('li', 'planner-item');
    li.append(el('div', 'planner-rank', '★'));
    const body = el('div');
    body.append(el('h3', null, 'All done — Leonida Legend!'));
    body.append(el('p', null, 'Every trophy is earned. The platinum should be yours.'));
    li.append(body);
    list.append(li);
    return;
  }
  next.forEach((t, i) => {
    const li = el('li', 'planner-item');
    li.append(el('div', 'planner-rank', String(i + 1)));
    const body = el('div');
    body.append(el('h3', null, displayName(t, state)));
    const bits = [`Stage ${t.stage} · ${t.kind}`];
    if (t.missable) bits.push('⚠ missable — do it when it comes up');
    if (t.count) bits.push(`${Math.min(state.counts[t.id] || 0, t.count.target)}/${t.count.target} ${t.count.unit} so far`);
    body.append(el('p', null, bits.join(' · ')));
    if (!isSpoilerHidden(t, state.spoiler, false)) body.append(el('p', null, t.description));
    li.append(body);
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => ctx.onSelect(t.id, 'checklist'));
    list.append(li);
  });
}
