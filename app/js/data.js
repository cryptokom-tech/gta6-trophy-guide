// data.js — loads the trophy list and holds the fixed metadata the app
// renders from it: roadmap stages, kind labels, grade order. The only
// network-adjacent call the app makes is fetch('data/trophies.json'),
// a file of its own server; everything else is local constants.

export const STAGES = [
  {
    id: 1,
    title: 'Stage 1 — Story playthrough',
    blurb: 'Chapters 1–4, the named story missions and the stranger finales. Play the story in order; every trophy here is tied to a mission or chapter, so finish each one when it comes up.',
  },
  {
    id: 2,
    title: 'Stage 2 — Strangers & side stories',
    blurb: 'Stranger strands and their one-off moments: Cal’s fishing challenge, Bret’s unique-animal hunt, meditation spots and the 8 stranger strands.',
  },
  {
    id: 3,
    title: 'Stage 3 — Collectibles across Leonida',
    blurb: 'Card sets, WAiNK locations, vehicles, areas and garage properties. Wander the map with the steppers ticking — nothing here is missable.',
  },
  {
    id: 4,
    title: 'Stage 4 — Activities, races & grinds',
    blurb: 'Stunts, races, shooting range golds, challenges, robberies and the money grinds. The long middle of the platinum: chip away at the counters between story beats.',
  },
  {
    id: 5,
    title: 'Stage 5 — Cleanup: the road to 100%',
    blurb: 'The vague moment trophies, the 500 choices, and A Long Road itself. Finish whatever is left, check the in-game completion stats, and the platinum follows.',
  },
];

export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

/** Fetch the app's own trophy data file (the only fetch the app makes). */
export async function loadTrophies() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`could not load data/trophies.json (${res.status})`);
  const doc = await res.json();
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(trophies) || trophies.length === 0) throw new Error('trophies.json holds no trophies');
  return trophies;
}

/** A trophy counts as story-hidden while the spoiler setting is on and it is unearned. */
export function isSpoilerHidden(trophy, spoilerOn, earned) {
  return spoilerOn && trophy.kind === 'story' && !earned;
}
