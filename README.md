# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![Bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/cryptokom-tech/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/cryptokom-tech/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI** (1 platinum, 2 gold, 6 silver, 46 bronze), built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What it is

- **Checklist** of every official trophy with its exact name, official description and grade, saved in the browser (localStorage), with export to JSON and import back.
- **A cited guide for every trophy**, written in our own words from the official descriptions. The game launched the day this was built, so where a place or step is not pinned down by the description, the guide says so instead of inventing it. Each trophy cites its sources beside its guide: Exophase (name, description, grade) and PSNProfiles (PSN count / hidden flag).
- **Filters** by kind (story, missable, collectibles, activities, online — the list has no online trophies, and the app says so), by grade, and by text search.
- **Spoiler setting** (on by default) that hides story trophy names and descriptions until earned.
- **Roadmap to the platinum** in five ordered stages with per-stage progress, built only from the official descriptions.
- **Missables page**: 22 trophies flagged under a stated rule (tied to a specific story mission, moment, or one-time condition), each with its reason.
- **Per-trophy progress steppers** for every counted trophy (250 stunts, 100 WAiNK locations, 100 vehicles, 20 races, 50 challenges, 3 card sets, 8 stranger strands, 10 Scooter Bros registrations, 5 bank vaults, 3 shops, 5 Combat Focus takedowns, $250,000 marked bills, $100,000 spent, 42 shooting-range golds, and more), plus a notes field per trophy and keyboard shortcuts (press `?`).
- **Next-up planner**: your next unearned trophies in roadmap order, missable ones first.
- **Two themes**: a dark "night" look with a coral accent (default) and a light paper theme.
- **Fully offline**: static files, no network requests at run time — the app fetches only its own `data/trophies.json`.

## How to run offline

```sh
node serve.ts
# then open http://localhost:8080
```

Any static file server works with `app/` at its root; `app/index.html` opens in desktop Chrome with the network off. No build step, no dependencies.

## Files

- `app/index.html` — the shell (tabs, toolbar, progress header)
- `app/css/base.css` — night + paper themes, medal swatches
- `app/js/main.js` — boot, routing, shortcuts, `?shot=` staging seeds
- `app/js/data.js` — trophy data loading, roadmap stages
- `app/js/store.js` — localStorage progress, export/import
- `app/js/filters.js` — kind/grade/search/spoiler filtering
- `app/js/views.js` — checklist, detail pane, roadmap, missables, planner
- `app/data/trophies.json` — the 55 official trophies with guides and sources
- `main.ts` — hands the entry in (copies `app/` + `screenshots/`, writes `dossier.json`)
- `screenshots/` — four real renders of the app

## Notes

- Trophy names and descriptions are PlayStation's official list, verified against Exophase and PSNProfiles on 2026-11-19. Hidden flags (28 hidden) follow PSN.
- An unofficial fan guide. Not affiliated with Rockstar Games. No Rockstar logo, artwork, box art or game screenshots are used.
- License: MIT (see `LICENSE`).
