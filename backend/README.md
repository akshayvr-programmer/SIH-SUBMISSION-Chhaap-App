# Chhaap — backend and ML

SIH26090 · AI-Driven Market Linkage and Smart Cataloging for Marginalized Artisans
Ministry of Social Justice and Empowerment · Software · Miscellaneous

---

## For M1 and M2: start here, you are not blocked

```bash
docker compose up
open http://localhost:8000/docs
```

Nine endpoints. Every one of them returns production-shaped data right now.
Build the entire app against these. Nothing you write today gets thrown away
when the real models land, because **the response shapes are frozen**.

If you cannot run Docker, `openapi.json` in this repo generates a client
directly:

```bash
npx @openapitools/openapi-generator-cli generate -i openapi.json -g dart-dio -o ./api      # Flutter
npx openapi-typescript openapi.json -o ./src/api/schema.ts                                  # React Native
```

### The nine

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | liveness |
| POST | `/v1/vision/enhance` | cut out, relight, standardise a photo |
| POST | `/v1/vision/classify` | identify the craft, flag a registered GI |
| POST | `/v1/listing/transcribe` | voice note to text, source language + English |
| POST | `/v1/listing/generate` | grounded listing copy in English and Hindi |
| POST | `/v1/pricing/estimate` | price band, cost floor, and the comparables behind it |
| POST | `/v1/publish/{channel}` | ondc, gem, whatsapp, or microsite |
| POST | `/v1/sync/outbox` | accept a batch created offline, idempotent on `client_id` |
| GET | `/v1/jobs/{job_id}` | enrichment progress after a sync |

### Two contract rules the UI has to honour

1. **Never render `recommended_inr` without `comparables` and `cost_floor` on
   the same screen.** The evidence is the feature. A bare number is the thing
   that loses this problem statement.
2. **When `confidence` is `floor_only`, `comparables` is empty.** Present the
   number as a production cost floor, labelled as such, not as a market price.
   Say what is missing rather than hiding it.

### Offline boundary

The phone owns capture, cutout, relight, and the outbox queue. Those work with
no signal. Description, pricing, and publishing need the network and go through
the outbox when it returns. Do not promise more offline than this; the honest
version is already the strongest demo in the room.

---

## For roles 3, 4, 5: the swap order

Replace handler bodies in place. Do not touch `schemas.py`.

| Day | Endpoint | Replace stub with |
|---|---|---|
| 2 | `vision/enhance` | quantized U²-Netp / ISNet ONNX + OpenCV relight |
| 3 | `listing/transcribe` | faster-whisper, then Bhashini when the key lands |
| 3 | `listing/generate` | LLM + RAG over `craft_knowledge` |
| 4 | `vision/classify` | SigLIP embedding + linear probe, 20 classes |
| 4 | `pricing/estimate` | pgvector kNN + `wage_floors` cost model |
| 5 | `publish/*` | Beckn catalog JSON, GeM CSV, QR microsite |

One embedding model serves both `vision/classify` and the pricing kNN. Load it
once. That is the shortcut that makes three roles fit in one person.

### Start the corpus tonight

`comparables` is the only table that gets better while you sleep. Ingestion is
IO-bound and unattended. Sources in priority order: GeM open catalog, ONDC
network data, the Etsy official API, EPCH and DC-Handicrafts price references,
then a hand-curated seed of 200 rows you enter yourself so the demo craft is
never thin. Respect robots.txt and published API terms; a corpus you can name
the provenance of is also the corpus you can defend on stage.

Target before day four: 5,000 rows total, 300+ on your demo craft.

### Wage floors are not optional

`cost_floor` is what makes the price defensible when comparables are thin. Seed
`wage_floors` from published state scheduled-employment minimum wage
notifications and keep the `basis` string accurate. When a judge asks where the
labour rate comes from, you read the citation off the screen.
