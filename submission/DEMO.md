# Demo

**Project:** Chhaap — AI Market-Linkage for Artisans
**PS ID:** SIH26090

## Demo video

<!-- Paste a YouTube or Google Drive link reviewers can open without requesting access. -->

**Video link:** _add link here_

## Live demo run-through (about 4 minutes)

A script for walking a reviewer through the working prototype.

1. **Pick a language.** Open the app and choose a non-English language (for example Tamil or Kannada). The whole interface and every spoken prompt switches to that language. This is the inclusion story in one tap.

2. **Photo.** Take a photo of a craft item. The app removes the background and returns a clean catalogue image.

3. **Confirm the craft.** The vision model proposes the craft type. Accept it, or correct it from the grid. Point out that the AI proposes and the artisan decides — this answers "what if the AI is wrong?".

4. **Speak.** Describe the item by voice, in the chosen language — what it is, what it is made of, how long it took. No typing.

5. **Listing.** The spoken description becomes a written listing, read back aloud in the artisan's language.

6. **Price.** Show the suggested price, the confidence signal, the cost floor, and the comparable items. Emphasize that the price is explainable, not a black box, and never drops below materials plus fair labour.

7. **Publish.** One tap sends it to ONDC, GeM, and WhatsApp.

8. **Reach and ad creative.** Show where the listing travelled and share the ready-made poster with its QR code. Note clearly that the reach figures are illustrative in this build.

## Boot order before demoing

1. Open Docker Desktop and wait until it is ready.
2. Start the database container.
3. Set `ANTHROPIC_API_KEY` in the PowerShell window used for the API.
4. Start the backend with `--host 0.0.0.0`.
5. Start Expo (`npx expo start -c`, or add `--tunnel` if the phone cannot reach the laptop).
6. On the demo phone, confirm the text-to-speech voices for the demo languages are installed.
