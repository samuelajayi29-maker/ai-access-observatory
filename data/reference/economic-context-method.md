# Economic context collection

The existing six measures now use their full available WDI back-series, alongside
manufacturing value added (% GDP) and GDP per person employed (constant 2021 PPP $).
The window is 1960–2025; individual country/indicator coverage begins later.
The current source vintage is retained with original nulls, source metadata and
checksums. ILO labour series and productivity remain modelled. None is a measure
of AI causation. See [the history audit](history-audit.md) for definitions, limits,
known breaks and the results of the retained-release review.

`collect_context_history.py` is the manual collector. It saves source responses;
page builds never fetch new history. Updating a source requires a deliberate new
snapshot/review. `collect_economy.py` is retired: it must not overwrite the full
history. `context_history.py` builds shared latest values, compact history and
expanded CSV exports from pinned sources.
