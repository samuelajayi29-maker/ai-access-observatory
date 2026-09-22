# Candidate indicators for new collection

The record's biggest gap is not presentation, it is coverage: Jobs covers 36 countries, Access
and Infrastructure cover ten. Three dimensions are missing entirely — whether people can
*connect* reliably, whether power is *delivered*, and whether the models actually *work* in
African languages.

Below are the candidates I verified exist and carry country-level data, with what each would
add, its cost, and its risks. Nothing here is collected yet. My recommendation is at the end.

---

## 1. Connectivity — Access and Infrastructure

**ITU, *Measuring digital development: Facts and Figures 2025* and the ITU DataHub**
- Data: country-level mobile broadband coverage, subscriptions per 100 inhabitants, 5G share,
  internet usage, and a published affordability basket (mobile data as a share of income).
- URLs: https://www.itu.int/itu-d/reports/statistics/facts-figures-2025/index/ ·
  https://beta.datahub.itu.int/
- Adds: a connectivity layer for the Access pillar, and an *external* reference for coverage
  the way ADCA's figures already are for capacity. The affordability basket is a useful
  cross-check on our own illustrative-workload method, because it is the measure regulators
  themselves use.
- Cost: **low-medium**. ITU publishes downloadable country series; the main work is matching
  country years and recording definitions.
- Risk: annual cadence, so most countries will be one to two years stale. That is fine if the
  row carries its year — which our schema already forces.

**GSMA, *State of Mobile Internet Connectivity* and the Broadband Commission's *State of
Broadband in Africa***
- Data: the usage gap (people covered by mobile broadband who do not use it), smartphone
  ownership, gender gaps.
- URLs: https://www.gsma.com/ · https://broadband.itu.int/publication/state-of-broadband-in-africa/
- Adds: the distinction between *coverage* and *use*, which is the difference between a
  country having signal and a country having the internet. Nothing in the record captures this.
- Cost: **low**. Mostly PDF tables extracted by hand.
- Risk: GSMA is an industry body, so Tier 3 — it can inform a series but should never headline
  a claim about access without a second source.

## 2. Energy reliability — Infrastructure

**World Bank, *Firms experiencing electrical outages* (IC.ELC.OUTG.ZS) and *Value lost due to
electrical outages* (IC.FRM.OUTG.ZS)**
- Data: percentage of firms experiencing outages, and the share of sales lost to them, by
  country, from Enterprise Surveys.
- URLs: https://data.worldbank.org/indicator/IC.ELC.OUTG.ZS ·
  https://data.worldbank.org/indicator/IC.FRM.OUTG.ZS
- Adds: the constraint that decides whether announced compute can actually run. The record
  already carries the IMF's line that 78% of firms in the region report routine outages;
  this turns that sentence into country rows.
- Cost: **low**. An open API, a stable indicator code, per-country series.
- Risk: survey years vary widely by country (some are a decade old). Every row must carry its
  survey year and be marked accordingly, or the series will mislead.

**IEA / national regulators on electricity access and cost**
- Adds: household access and industrial tariffs, which bear on data centre economics.
- Cost: **medium** — patchy country coverage, no single source.
- Recommendation: defer until the World Bank rows are in place.

## 3. Language capability — Access

**IrokoBench** (Adelani and others, 2024, arXiv:2406.03368) — a human-translated benchmark
covering 16–17 typologically diverse African languages across natural language inference,
mathematical reasoning and knowledge QA.
- URLs: https://arxiv.org/abs/2406.03368 · Hugging Face: masakhane/irokobench
- Adds: the only dimension that answers "does the model work for this language", which is a
  different question from "is it available" and "is it affordable". It would let the Access
  pillar state a capability gap as a number rather than an assertion.
- Cost: **medium-high**. Running the benchmark is a compute and engineering task, not a
  download. The published paper's scores can be recorded as third-party evidence at low cost;
  producing our own scores is a separate project with its own method section.
- Risk: benchmark scores go stale as models change, and a single benchmark is not a verdict.
  If we publish it, it must be labelled as one benchmark's result on named models on a named date.

**Masakhane / AI4D / Lelapa AI corpora and models** — for the African-language model ecosystem.
- Adds: whether African-language capability is being built locally at all (InkubaLM, AfroLLM
  family), which is an infrastructure question as much as a quality one.
- Cost: **medium**, and it needs an inclusion rule before it starts.

---

## What I would do, in order

1. **World Bank outage indicators** — cheapest real gain, turns an existing sentence into
   country rows, fits Infrastructure where coverage is thinnest.
2. **ITU connectivity and affordability** — one source, country-level, and it gives Access a
   second, external affordability measure to check our own method against.
3. **GSMA usage gap** — the coverage-versus-use distinction, at the cost of a PDF.
4. **IrokoBench published scores** — recorded as third-party evidence with the model list and
   date, *not* re-run. Re-running it is a separate decision with a compute budget attached.
5. Defer energy tariffs and the local-model ecosystem until 1–4 are published and the
   country-page gaps have visibly narrowed.

Each of these would arrive as a register with the same fields as everything else — source,
status, date, and a `recompute_from` file — and would be gated by the validator like the rest.
