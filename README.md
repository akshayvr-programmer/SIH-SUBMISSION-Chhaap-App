<div align="center">

# छाप · Chhaap

**Speak your craft. Reach the country.**

An AI market-linkage app that lets marginalized artisans list, price, and sell their work using nothing but their voice and their own language.

Smart India Hackathon 2026 - PS **SIH26090** - Ministry of Social Justice & Empowerment

---

### 🎬 Product Demo

<video src="submission/DEMO.mp4" width="100%" controls poster="assets/screenshots/demo_thumbnail.png">
  Your browser does not support the video tag. You can <a href="submission/DEMO.mp4">download the demo video here</a>.
</video>

*Watch how Chhaap turns a single photo and a spoken sentence into a published, multi-channel listing.*

</div>

---

## 1. Project Information

| | |
|---|---|
| **Project Title** | Chhaap - AI Market-Linkage for Artisans |
| **PS ID** | SIH26090 |
| **PS Title** | AI-based market linkage and digital enablement for marginalized artisans |
| **Category** | Software |
| **Theme** | Social Empowerment / Digital Inclusion |
| **Ministry** | Ministry of Social Justice & Empowerment |

---

## 2. Problem Statement

Marginalized artisans make some of the finest handcraft in the country, yet most of the margin goes to middlemen. The barriers are not talent, they are digital: to sell online today an artisan needs literacy in English or a dominant language, a smartphone workflow built for the digitally fluent, product photography, copywriting, and a sense of the right market price. A weaver in a village and a buyer in a metro are separated by a wall of forms, not distance.

Existing marketplaces assume the seller can already do all of this. That assumption quietly excludes exactly the people a market-linkage scheme is meant to reach.

---

## 3. Proposed Solution

Chhaap removes the wall by turning the whole listing process into a simple conversation in the artisan's own language.

The artisan takes one photo and speaks. Chhaap handles the rest:

1. **Sees the craft** - an on-device vision model recognizes the craft type and suggests it; the artisan confirms or corrects, so the maker always has the final say.
2. **Cleans the photo** - background removal turns a phone snapshot into a clean catalogue image.
3. **Listens** - the artisan describes the piece by voice, in their language.
4. **Writes the listing** - a language model turns that speech into a polished product listing, returned in the artisan's own language.
5. **Prices it fairly** - the piece is embedded and compared against a reference set to suggest a market-aware price, with a clear cost floor so the artisan never sells below materials plus labor.
6. **Publishes everywhere** - the listing goes out to ONDC, GeM, and WhatsApp, and the artisan watches it reach buyers.

The interface speaks and reads back at every step, making it effortless for artisans who cannot read. Nothing on the artisan-facing path requires typing.

---

## 4. Key Features

- **Voice-first, 12 Indian languages.** Full interface and spoken prompts in Hindi, English, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, and Assamese - 105 translated strings per language.
- **Photo to catalogue image.** Automatic background removal and enhancement from a single phone photo.
- **AI craft recognition with human confirmation.** The model suggests the craft; the artisan decides. The classifier never overrides the maker.
- **Voice-to-listing.** Speech in the artisan's language becomes a structured, sellable listing in that same language.
- **Fair, market-aware pricing.** Similarity-based price suggestion with a transparent cost floor and a confidence signal, helping the artisan understand where the number came from.
- **One-tap multi-channel publish.** ONDC, GeM, and WhatsApp from a single action.
- **Reach view and shareable ad creative.** The artisan sees where the listing traveled and can share a ready-made poster with a QR code straight to WhatsApp or Instagram.

---

## 5. Technology Stack

**Frontend** - React Native (Expo). Voice capture, on-device recording, text-to-speech, custom typography, and view-to-image sharing.

**Backend** - Python, FastAPI, uvicorn. Containerized with Docker; PostgreSQL for persistence.

**Machine Learning**
- Vision - SigLIP image embeddings for craft classification and price comparables.
- Background removal - rembg (ONNX Runtime, GPU-accelerated).
- Speech-to-text - Whisper (faster-whisper), GPU inference.
- Listing generation - Anthropic Claude.

**Localization** - Custom i18n layer across 12 languages, with a graceful fallback chain and locale-aware speech.

---

## 6. Architecture

See [docs/architecture.md](docs/architecture.md) for the full diagram and data flow.
