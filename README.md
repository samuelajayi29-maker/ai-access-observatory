# AI Access Observatory

A daily, country-level record of how artificial intelligence is changing jobs, access and infrastructure in Africa. Sourced, open and independent. A product of [Astrolabe Africa](https://astrolabe.africa) (Astrolabe Data).

**Live:** https://samuelajayi29-maker.github.io/ai-access-observatory/

## The three dimensions

- **Jobs** (`jobs.html`) — how AI is changing employment, digital work and economic opportunity
- **Access** (`access.html`) — whether individuals and businesses can afford and use AI technologies
- **Infrastructure** (`infra.html`) — data centres, compute, connectivity and the ground beneath the AI economy

Each dimension page pairs a long-form essay with its live, source-linked feed. The homepage (`index.html`) carries the product story and the full three-column tracker.

## Data

The public download is an Excel workbook: [`data/ai-access-observatory.xlsx`](data/ai-access-observatory.xlsx) — one sheet per dimension plus an "All items" sheet and an "About" sheet carrying totals, definitions, sourcing and attribution.

Machine-readable mirrors, kept in sync each run:

- `data/items.json` (canonical, what the site renders from)
- `data/items.csv`

Item schema: `{t: title, u: url, s: source, d: date label, dot: category}`. Pages render the feed client-side from the JSON; counts, ordering (newest first, year-aware dates) and the See-more cap are computed, never hand-edited.

## Update pipeline

A daily cron (Hermes, 08:00 WAT) searches the web for new items in each dimension, then runs `C:/Users/USER/AppData/Local/hermes/scripts/update_tracker.py` (v5, workbook builder in `xlsx_build.py`). The updater:

1. fetches the canonical `data/items.json`
2. merges the new items, dedupes by URL, sorts newest-first
3. pushes `data/items.json`, `data/items.csv` and the Excel workbook in a single commit (Git Data API)

Empty stdin = normalization-only run; nothing is pushed when nothing changed.

## History

The previous bucket-style design is preserved at the `legacy-2026-09` tag. Design iterations are staged in `samuelajayi29-maker/astrolabe-observatory-preview` (frozen staging snapshot of the Sep 2026 relaunch).
