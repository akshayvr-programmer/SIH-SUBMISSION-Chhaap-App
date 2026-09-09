# Architecture

This document describes how Chhaap is put together: the flow a request takes, the machine-learning components, and the decisions behind the design.

## Design principle

Every choice follows one rule: **the artisan should never have to type, read English, or understand the technology.** The interface is voice-first and speaks back at every step. The AI proposes; the artisan decides. Where a model is uncertain or unavailable, the system degrades to something usable rather than failing.

## End-to-end flow

```
Artisan
  | takes one photo, then speaks in their language
  v
React Native App (Expo)
  | language-aware UI, records audio, plays spoken prompts (TTS)
  v
FastAPI backend  ── coordinates the pipeline below ──
  |
  |  1. Vision / classify
  |     photo -> SigLIP embedding -> nearest craft -> proposed craft
  |     (artisan confirms or corrects on the next screen)
  |
  |  2. Enhance
  |     photo -> rembg background removal -> clean catalogue image
  |
  |  3. Transcribe
  |     audio -> Whisper -> transcript in the artisan's language
  |
  |  4. Generate listing
  |     transcript + craft -> Claude -> listing { english, local, cost }
  |
  |  5. Price
  |     embedding -> compare to reference set -> recommended price,
  |     cost floor, confidence, comparable items
  |
  v
PostgreSQL   (persists products and listings)
  |
  v
Publish -> ONDC / GeM / WhatsApp, then Reach view + shareable ad creative
```

## Components

### Frontend — React Native (Expo)

A single-flow app that walks the artisan from language selection through publish. The screens change colour as work progresses: warm undyed-cotton tones on the input screens the artisan speaks to, deep indigo on the output screens that represent the finished, sellable product.

Key responsibilities:
- Language selection across 12 Indian languages, previewed aloud on tap.
- Camera capture and on-device audio recording.
- Locale-aware text-to-speech that reads every prompt in the chosen language.
- Composing and sharing a ready-made ad poster (product image, craft, price, QR) as an image.

### Backend — FastAPI

A thin coordination layer that exposes one endpoint per pipeline stage (classify, enhance, transcribe, generate, price, publish) and orchestrates the ML components. Chosen for async request handling and minimal boilerplate around Python ML code. Runs behind uvicorn, containerized with Docker, backed by PostgreSQL.

### Machine learning

**Craft classification — SigLIP embeddings.** The product photo is embedded and matched against a reference set of known crafts. The result is a *proposal*, not a verdict: the artisan confirms it or picks the correct craft on the confirmation screen. This keeps a human in authority and directly answers the question "what if the AI is wrong?"

**Background removal — rembg (ONNX Runtime).** Turns an ordinary phone photo into a clean, catalogue-quality image so artisans do not need a photography setup. GPU-accelerated for speed.

**Speech-to-text — Whisper (faster-whisper).** Transcribes the artisan's spoken description in their language, GPU-accelerated for responsiveness on the demo hardware. For languages without strong coverage today, transcription falls back gracefully; the roadmap routes these through Bhashini.

**Listing generation — Claude.** Converts a raw, spoken description into a structured listing, and returns it in the artisan's own language rather than only in English. Prompted to correct likely speech-recognition errors and to avoid inventing details the artisan did not say.

**Pricing — similarity plus a cost floor.** The piece is compared to similar items to suggest a market-aware price, but never below a transparent floor of materials plus a fair value for the hours worked. The app shows the confidence behind the number and the comparable items, so the price is explainable rather than a black box.

### Localization layer

A custom internationalization module holds 12 languages with an identical set of 105 keys each. Lookups follow a fallback chain (chosen language, then Hindi, then English, then the key itself) so a missing string never leaves a blank screen. Each language carries a matching speech locale so the correct voice is used for text-to-speech.

## Notable design decisions

**The classifier proposes; the artisan disposes.** Rather than trusting a vision model to be right, the design makes its output a suggestion the artisan confirms. This is both more respectful and more robust, and it opens the door to learning from every confirmation over time.

**Fallbacks everywhere.** A missing translation falls back down a chain. A language without a speech model falls back to a working one. A share that fails falls back to a screenshot. The system is built to bend, not break, in a live demo or a low-connectivity village.

**Honest figures.** Reach and channel numbers in the current build are illustrative and labelled as such in the interface, standing in for analytics that require completed marketplace onboarding.

**Runs on modest hardware.** The pipeline is tuned to fit on a single consumer GPU, in line with the goal of reaching low-resource settings rather than assuming cloud scale from day one.
