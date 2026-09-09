# Submission Guide

This repository follows the SIH 2026 submission template, adapted for a project with a separate backend service and mobile app rather than a single `src/` folder.

## Where everything lives

| Item | Location |
|---|---|
| Project overview | [README.md](README.md) |
| Architecture & technical docs | [docs/architecture.md](docs/architecture.md) |
| Backend source (FastAPI + ML) | `backend/` |
| Mobile app source (React Native / Expo) | `app/` |
| Screenshots / prototype photos | `assets/screenshots/` |
| Final PPT / presentation | [submission/PRESENTATION.md](submission/PRESENTATION.md) |
| Demo video link & run-through | [submission/DEMO.md](submission/DEMO.md) |
| Backend Python dependencies | [requirements.txt](requirements.txt) |

## Note on structure

The SIH template shows a single `src/main.py`. Chhaap has two independently runnable parts — a Python backend and an Expo app — so they live in `backend/` and `app/` instead. This is a standard and reviewer-friendly layout for a full-stack project; `SUBMISSION_GUIDE.md` and the README both point to them explicitly so nothing is hard to find.

## Pre-submission checklist

- [ ] `backend/` and `app/` folders added
- [ ] No `.env` file or API key committed (see below)
- [ ] `requirements.txt` reflects the backend's actual imports
- [ ] Screenshots added to `assets/screenshots/`
- [ ] PPT link added to `submission/PRESENTATION.md`
- [ ] Demo video link added to `submission/DEMO.md` (optional but recommended)
- [ ] Repository is public / accessible to reviewers
- [ ] README run instructions match how the project actually starts

## Security reminder

Before the first commit, confirm no secrets are staged. The included `.gitignore` already excludes `.env`, keys, and model weights, but verify manually:

- The Anthropic API key must **never** be committed. It is set at runtime via an environment variable, not stored in code.
- If a key was ever committed in history, rotate it — removing it from the latest commit is not enough once it has been pushed.
