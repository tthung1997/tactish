# Tactish — Teamfight Tactics Companion App

A local web app to help you during Teamfight Tactics games: get real-time comp suggestions from your starting champions and item components, manage your meta comps on a visual hex board, and browse the full Set 17 database.

Built with React 19, TypeScript, Vite, Tailwind CSS, Zustand, and React Router.

## Features

- **Game Assistant**: Select your starting champions and item components to get ranked comp suggestions in real time
- **Comp Manager**: Define and manage your meta team comps with a visual hex board, item assignments, and tier rankings
- **Database**: Browse all Set 17 champions, items (with recipe trees), and traits

## Suggestion Algorithm

Comps are scored using three signals:
1. **Rank** (baseline): S+ = 20 pts down to D- = 1 pt
2. **Champion affinity**: Direct champion matches (weight 3.0) + shared trait overlap (weight 1.0)
3. **Item fit**: How many of your base components can build the comp's needed items (weight 2.0)

`finalScore = rankScore × (1 + champSignal + itemSignal)`

All weights are tunable in the Game Assistant settings panel.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build

## Set Data

Champion, item, and trait data is bundled in `src/data/set17/`. To update for a future set, add a new folder `src/data/set18/` with the same structure and update `src/hooks/useSetData.ts`.
