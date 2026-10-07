# History and context audit — 7 October 2026

## What the previous build already held

The economy entry already contained unemployment, youth unemployment, labour-force
participation, GDP growth, GDP per capita and inflation, with annual 2019–2025 data.
These are extended under the same measure IDs, not introduced as six new measures.
Country-context electricity access and internet use are also existing measures;
their latest values now use the same pinned historical source as the Explorer.

## What now has genuine history

| Collection | Observation window | Interpretation |
| --- | --- | --- |
| Ten World Bank WDI series | All available annual observations within 1960–2025 | Individual indicators/countries start later; missing years remain null. Includes the six existing economic measures, electricity access, internet use, manufacturing value added and labour productivity. |
| EIA electricity generating capacity | 1980–2024 | Country-reported capacity; source flags retained. Million kW multiplied by 1,000 gives MW. Not generation, consumption or spare grid capacity. |
| Eskom Homelight 20A and 60A | April 2025 and April 2026 tariffs | Two residential tariff classes, South Africa only. ZAR/kWh including VAT. Each observation retains its effective dates and source page. Not a national average. |
| Microsoft AI diffusion estimates | H1 and H2 2025 | The existing two columns in the January 2026 report use one stated methodology. Vendor estimates, not a population survey. Both existing dataset links expose this short history. |
| Egypt mobile-phone production | 2024 and 2025 | Two existing ministerial figures reported by trade media. The 2025 figure is approximate; production scope is not fully defined. Forecast production is excluded. |
| Kenya smartphone connections | March and June 2026 | Two existing regulatory figures reported by trade media. Connections are not unique people. Other device types are separate measures, not extra time points. |

WDI metadata are saved with each series. ILO estimates and GDP-per-worker estimates
retain modelled status. Productivity is GDP per person employed in **constant 2021
PPP dollars**. Manufacturing is value added as a percentage of GDP, not industrial
capacity utilisation. All context measures remain outside the AI headline counts.

## What is still snapshot-only

- Task-share and employment-weighted AI exposure: single-vintage academic studies.
  Publishing the same study again does not create another observation.
- Facility directory: one pinned 5 October 2026 edition. Directory counts and
  listed operational status are not a historical census.
- Project capacity and capex: a mixed-date register of projects and statuses.
  Announcement dates are not repeated national measurements. Changes of project
  scope/status need a future event history with stable project identities.
- Pnet AI vacancy growth: one reported comparison period. A percentage change
  cannot reconstruct the missing underlying vacancy counts.
- Survey adoption measures: different questions/samples are not joined into one
  trend. ITU cost baskets changed definition in 2025; older baskets are not spliced
  to the 2025 values without a separate methodology review.
- API/device/subscription prices: need repeated observations of the same product,
  tariff, currency and workload definition. Price-change events are not an
  absolute-price series and may describe different products or future prices.

## Retained release audit

Inspected the local source repository history through commit `27fae0b8`, its
retained CSV versions, the current `releases.json`, and the structured correction
log. Details and file hashes are in `retained-release-audit.json`.

- Model-price CSV: one retained version.
- Subscription CSV: one retained version.
- Device-price CSV: two versions. The September 26 changes correct citations,
  dates and evidence classifications for the same measurements. They do not
  supply a second retail-price observation.
- Seven retained manifest versions describe builds, not seven observation periods.
- The correction log records additions, removals and old/new field values. It is
  audit history, not a verified chronological measurement series.
- `_ref_build` and the old sandbox are reconstruction copies, not a monthly data
  archive. Neither was modified. Unfetched remote history was not examined.

No genuine monthly price series was recoverable from these retained source
versions. Future releases should append dated observations with stable identities
and separate correction records; snapshots alone must not become flat trend lines.

## Source searches and negative findings

- World Bank indicator metadata and annual API: full available back-series found
  for all ten selected indicators. API requests include all 54 African ISO3 codes,
  1960–2025, and explicit null records. Nulls before national/source coverage begins
  are not imputed. This is one current vintage, not mixed historical API vintages.
- EIA International Energy Statistics annual API: full 1980–2024 capacity series
  found using electricity product 2, capacity activity 7, unit MK. Source estimates,
  flags, country-boundary changes and revisions remain relevant. The API does not
  justify treating the result as dependable capacity or electricity available to AI.
- IRENA renewable capacity was considered but not substituted for total capacity.
- Eskom tariff history and 2025/26 and 2026/27 books: comparable flat Homelight
  rates found. The 2025 book explicitly removes the previous inclining-block
  structure. Earlier books exist but were not connected to the flat-rate series.
- Kenya EPRA statistics and tariff-control pages: relevant sources found, but the
  report retrieval failed and no current, fully specified all-in tariff was verified
  in this collection. No Kenyan price was imported.
- No comparable price was collected for the other 53 countries. This does not mean
  no source exists: coverage research is incomplete. Commercial/industrial prices,
  variable fuel/FX adjustments, taxes and fixed charges need separate collection.
- GlobalPetrolPrices was a candidate; bulk reuse terms and equivalent tariff scope
  were not established, so its figures were not imported.
- Microsoft January 2026 AI diffusion report: verified that the report itself
  compares its two 2025 half-year estimates. No earlier comparable country series
  is claimed by this upgrade.

## Provenance and revisions

Each compact point inherits the source URL, evidence status, tier, retrieval date,
snapshot path/hash, definition and revision note of its series. Explicit point
overrides retain tariff editions, validity dates, evidence flags and original
units. CSV/SVG exports expand these fields for each selected point. A saved raw
snapshot is not represented as a Wayback capture. Tariff PDFs are retained locally;
the original publisher URLs and their hashes are available in the public metadata.

WDI and EIA can revise historical values. The collection uses a single vintage for
each source and flags this on the charts. It does not claim to have identified
every country-specific methodological break. Source definitions remain available.
Eskom's known 2025 tariff-definition break is explicitly excluded from the line.

No capacity-to-generation ratio or electricity-adjusted AI affordability measure
is published. Compatible scopes, operating status, dates, household consumption
and electricity tariff assumptions have not been established.

## Primary sources

- [World Bank indicator API](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392)
- [EIA electricity capacity](https://www.eia.gov/international/data/world/electricity/electricity-capacity)
- [Eskom 2026/27 tariff information](https://www.eskom.co.za/distribution/2026-2027-tariff-increase/)
- [Eskom 2025/26 book](https://www.eskom.co.za/distribution/wp-content/uploads/2026/03/Tariff-booklet2.pdf)
- [Microsoft January 2026 diffusion report](https://www.microsoft.com/en-us/research/wp-content/uploads/2026/01/Microsoft-AI-Diffusion-Report-January-2026.pdf)
