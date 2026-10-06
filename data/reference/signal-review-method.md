# From signals to reusable evidence

## What is automated

Each page build reviews every entry in the current signal feed for duplicate URLs, links already used by registers, and quantitative research leads. The queue is published as `data/signal-review.csv` and `.json`. These checks are triage, not verification of an article's claims. A source already linked in a register can contain additional facts that have not been extracted.

## What requires a source decision

Read the original release, study or filing. Record the exact measure, denominator, geography, observation period, evidence type, delivery status and source URL. Preserve uncertainty. A forecast, funding target or planned facility does not become an observed outcome, committed capital or operating supply.

Store dated decisions in `data/reference/signal-review-decisions.json`. Store comparable supplementary observations in `data/reference/signal-evidence.json`; promote an observation into a core register only when it fits that register's definition. Never edit the daily feed to add review results. The build places review notes beside relevant headlines and makes supplementary evidence available on the appropriate pillar and country pages.

An excluded or corrected record remains in the decision history. `needs_clarification` means the source was read but its scope or method is insufficient. No information is not zero. The published review queue states precisely which entries have source decisions; the rest remain unverified.

## Review completed on 28 September 2026

All 441 feed entries were triaged; 12 entries received dated source decisions. Added 23 supplementary observations and the Nexus Casablanca planned project. The additions cover GSMA handset affordability/connectivity and Rwanda scenarios; Mastercard Foundation outsourcing estimates; NVIDIA training; KPMG/Orange's Nigeria city smartphone survey; and Cybastion's conditional Senegal financing target.

Important limits: the Nigeria AI-tool percentages are a city smartphone survey, not national population adoption; tool percentages overlap. Its headline national ownership claim was withheld for sampling clarification. The 76% handset-cost figure concerns the poorest fifth of people in sub-Saharan Africa. The Morocco project is planned, not operating. Senegal's USD300m figure is a financing target. An unconfirmed Google Nairobi proposal was removed from the active register and retained in review history; Google's primary release identifies Johannesburg as its first African cloud region.

## Review completed on 6 October 2026

Ten queued signals were read at the source and given dated decisions: eight produced supplementary observations and two were kept pending. The additions cover Kenyan mobile-device connections from regulator statistics; Egypt's reported local mobile-device production, its digital-services export workforce and its export targets; Egypt's Intel AI-training memorandum; Kenya's cumulative Digital Literacy Programme teacher count; Nigeria's announced digital training places; and the price MTN Ghana paid for 5G spectrum.

The limits travel with the observations: device connections are not people or subscribers; a ministerial workforce count with no reference year is not a national employment measure; export figures and training places are targets and announcements, not outcomes; and production volumes, offered places and a spectrum price are not shipments, sales, completions or network capital expenditure.

Two signals stay unresolved because their sources do not support a comparable observation: Nigerian offline-population figures the article does not reconcile, and a Johannesburg facility announcement with no capacity, investment or employment figure. No observation added in this round is headline-eligible, and no core register was changed.

## Chart reuse

Use “Make and share a chart” on a page. Choose one measure, up to 20 records, bar or dot display, ordering and a title. PNG and SVG export the displayed chart, including definition, units, dates, sources and qualifications. CSV retains unrounded values. Never combine different denominators or delivery statuses on one chart.

Shared links reopen a selection from the latest published register. A data revision warning appears if that series has changed. Save SVG/PNG/CSV for a fixed snapshot. The Observatory compilation is CC BY 4.0; underlying source terms still apply.

## Build and maintenance

`build_pages.py` calls `public_resources.py`: it refreshes infrastructure summaries, country indicators, the review queue and chart catalogue, then embeds the same data in pages. `render_charts.py` regenerates PNGs and records the SVG/PNG relationship. `validate.py` checks core source rules, catalogue freshness, country/map indicators, explorer values, CSVs and chart export hashes. Rendering errors stop the daily publisher. Direct publishing also runs validation and rebuilds release checksums before any network write.

If validation normalizes source metadata after a source-status change, rebuild pages and images and validate again. Do not override a stale-data failure. Daily ingestion still owns `items.json`, `items.csv` and the tracker workbook. New signals enter the queue automatically; source verification is deliberately a recorded research step.

Files involved: `public_resources.py`, `js/chart-builder.js`, `kit.py`, `build_pages.py`, `build_indicators.py`, `js/site.js`, `css/style.css`, `render_charts.py`, `validate.py`, `build_manifest.py`, `rebuild_site.py`, `publish_production.py`, and the generated pages/data/chart exports.
