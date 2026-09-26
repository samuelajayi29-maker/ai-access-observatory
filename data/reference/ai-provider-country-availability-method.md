# AI provider country availability: method and limits

**Snapshot retrieved:** 2026-09-25
**Geographic scope:** the Observatory's 54 African countries
**Observation unit:** one country × one named provider product
**Result:** 324 country–product records; all six official lists included all 54 countries on the retrieval date.

The register records only a country appearing on the cited provider's published supported-country or available-region list. We matched each list's country names against the Observatory's 54-country ISO 3166-1 alpha-3 scope and retained separate rows for different products and delivery channels. The regeneration script pins that reviewed country set and stops if the Observatory's geographic scope changes, forcing a new check. The status listed_supported means only that the country appears in that list.

## Product scopes

| Provider | Product scope | Source and interpretation |
| --- | --- | --- |
| OpenAI | ChatGPT web and mobile | OpenAI's ChatGPT supported countries list. It does not establish local payment support, paid-plan availability, or account approval. |
| OpenAI | OpenAI API | OpenAI's separate API supported countries list. API support is not inferred from ChatGPT availability. |
| Anthropic | Claude.ai web and mobile | The Claude.ai section of Anthropic's Supported Regions Policy. |
| Anthropic | Anthropic commercial API | The API section of Anthropic's Supported Regions Policy. API support is not inferred from Claude.ai availability. |
| Google | Gemini web app | Google's Gemini web app supported-country list. Google's help page says mobile-app availability may differ; this row makes no mobile-app claim. |
| Google | Google AI Studio and Gemini API | Google's available-regions list. The page was last updated 2026-04-28 UTC when checked. Account-age and verification requirements can also apply. |

## What this does not measure

A provider's country list is a statement of geographic support, not a test that a person can create an account or use a particular model, feature, plan, payment method, or service at a particular time. It does not measure usage, adoption, affordability, reliability, local hosting, or national AI capacity. Payment and signup evidence from the separate 10-country sample remains separate. AI-workload affordability is reported only where the Observatory has the comparable inputs.

The lists are dynamic. retrieved_at is the date we checked them. Source pages that change may not preserve the exact list shown on that date, so the CSV retains the source URL, source update note, country code, status, and retrieval date. Recheck a provider's current list before using this snapshot to make an account or purchasing decision.

## Sources

- [ChatGPT Supported Countries — OpenAI](https://help.openai.com/en/articles/7947663-chatgpt-supported-countries)
- [OpenAI API supported countries and territories](https://help.openai.com/en/articles/5347006-openai-api-supported-countries-and-territories)
- [Supported Regions Policy — Anthropic](https://www.anthropic.com/supported-countries)
- [Where you can use the Gemini web app — Google](https://support.google.com/gemini/answer/13575153?hl=en)
- [Available regions for Google AI Studio and Gemini API — Google](https://ai.google.dev/gemini-api/docs/available-regions)
