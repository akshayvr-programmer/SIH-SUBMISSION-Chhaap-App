<div align="center">
# छाप · Chhaap

**Speak your craft. Reach the country.**

An AI market-linkage app that lets marginalized artisans list, price, and sell their work using nothing but their voice and their own language.

Smart India Hackathon 2026 · PS **SIH26090** · Ministry of Social Justice & Empowerment

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

Chhaap removes the wall by turning the whole listing process into a conversation in the artisan's own language.

The artisan takes one photo and speaks. Chhaap does the rest:

1. **Sees the craft** - an on-device vision model recognizes the craft type and proposes it; the artisan confirms or corrects, so the human always has the final say.
2. **Cleans the photo** - background removal turns a phone snapshot into a clean catalogue image.
3. **Listens** - the artisan describes the piece by voice, in their language.
4. **Writes the listing** - a language model turns that speech into a polished product listing, returned in the artisan's own language.
5. **Prices it fairly** - the piece is embedded and compared against a reference set to suggest a market-aware price, with a clear cost floor so the artisan never sells below materials plus labour.
6. **Publishes everywhere** - the listing goes out to ONDC, GeM, and WhatsApp, and the artisan watches it reach buyers.

The interface speaks and reads back at every step, so it works for an artisan who cannot read. Nothing on the artisan-facing path requires typing.

---

## 4. Key Features

- **Voice-first, 12 Indian languages.** Full interface and spoken prompts in Hindi, English, Bengali, Marathi, Telugu, Tamil, Gujarati, Kannada, Malayalam, Punjabi, Odia, and Assamese - 105 translated strings per language.
- **Photo to catalogue image.** Automatic background removal and enhancement from a single phone photo.
- **AI craft recognition with human confirmation.** The model proposes the craft; the artisan decides. The classifier never overrides the maker.
- **Voice-to-listing.** Speech in the artisan's language becomes a structured, sellable listing in that same language.
- **Fair, market-aware pricing.** Similarity-based price suggestion with a transparent cost floor and a confidence signal, so the artisan understands where the number came from.
- **One-tap multi-channel publish.** ONDC, GeM, and WhatsApp from a single action.
- **Reach view and shareable ad creative.** The artisan sees where the listing travelled and can share a ready-made poster with a QR code straight to WhatsApp or Instagram.

---

## 5. Technology Stack

**Frontend** - React Native (Expo). Voice capture, on-device recording, text-to-speech, custom typography, and view-to-image sharing.

**Backend** - Python, FastAPI, uvicorn. Containerized with Docker; PostgreSQL for persistence.

**Machine Learning**

- Vision - SigLIP image embeddings for craft classification and price comparables.
- Background removal - rembg (ONNX Runtime, GPU-accelerated).
- Speech-to-text - Whisper (faster-whisper), GPU inference.
- Listing generation - Anthropic Claude.

**Localization** - Custom i18n layer, 12 languages, with a graceful fallback chain and locale-aware speech.

---

## 6. Architecture

See [docs/architecture.md](docs/architecture.md) for the full diagram and data flow.

```text
                 Artisan (voice + one photo)
                          |
                 React Native App (Expo)
             12-language voice UI, capture, TTS
                          |
                     FastAPI backend
                          |
     +---------+----------+----------+-----------+
     |         |          |          |           |
   Vision   Background  Speech->   Listing     Pricing
  (SigLIP)   removal     text     (Claude)   (embeddings
             (rembg)   (Whisper)              + cost floor)
     |         |          |          |           |
     +---------+----------+----------+-----------+
                          |
                    PostgreSQL
                          |
              Publish to ONDC / GeM / WhatsApp
```

---

## 7. Repository Structure

```text
chhaap/
├── README.md                 # this file
├── SUBMISSION_GUIDE.md        # how this repo maps to the SIH template
├── submission/
│   ├── PRESENTATION.md        # link + summary of the final PPT
│   └── DEMO.md                # demo video link + run-through script
├── docs/
│   └── architecture.md        # system design, data flow, ML details
├── backend/                   # FastAPI + ML service  (you add this)
├── app/                       # React Native / Expo app (you add this)
├── assets/
│   └── screenshots/           # UI screenshots, demo stills
├── requirements.txt           # backend Python dependencies
├── .gitignore
└── LICENSE
```

---

## 8. Installation

**Prerequisites:** Python 3.10+, Node.js 18+, Docker Desktop, and an Anthropic API key.

**Backend**

```bash
cd backend
pip install -r ../requirements.txt
# start the database
docker compose up -d
# set your key (PowerShell)
$env:ANTHROPIC_API_KEY="your-key-here"
# run the API, bound so a phone on the same network can reach it
python -m uvicorn main:app --host 0.0.0.0 --reload
```

**App**

```bash
cd app
npm install
npx expo start -c
```

Scan the QR code with Expo Go on a phone connected to the same Wi-Fi. If the phone cannot reach the dev server, start with `npx expo start -c --tunnel`.

> On the demo phone, install the text-to-speech voice data for each language you will show: Settings → System → Languages & input → Text-to-speech output → install voice data.

---

## 9. Run (demo boot order)

1. Open Docker Desktop and wait for it to be ready.
2. Start the database container.
3. Set `ANTHROPIC_API_KEY` in the PowerShell window you will run the API from.
4. Start the backend with `--host 0.0.0.0`.
5. Start Expo and open the app on the phone.

---

## 10. Future Scope

- **Learning from artisans.** Every time an artisan confirms or corrects the craft, store that verified example so the classifier gets better over time - a human-in-the-loop flywheel rather than a frozen model.
- **Wider language coverage via Bhashini.** Route languages without a strong speech model (Odia today) through Bhashini for state-backed, ever-improving Indian-language speech.
- **Real channel analytics.** Replace the illustrative reach figures with live data from ONDC and GeM once seller onboarding is complete.
- **Offline-first capture.** Let artisans capture and queue listings without connectivity, syncing when they reach a signal.
- **Logistics and payments.** Close the loop with pickup scheduling and direct-to-artisan settlement.

---

## Note on responsible framing

Reach and channel figures shown in the current build are illustrative, clearly labelled as such in the app, and stand in for analytics that require completed marketplace onboarding. Nothing in this repository contains credentials, API keys, or personal data.

---

<div align="center">
*Every artisan already has a mark. Chhaap helps the country see it.*