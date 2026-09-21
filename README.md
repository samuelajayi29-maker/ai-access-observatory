# The Observatory record

A public record of AI's economic effect in Africa, across three series: infrastructure,
access and jobs. Published from this repository as a static site; every chart is a file
with its source and licence inside the image, and every register row carries its source.

Live: https://samuelajayi29-maker.github.io/ai-access-observatory/

## How it is built

    python build_pages.py      # reads data/, writes every page and every chart SVG
    python render_charts.py    # each chart SVG -> PNG at 3x, exact intrinsic size
    python validate.py         # enforces the source rules; exits 1 and blocks the build on failure
    python publish_site.py     # pushes the whole tree in one commit

Data is the source of record: `data/*.json` and `data/*.csv`. Pages are generated, never
hand-edited. `data/items.json` is maintained by the daily tracker job.

## The contract behind every figure

Two orthogonal status fields (`evidence_status` x `temporal_status`), one definition per
metric on the method page, one source per row with an archive snapshot, statuses never
mixed, gaps stated as numbers, derived figures naming their weakest input, and every
derived metric reproducible from the published CSVs. Corrections are logged with the date,
the source and the prior value.

Method and coverage: https://samuelajayi29-maker.github.io/ai-access-observatory/method.html

## Licence

Charts and data are published under Creative Commons Attribution 4.0. Credit reads:
Astrolabe Africa.

Release 2026-09-21. Previous design archived at tag `pre-v2-2026-09`.
