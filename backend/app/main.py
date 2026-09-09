"""Chhaap backend — SIH26090.

Contract-first stub server. Every endpoint returns production-shaped data
today so the mobile clients are never blocked on a model. Replace the body of
each handler in place; do not change the response shape.

Run:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Docs: http://localhost:8000/docs
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import stubs
from .schemas import (
    Channel,
    ClassifyResult,
    EnhanceResult,
    Job,
    JobState,
    Language,
    ListingRequest,
    ListingResult,
    OutboxRequest,
    OutboxResult,
    PriceConfidence,
    PricingRequest,
    PricingResult,
    PublishResult,
    SyncedItem,
    TranscribeResult,
)

app = FastAPI(
    title="Chhaap API",
    version="0.1.0-stub",
    description=(
        "Market linkage and smart cataloging for marginalized artisans. "
        "SIH26090, Ministry of Social Justice and Empowerment.\n\n"
        "**Every response below is stubbed.** Shapes are final; values are not."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _pid() -> str:
    return f"prd_{uuid.uuid4().hex[:12]}"


def _jid() -> str:
    return f"job_{uuid.uuid4().hex[:12]}"


@app.get("/health", tags=["ops"])
def health() -> dict:
    return {"ok": True, "mode": "stub", "ts": datetime.now(timezone.utc).isoformat()}


# --------------------------------------------------------------------------
# vision  (owner: role 3)
# --------------------------------------------------------------------------

@app.post("/v1/vision/enhance", response_model=EnhanceResult, tags=["vision"])
async def enhance(
    image: UploadFile = File(..., description="Raw camera capture, JPEG or PNG."),
    background: str = Form("white"),
    on_device: bool = Form(False),
) -> EnhanceResult:
    """Cut out, relight, and standardise a product photo.

    The phone runs this locally when offline; this endpoint is the online
    mirror and the path for older devices that cannot hold the model.
    """
    pid = _pid()
    return EnhanceResult(
        product_id=pid,
        original_url=f"{stubs.CDN}/{pid}/original.jpg",
        enhanced_url=f"{stubs.CDN}/{pid}/enhanced.jpg",
        mask_url=f"{stubs.CDN}/{pid}/mask.png",
        background=background,
        ms_elapsed=1840,
        on_device=on_device,
    )


@app.post("/v1/vision/classify", response_model=ClassifyResult, tags=["vision"])
async def classify(image: UploadFile = File(...)) -> ClassifyResult:
    """Identify the craft tradition and flag a registered GI where one exists."""
    return ClassifyResult(
        product_id=_pid(),
        candidates=stubs.CRAFT_CANDIDATES,
        ms_elapsed=310,
    )


# --------------------------------------------------------------------------
# language  (owner: role 4)
# --------------------------------------------------------------------------

@app.post("/v1/listing/transcribe", response_model=TranscribeResult, tags=["listing"])
async def transcribe(
    audio: UploadFile = File(..., description="Voice note, wav or m4a."),
    product_id: str = Form(...),
    source_language: Language = Form(Language.hi),
) -> TranscribeResult:
    """Turn an artisan's spoken description into text, in their language and English."""
    return TranscribeResult(
        product_id=product_id,
        source_language=source_language,
        transcript="यह अजरख का दुपट्टा है, हाथ की छपाई, प्राकृतिक नील रंग से रंगा हुआ।",
        transcript_en=(
            "This is an Ajrakh dupatta, hand printed, dyed with natural indigo."
        ),
        engine="whisper",
        ms_elapsed=2100,
    )


@app.post("/v1/listing/generate", response_model=ListingResult, tags=["listing"])
async def generate(req: ListingRequest) -> ListingResult:
    """Write the listing, grounded on the craft glossary and the GI registry."""
    return ListingResult(
        product_id=req.product_id,
        en=stubs.LISTING_EN,
        hi=stubs.LISTING_HI,
        keywords=stubs.KEYWORDS,
        grounded_on=stubs.GROUNDED_ON,
    )


# --------------------------------------------------------------------------
# pricing  (owner: role 4)
# --------------------------------------------------------------------------

@app.post("/v1/pricing/estimate", response_model=PricingResult, tags=["pricing"])
async def estimate(req: PricingRequest) -> PricingResult:
    """Price from evidence: nearest comparables, a cost floor, and a season factor.

    Contract note for the client: when confidence is `floor_only`, `comparables`
    will be empty and the UI must present the number as a floor, not a market
    price. Never render `recommended_inr` without the evidence beside it.
    """
    return PricingResult(
        product_id=req.product_id,
        recommended_inr=1850,
        band_low_inr=1600,
        band_high_inr=2200,
        confidence=PriceConfidence.strong,
        cost_floor=stubs.COST_FLOOR,
        seasonality=stubs.SEASONALITY,
        comparables=stubs.COMPARABLES,
        explanation=stubs.PRICE_EXPLANATION,
    )


# --------------------------------------------------------------------------
# publishing  (owner: role 5)
# --------------------------------------------------------------------------

@app.post("/v1/publish/{channel}", response_model=PublishResult, tags=["publish"])
async def publish(channel: Channel, product_id: str) -> PublishResult:
    """Emit the catalog artifact for one channel.

    ondc      -> Beckn-protocol catalog JSON
    gem       -> GeM bulk upload CSV
    whatsapp  -> WhatsApp Business catalog item
    microsite -> public product page plus QR
    """
    return PublishResult(
        product_id=product_id,
        channel=channel,
        payload_url=f"{stubs.CDN}/{product_id}/{channel.value}.json",
        public_url=f"https://chhaap.local/p/{product_id}",
        qr_url=f"{stubs.CDN}/{product_id}/qr.png",
        published_at=datetime.now(timezone.utc),
    )


# --------------------------------------------------------------------------
# offline sync  (owner: role 5, consumed by role 1)
# --------------------------------------------------------------------------

@app.post("/v1/sync/outbox", response_model=OutboxResult, tags=["sync"])
async def sync_outbox(req: OutboxRequest) -> OutboxResult:
    """Accept a batch of products the phone created while offline.

    Idempotent on `client_id`. Replaying the same batch returns the same
    product ids and does not duplicate rows.
    """
    return OutboxResult(
        accepted=[
            SyncedItem(client_id=item.client_id, product_id=_pid(), job_id=_jid())
            for item in req.items
        ],
        rejected=[],
    )


@app.get("/v1/jobs/{job_id}", response_model=Job, tags=["sync"])
async def job_status(job_id: str) -> Job:
    """Poll enrichment progress for a synced product."""
    return Job(job_id=job_id, state=JobState.done, progress=1.0,
               result_url=f"{stubs.CDN}/jobs/{job_id}.json")
