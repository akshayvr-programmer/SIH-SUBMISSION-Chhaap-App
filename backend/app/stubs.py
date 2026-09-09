"""Realistic fixtures.

Every endpoint returns these until the real implementation lands behind it.
The shapes here are the shapes the mobile clients will see in production, so
M1 and M2 can build the entire UI before any model exists.

Swap order (owner: role 3/4/5):
    day 2  vision.enhance      -> real segmenter
    day 3  listing.transcribe  -> whisper, then bhashini
    day 3  listing.generate    -> LLM + RAG
    day 4  vision.classify     -> SigLIP linear probe
    day 4  pricing.estimate    -> pgvector kNN + cost floor
    day 5  publish.*           -> real exporters
"""

from datetime import datetime, timedelta, timezone

from .schemas import (
    Comparable,
    CostFloor,
    CraftCandidate,
    ListingCopy,
    Seasonality,
)

CDN = "https://stub.chhaap.local/media"


CRAFT_CANDIDATES = [
    CraftCandidate(
        craft="Ajrakh block print",
        confidence=0.91,
        region="Kutch, Gujarat",
        gi_tag=True,
        gi_registration="GI 178",
    ),
    CraftCandidate(
        craft="Bagru hand block print",
        confidence=0.06,
        region="Bagru, Rajasthan",
        gi_tag=True,
        gi_registration="GI 465",
    ),
    CraftCandidate(
        craft="Dabu mud resist print",
        confidence=0.03,
        region="Akola, Rajasthan",
        gi_tag=False,
    ),
]


LISTING_EN = ListingCopy(
    title="Hand block printed Ajrakh cotton dupatta, natural indigo and madder",
    bullets=[
        "Printed by hand using carved teak blocks, sixteen stages start to finish",
        "Natural dyes only: indigo, madder root, pomegranate rind, iron",
        "Pure cotton, 220 x 110 cm, soft and breathable, gets better with washing",
        "Registered Geographical Indication craft from Kutch, Gujarat",
        "Small colour and alignment variations are the mark of hand printing",
    ],
    story=(
        "Ajrakh printing has been practised in Kutch for over four centuries, "
        "passed through families of the Khatri community. Each piece passes "
        "through sixteen separate stages of washing, resist printing and natural "
        "dyeing, with the cloth returning to the dye vat again and again over "
        "several weeks."
    ),
)

LISTING_HI = ListingCopy(
    title="हाथ से छपी अजरख सूती दुपट्टा, प्राकृतिक नील और मजीठ रंग",
    bullets=[
        "सागौन की नक्काशीदार लकड़ी के ठप्पों से हाथ की छपाई, सोलह चरणों में तैयार",
        "केवल प्राकृतिक रंग: नील, मजीठ की जड़, अनार का छिलका, लोहा",
        "शुद्ध सूती कपड़ा, 220 x 110 सेमी, मुलायम और हवादार",
        "कच्छ, गुजरात की जीआई पंजीकृत पारंपरिक कला",
        "रंग और छपाई में हल्का अंतर हस्तनिर्मित होने की पहचान है",
    ],
    story=(
        "अजरख छपाई कच्छ में चार सौ वर्षों से अधिक समय से की जा रही है, जो खत्री "
        "समुदाय की पीढ़ियों से चली आ रही है। हर कपड़ा धुलाई, छपाई और प्राकृतिक "
        "रंगाई के सोलह अलग-अलग चरणों से गुजरता है।"
    ),
)

KEYWORDS = [
    "ajrakh dupatta",
    "hand block print",
    "natural dye cotton",
    "kutch handicraft",
    "gi tagged textile",
    "indigo dupatta",
    "handmade indian scarf",
]

GROUNDED_ON = [
    "glossary:ajrakh:process:sixteen-stage-resist",
    "gi-registry:178:Kachchh Ajrakh:Gujarat:textiles",
    "glossary:natural-dyes:madder-indigo-pomegranate",
]


COMPARABLES = [
    Comparable(title="Ajrakh hand block print cotton dupatta, natural dye",
               price_inr=2150, craft="Ajrakh block print", source="Etsy",
               url="https://example.invalid/1", similarity=0.94),
    Comparable(title="Kutch Ajrakh dupatta, indigo and madder, pure cotton",
               price_inr=1899, craft="Ajrakh block print", source="ONDC",
               url="https://example.invalid/2", similarity=0.92),
    Comparable(title="Handloom cotton Ajrakh stole, vegetable dyed",
               price_inr=1740, craft="Ajrakh block print", source="GeM",
               url="https://example.invalid/3", similarity=0.89),
    Comparable(title="Traditional Ajrakh print dupatta from Bhuj",
               price_inr=1650, craft="Ajrakh block print", source="ONDC",
               url="https://example.invalid/4", similarity=0.87),
    Comparable(title="Natural dye block print cotton dupatta, 2.2m",
               price_inr=2280, craft="Ajrakh block print", source="Etsy",
               url="https://example.invalid/5", similarity=0.85),
    Comparable(title="Ajrakh cotton dupatta, hand printed, Kutch",
               price_inr=1595, craft="Ajrakh block print", source="GeM",
               url="https://example.invalid/6", similarity=0.83),
    Comparable(title="Indigo block printed cotton scarf, artisan made",
               price_inr=1420, craft="Bagru hand block print", source="ONDC",
               url="https://example.invalid/7", similarity=0.78),
]

COST_FLOOR = CostFloor(
    material_inr=430,
    labour_hours=14.0,
    wage_rate_inr_per_hour=52,
    wage_basis="Gujarat scheduled employment minimum wage, skilled, 2026",
    overhead_inr=82,
    total_inr=1240,
)

SEASONALITY = Seasonality(
    window="Diwali",
    multiplier=1.18,
    applies_until=(datetime.now(timezone.utc) + timedelta(days=52)).date().isoformat(),
)

PRICE_EXPLANATION = (
    "Seven comparable Ajrakh dupattas are listed between Rs 1,420 and Rs 2,280. "
    "Your cost floor is Rs 1,240 (material Rs 430, 14 hours of labour at the "
    "Gujarat skilled minimum wage, plus overhead). The recommended price sits "
    "at the median of close comparables, lifted 18 percent for the Diwali window."
)
