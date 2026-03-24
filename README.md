# InvoiceAI — Self-Hosted AI Invoice Capture for Small Businesses

An open-source, mobile-first agent that lets local businesses snap a photo or upload a PDF and instantly export clean invoice data to Excel, Google Sheets, or CSV. Built to be self-hosted to keep costs low, protect data, and run with whichever LLM is best for your budget (Claude, GPT-4o, Gemini, Azure).

## Why this matters
- **SMB pain:** 86% of small businesses still re-type paper/PDF invoices, wasting days each month and introducing errors.
- **Cost-first & private:** Run on your own infra; choose the LLM provider/fallback order to balance price and accuracy.
- **Ecosystem impact:** Practical AI workflow for SMEs, ready for community contributions and extensions (Tally/QuickBooks/Zoho, WhatsApp ingest, offline capture).

## Key capabilities
- Camera, gallery, and PDF ingest (multi-page), with optional WhatsApp share target.
- Vision + LLM extraction with validation (totals, GST math, duplicate detection) and confidence scoring.
- Review & edit UI, vendor auto-complete, paid/pending toggles, category tagging.
- Ledger with search/filter/sort, calendar for due dates, anomaly and duplicate alerts, weekly summaries.
- Exports: Excel (.xlsx with line items), CSV (Tally/Zoho-friendly), Google Sheets sync, PDF summary reports.
- Regional language OCR (Hindi, Gujarati, Tamil, Telugu, Marathi, Bengali, Malayalam, Kannada) plus English; mixed-language handling.

## Architecture at a glance
- **Frontend:** React Native (Expo), file-based routing; mobile-first UI for capture/review/export.
- **Backend:** FastAPI + MongoDB + Redis; background jobs for batch processing and notifications.
- **AI layer:** Multi-LLM provider plan (Anthropic Claude, OpenAI GPT-4o/mini, Google Gemini, Azure OpenAI) with cost-aware routing and fallbacks.
- **Exports & storage:** OpenPyXL/CSV/Sheets connectors; PDF generation; offline-friendly capture with later sync.

## Quick start (local dev)
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install openpyxl pillow scipy PyMuPDF apscheduler httpx
cat > .env <<'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=invoiceai_db
JWT_SECRET=your-super-secret-jwt-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-gemini-api-key
DEFAULT_LLM_PROVIDER=anthropic
LLM_FALLBACK_ORDER=anthropic,openai,gemini
REDIS_URL=redis://localhost:6379/0
CORS_ALLOW_ORIGINS=http://localhost:8081,http://localhost:19006
MAX_UPLOAD_BYTES=10485760
EOF
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd ../frontend
npm install
echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > .env
npx expo start  # press a for Android, i for iOS, or scan QR with Expo Go
```
For full setup, testing, deployment, and CI/CD details see [Setup, Testing & Deployment Guide](SETUP_AND_DEPLOYMENT.md).

## Program fit (Claude for Open Source)
- Actively maintained AI invoice capture stack aimed at **self-hosted, cost-sensitive SMBs**—a real-world, underserved audience.
- Multi-provider LLM design lowers cost and keeps data residency flexible; extensible hooks for Tally/QuickBooks/Zoho and WhatsApp ingest.
- Open roadmap and PRD tailored for contributors to ship features quickly; looking to expand community adoption and stability at scale.

## Documentation
- [Product Requirements Document](PRD.MD)
- [Setup, Testing & Deployment Guide](SETUP_AND_DEPLOYMENT.md)
- [LLM Provider Migration Plan (Backend)](backend/LLM_PROVIDER_MIGRATION_PLAN.md)
- [Frontend notes](frontend/README.md)

## Contributing & testing
- Issues/PRs welcome: focus on extraction accuracy, cost routing, offline/low-bandwidth UX, and regional language quality.
- Run tests from `backend` with `pytest` (add venv activation), and follow linting/formatting in requirements.
- Please add notes to PRs about which LLM provider and env settings were used when reproducing results.

## Status & roadmap snapshot
- MVP goals: capture (camera/gallery/PDF), vision extraction with validation, export to Excel/CSV/Sheets, ledger & alerts, regional OCR.
- In progress/next: multi-LLM provider rollout, WhatsApp ingest, Tally/QuickBooks/Zoho integrations, bank-statement matching, enhanced anomaly detection.

## License
Project is intended to be open-source; add your preferred OSI license (e.g., MIT/Apache-2.0) before production use.
