import json
from anthropic import Anthropic

client = Anthropic()  # reads ANTHROPIC_API_KEY from environment

PROMPT = """You are writing an e-commerce listing for a handmade Indian craft product.

The artisan spoke this description aloud. It was transcribed by speech-to-text,
so it may contain small phonetic spelling errors — infer the intended word from
context, don't repeat errors. It may also contain filler like a mic check
("kya meri awaaz aa rahi hai") — ignore that.

Craft: {craft}
Transcript: {transcript}

Write a listing with a title, 4-5 bullet points, and a short provenance story
paragraph, in TWO languages:
- "en": English
- "local": {target_lang}

If {target_lang} is English, still fill both — make "local" the same as "en".

Also extract two costing facts if the artisan mentioned them:
- material_inr: what they spent on raw materials, in rupees, as a number
- labour_hours: how many hours the piece took to make, as a number
Convert spoken forms to plain numbers. If a fact was not mentioned, use null.
Never guess or invent a value.

Return ONLY valid JSON, no other text, in this exact shape:

{{
  "en": {{"title": "...", "bullets": ["...", "..."], "story": "..."}},
  "local": {{"title": "...", "bullets": ["...", "..."], "story": "..."}},
  "cost": {{"material_inr": null, "labour_hours": null}}
}}"""


def generate_listing(transcript: str, craft: str, target_lang: str = "Hindi") -> dict:
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        messages=[{"role": "user", "content": PROMPT.format(
            craft=craft, transcript=transcript, target_lang=target_lang
        )}],
    )
    text = msg.content[0].text.strip()
    text = text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(text)

