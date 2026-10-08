# Data centre directory

Added 6 October 2026. Source: Data Landscapers, Corpus data-centres edition
2026-10-05-2, https://corpus.data-landscapers.io/datasets/data-centres/.
Licence: CC BY 4.0, https://creativecommons.org/licenses/by/4.0/.
Copyright/attribution: Data Landscapers Ltd. InferenceAfrica selected fields,
adapted presentation and calculated country counts. No endorsement implied.

The original dated CSV is preserved as data-centres-corpus-2026-10-05.csv.
`facility_directory.py` generates the public directory and country-count series.
Every surface uses those same records. Changes must be made to a versioned source
snapshot or a reviewed correction layer, not generated HTML or CSV.

## Counting rule

Count distinct source facility IDs within each country. “Listed” includes all
six source statuses; “listed as operational” filters exactly Operational.
Zero operational listings is a directory count, never a claim that the country
has no operating facilities. An absent country returns null. All 54 countries
are represented in this source edition. The source mixes commercial, government,
enterprise, research and other facilities. It is not comparable to ADCA's
continental estimate and must not replace the homepage capacity-share metric.

The 578 source records contain no duplicated IDs or exact country/name pairs.
This is a structural audit, not verification of 578 facilities. Repeated
coordinates are retained and logged: buildings may share a campus, and approximate
coordinates may coincide. No inferred merging or splitting is performed.
Semantic duplicates and campus boundaries require source-by-source research.
All imported rows are labelled source-reported, independent review pending, and
headline-ineligible. The linked source's last_verified date belongs to that source,
not to an independent InferenceAfrica review.

## Locations and capacity

338 listings supply coordinates; 240 do not. Gross outliers outside the supplied
country geometry's bounding rectangle (with a one-degree coastal tolerance) are
withheld from the map pending review; original coordinates remain in the export.
This coarse check does not establish the accuracy of retained coordinates.
Coordinates are displayed
only as unverified source locations, with hollow markers and explicit text.
No city geocoding or invented facility positions are added. City names remain
available for facilities without coordinates. Co-located points overlap; the
searchable list retains every listing.

IT capacity remains the source's textual claim, including ranges/qualifications.
No sum of imported MW is presented. AI/GPU claims are separately labelled as
reported and are not inferred from a facility's existence or cloud connections.

This directory remains separate from infrastructure.json's project pipeline.
They overlap in subject matter and must never be added together. A future crosswalk
requires reviewed facility-to-project links, including expansion/campus boundaries.

## Maintenance

Download a new dated edition manually; record its URL, hash and licence. Review
additions, deletions, renamed IDs, status changes, duplicate candidates and coordinate
changes before promoting it. Update the source constant and edition in the builder,
record the revision, rebuild all pages and cards, and run the existing validator.
There is no automatic import during the daily tracker build.

Priorities for independent research: resolve repeated campus coordinates, confirm
operating status using operator/regulator evidence, and verify facility-level
coordinates. Keep pending facts labelled. No record from a restricted commercial
directory has been directly scraped by this integration.

Facility stage is published as `facility_stage`; `status` is a backward-compatible alias of that field, not evidence status. `evidence_status=third_party_unverified` and `temporal_status=source_reported` do not claim a facility has been independently checked. The singular source_url points to the directory edition; original source_urls remain available for review.
