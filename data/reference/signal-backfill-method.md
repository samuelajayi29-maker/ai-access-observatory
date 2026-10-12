# Historical signal review: 11 July–11 October 2026

Reviewed on 11–12 October 2026. This is a search for missed signals outside
Nigeria, South Africa, Kenya and Egypt, the four largest country headline counts
in the retained feed. Multi-country sources still retain those countries where
they are explicitly part of the source's scope.

## What this adds

Twenty-eight source-reviewed signals. Each carries the publisher, source URL,
publication date, event date where stated, explicitly supported countries,
delivery or policy stage, review date and limitations. English headlines are
editorial summaries, not quotations. Source review means the supporting page
was read; it does not independently establish every external claim.

The signals cover training, proposed courses, policy preparation, reported pilots,
public-service tools and a publication on local compute infrastructure. No
numeric observations, AI employment totals, national adoption rates, data-centre
counts or headline indicators were created from them.

## Search and selection

The deeper pass ran 150 discovery queries: Jobs, Access and Infrastructure for
each of the 50 countries outside the four largest headline counts. Results were
screened and selected candidate sources opened. Nine further signals passed the
publication-date, evidence and event-deduplication checks. This is not a claim
that every discovery link was verified. The local research report retains a
country review matrix, query logs and unresolved leads for Hermes.

English, French, Portuguese and Arabic queries sought AI training and workforce
activity, AI use and access, policies, compute and data-centre developments.
Date-filtered searches were followed by opening candidate pages: the visible
publication date and body took precedence over search-engine timestamps.
Undated pages, older stories resurfacing in search, generic conference listings,
unreadable sources and announcements with unclear dates were not accepted.
The window is based on publication date. Event dates remain separate.

Candidate URLs were compared with the retained tracker. Closely related
headlines were inspected for the same event: the Lesotho blueprint workshop and
Cybastion's proposed Douala facility were already covered and were excluded.
Algeria's 21 September third implementation meeting is a dated follow-up to
earlier committee-creation and roadmap stories, not a new AI strategy.

The UNDP compute publication covers six countries and is retained as one report,
not six new facilities. Its report summary was read; country-level technical
specifications require further extraction from the full report. CIPIT's publisher
description establishes a policy report's scope, not independent confirmation of
every policy in it.

## Country roles and missing information

Country tags may identify the host, subject, participant origin or report scope.
The note attached to each signal explains these distinctions. In the Benin
summer-school story, participants' countries of origin do not each receive 190
trainees. In the Mauritius story, visiting delegates do not establish deployments
in their home parliaments. Regional meetings are not assigned to every member state.

The search is not an exhaustive census. No accepted result means **No information
in reviewed sources**, not that no activity occurred. Pending leads and countries
without an accepted result remain in the research backlog; no placeholder stories
or fabricated figures are inserted into the feed.

## Maintenance and downloads

`data/reference/signal-backfill.json` is the reviewed input. `signal_catalog.py`
combines it with the tracker at build time. It never modifies the tracker's
`items.json`, `items.csv` or workbook. `data/signals.json` and `data/signals.csv`
are the combined downloads. The original tracker downloads retain their original
scope and exclude this supplement. Review queue, pillar feeds, country signal
counts and Data Explorer signal counts use the combined feed.

The review decision `context_only` means a source was read and accepted as a
qualified signal, but no numerical observation was promoted to the registers.
It does not mean independent verification of the source's claims. Preprints
remain labelled research, including the shiKomori assistant prototype.

If Hermes later ingests the same normalized URL, the reviewed metadata attaches
to that entry instead of adding another copy. Different URLs for the same future
event still require editorial deduplication. Original tracker duplicates are
retained; headline-entry counts are not counts of distinct events.

Publication order uses the source date, not the date this backfill was collected.
For legacy tracker dates without a year, the snapshot year is used, rolling back
one year if the label would otherwise be in the future. New researched signals
always retain a complete ISO publication date.
