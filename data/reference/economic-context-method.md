# Country economic context

Retrieved 6 October 2026 from World Bank World Development Indicators and its
originating agencies. Six separate indicators cover unemployment, youth
unemployment, labour force participation, real GDP growth, GDP per capita and
consumer price inflation. The observation window is 2019–2025, not a live feed.

Labour series use ILO modelled estimates. National reported unemployment and ILO
modelled estimates must not be silently mixed. Youth is ages 15–24; participation
uses population ages 15+. GDP per capita is current USD, not personal earnings.

The dated API snapshot is economic-context.json. The collector preserves missing
values, source update dates and query URLs. The builder writes one shared CSV,
six latest-available measures and six annual series. Country profiles use those
catalogue values and show both endpoint years for each change. Percentage-rate
differences are percentage points. Missing years are never interpolated. Country
comparisons should select a common year; latest values may have different years.

No macroeconomic change is attributed to AI. Existing AI exposure, adoption and
vacancy evidence remains distinct. Only South Africa currently has numerical
AI vacancy evidence in the curated register (Pnet). No activity count is invented
for other countries. News signals are not vacancies, and adverts are not hires.

Refresh with collect_economy.py only when intentionally reviewing a new snapshot.
It caches the raw API responses under data/reference/economy-api; archive or replace
those dated inputs explicitly before a new refresh. It is not called by daily builds.
World Bank API: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392
Licensing: https://datacatalog.worldbank.org/public-licenses
