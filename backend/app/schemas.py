"""Frozen API contract for Chhaap (SIH26090).

These schemas are the interface between the mobile clients (M1, M2) and the
backend (B). Once handed over, changing a field name here costs someone else
a rebuild. Add fields freely; rename or remove nothing.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------
# enums
# --------------------------------------------------------------------------

class Language(str, Enum):
    """Languages the app accepts for voice input and emits for listings."""
    en = "en"
    hi = "hi"
    bn = "bn"
    gu = "gu"
    kn = "kn"
    ml = "ml"
    mr = "mr"
    or_ = "or"
    pa = "pa"
    ta = "ta"
    te = "te"
    ur = "ur"


class Channel(str, Enum):
    ondc = "ondc"
    gem = "gem"
    whatsapp = "whatsapp"
    microsite = "microsite"


class JobState(str, Enum):
    queued = "queued"
    running = "running"
    done = "done"
    failed = "failed"


class PriceConfidence(str, Enum):
    """How much evidence sits behind a price band.

    strong  -> 7+ close comparables
    fair    -> 3-6 comparables
    floor_only -> under 3 comparables; only the cost floor is shown, and the
                  UI must label it as a floor rather than a market price.
    """
    strong = "strong"
    fair = "fair"
    floor_only = "floor_only"


# --------------------------------------------------------------------------
# vision
# --------------------------------------------------------------------------

class EnhanceResult(BaseModel):
    product_id: str
    original_url: str
    enhanced_url: str
    mask_url: Optional[str] = None
    background: str = Field("white", description="white | transparent | scene")
    ms_elapsed: int
    on_device: bool = Field(
        False,
        description="True when the client did this locally and is only reporting it.",
    )


class CraftCandidate(BaseModel):
    craft: str = Field(..., examples=["Ajrakh block print"])
    confidence: float = Field(..., ge=0, le=1)
    region: Optional[str] = Field(None, examples=["Kutch, Gujarat"])
    gi_tag: bool = Field(False, description="Registered Geographical Indication.")
    gi_registration: Optional[str] = Field(None, examples=["GI 178"])


class ClassifyResult(BaseModel):
    product_id: str
    candidates: list[CraftCandidate]
    ms_elapsed: int


# --------------------------------------------------------------------------
# language
# --------------------------------------------------------------------------

class TranscribeResult(BaseModel):
    product_id: str
    source_language: Language
    transcript: str
    transcript_en: str
    engine: str = Field(..., description="bhashini | whisper")
    ms_elapsed: int


class ListingRequest(BaseModel):
    product_id: str
    transcript: str
    source_language: Language = Language.hi
    craft: Optional[str] = None
    material: Optional[str] = None
    dimensions_cm: Optional[str] = Field(None, examples=["220 x 110"])


class ListingCopy(BaseModel):
    title: str
    bullets: list[str]
    story: str = Field(..., description="Provenance paragraph. Sells the premium.")


class ListingResult(BaseModel):
    product_id: str
    en: ListingCopy
    hi: ListingCopy
    source: Optional[ListingCopy] = Field(
        None, description="Copy in the artisan's own language, when not hi or en."
    )
    keywords: list[str]
    grounded_on: list[str] = Field(
        default_factory=list,
        description="Glossary and GI-registry entries retrieved for this listing. "
                    "Shown in the UI so the description is never an unsourced claim.",
    )


# --------------------------------------------------------------------------
# pricing  — the part that has to survive questioning
# --------------------------------------------------------------------------

class Comparable(BaseModel):
    title: str
    price_inr: int
    craft: str
    source: str = Field(..., examples=["GeM", "ONDC", "Etsy"])
    url: Optional[str] = None
    similarity: float = Field(..., ge=0, le=1)


class CostFloor(BaseModel):
    material_inr: int
    labour_hours: float
    wage_rate_inr_per_hour: int
    wage_basis: str = Field(
        ..., examples=["Gujarat scheduled employment minimum wage, skilled, 2026"]
    )
    overhead_inr: int
    total_inr: int


class Seasonality(BaseModel):
    window: str = Field(..., examples=["Diwali"])
    multiplier: float = Field(..., examples=[1.18])
    applies_until: Optional[str] = None


class PricingRequest(BaseModel):
    product_id: str
    craft: Optional[str] = None
    material: Optional[str] = None
    dimensions_cm: Optional[str] = None
    labour_hours: Optional[float] = None
    state: Optional[str] = Field(None, examples=["Gujarat"])


class PricingResult(BaseModel):
    product_id: str
    recommended_inr: int
    band_low_inr: int
    band_high_inr: int
    confidence: PriceConfidence
    cost_floor: CostFloor
    seasonality: Optional[Seasonality] = None
    comparables: list[Comparable] = Field(
        ..., description="Never empty unless confidence is floor_only. "
                         "The UI must render these on the same screen as the price."
    )
    explanation: str


# --------------------------------------------------------------------------
# publishing
# --------------------------------------------------------------------------

class PublishResult(BaseModel):
    product_id: str
    channel: Channel
    payload_url: str = Field(..., description="The generated catalog artifact.")
    public_url: Optional[str] = None
    qr_url: Optional[str] = None
    published_at: datetime


# --------------------------------------------------------------------------
# offline sync
# --------------------------------------------------------------------------

class OutboxItem(BaseModel):
    client_id: str = Field(..., description="UUID minted on the phone while offline.")
    created_at: datetime
    craft: Optional[str] = None
    transcript: Optional[str] = None
    source_language: Language = Language.hi
    image_sha256: str
    enhanced_on_device: bool = True


class OutboxRequest(BaseModel):
    artisan_id: str
    items: list[OutboxItem]


class SyncedItem(BaseModel):
    client_id: str
    product_id: str
    job_id: str = Field(..., description="Poll /v1/jobs/{job_id} for enrichment.")


class OutboxResult(BaseModel):
    accepted: list[SyncedItem]
    rejected: list[str] = Field(default_factory=list)


# --------------------------------------------------------------------------
# jobs
# --------------------------------------------------------------------------

class Job(BaseModel):
    job_id: str
    state: JobState
    progress: float = Field(0.0, ge=0, le=1)
    result_url: Optional[str] = None
    error: Optional[str] = None
