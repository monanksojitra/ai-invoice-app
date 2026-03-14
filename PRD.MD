# Product Requirements Document (PRD)
## InvoiceAI — Agentic Invoice Capture & Management Platform for Local Businesses

**Version:** 1.0  
**Date:** March 2026  
**Status:** Ready for Autonomous AI Agent Implementation  
**Document Purpose:** Full-stack implementation spec — feed directly to AI coding agent

---

## 1. EXECUTIVE SUMMARY

### 1.1 Problem Statement

Local business owners (retailers, wholesalers, contractors, restaurants, small manufacturers) receive invoices in three formats daily:
- **Physical paper** invoices from suppliers/vendors
- **PDF files** via email or WhatsApp
- **Images** (photos of invoices, scanned documents)

Today, they manually re-type every field into Excel, Tally, or paper ledgers. This is:
- Time-consuming (industry avg: **14.6 days** processing time per invoice workflow)
- Error-prone (**39% of manually processed invoices contain errors**)
- Expensive (**$15–$40 per invoice** when processed manually)
- A bottleneck that stops growth

**86% of SMEs still rely on paper invoices and manual data entry** (Klippa, 2025).

### 1.2 Solution

**InvoiceAI** — a mobile-first app where a local business owner:
1. Takes a photo, uploads an image, or attaches a PDF
2. An **AI agent** autonomously extracts all invoice data using Vision OCR + LLM
3. Data is structured, validated, and exported to Excel / Google Sheets / CSV
4. A running ledger/tracker is maintained with search, filter, and analytics
5. Alerts for due payments, duplicate invoices, and anomalies

The AI agent does not just extract — it **reasons**: it catches duplicates, flags unusual amounts, auto-categorizes vendors, and learns from corrections.

### 1.3 Market Opportunity

| Market Segment | 2024 Value | 2032–34 Projection | CAGR |
|---|---|---|---|
| Invoice Processing Software | $25.3B | $98.4B | 18.5% |
| AI for Invoice Management | $2.8B | $47.1B | 32.6% |
| Receipt/Invoice OCR Apps | $1.41B | $4.11B | 13.2% |
| Invoice OCR API Market | $1.5B | $5.8B | 16.8% |

**Target Users:** 500M+ micro/small businesses globally, 63M in India alone — the vast majority using zero automation.

---

## 2. PRODUCT VISION & GOALS

### 2.1 Vision
> "Every local business owner can manage their invoices as effortlessly as taking a photo."

### 2.2 Core Goals (MVP)
- **G1:** Capture invoices from 3 sources: camera, gallery (image), PDF upload
- **G2:** AI extracts all key fields with ≥95% accuracy
- **G3:** Export to Excel (.xlsx), CSV, and Google Sheets
- **G4:** Local ledger/dashboard with search, filter, totals
- **G5:** Support regional languages (Hindi, Gujarati, Tamil, etc.) on OCR

### 2.3 Extended Goals (v2)
- **G6:** Agentic duplicate detection and fraud alerts
- **G7:** Payment due reminders and cash flow summary
- **G8:** Multi-user (owner + accountant access)
- **G9:** WhatsApp integration (forward invoice PDF → auto-processed)
- **G10:** Integration with Tally, QuickBooks, Zoho Books via API

---

## 3. TARGET USERS & PERSONAS

### Persona 1 — Ramesh, Grocery Store Owner (Primary)
- Age: 38 | Location: Tier-2 city India
- Receives 20–50 invoices/week from FMCG distributors
- Currently uses paper ledger + occasional Excel
- Pain: Spends 2–3 hours daily entering data manually
- Goal: Know which vendors he owes money to, track monthly expenses
- Tech comfort: Moderate — uses WhatsApp and Paytm daily
- Language: Gujarati/Hindi preferred in UI

### Persona 2 — Priya, Boutique Owner (Secondary)
- Age: 29 | Location: Metro city
- Receives fabric/garment invoices as photos on WhatsApp
- Uses Google Sheets to track stock purchase costs
- Pain: Photos pile up, data entry is backlogged
- Goal: Auto-fill her Google Sheet from invoice photos
- Tech comfort: High — uses apps daily

### Persona 3 — Suresh, Electrical Contractor (Secondary)
- Age: 45 | Location: Semi-urban
- Receives material invoices as PDFs via email
- Needs records for GST filing and project costing
- Pain: Finding an invoice from 3 months ago is impossible
- Goal: Searchable digital archive of all purchase invoices + GST amounts extracted

### Persona 4 — Meena, Restaurant Owner (Edge)
- Receives both physical and digital invoices from food suppliers
- Needs weekly expense summaries per vendor
- Pain: No visibility into total weekly food cost vs. revenue

---

## 4. COMPETITIVE LANDSCAPE

### 4.1 Direct Competitors

| App | Strength | Weakness | Price |
|---|---|---|---|
| **Dext Prepare** | Strong OCR, audit trail | Complex UI, enterprise-focused | $20+/mo |
| **Veryfi** | Fast, accurate, API-rich | No regional language support | $12+/mo |
| **HubDoc** | Free with Xero | Tied to Xero, no line-item extraction | Free/Xero |
| **AutoEntry** | Good for accountants | Credit-based, no mobile-first UX | Per scan |
| **Wave** | Free tier | Limited OCR accuracy, US-centric | $8/mo |
| **QuickBooks Scan** | Brand trust | Requires QB subscription | $38/mo |

### 4.2 Key Gaps We Fill

1. **Regional language support** (Hindi, Gujarati, Tamil, Bengali, Marathi OCR)
2. **No subscription required for basic use** (freemium with generous free tier)
3. **WhatsApp PDF forwarding** — no competitor has this
4. **Agentic AI layer** — not just extract, but reason and act autonomously
5. **India-specific fields** — GST Number, GSTIN, HSN Code, IGST/CGST/SGST
6. **Works offline** — capture in field, sync later (competitors need internet)
7. **Excel-first export** — most SMBs live in Excel, not cloud accounting tools

---

## 5. FEATURE SPECIFICATIONS

### 5.1 CORE FEATURES — MVP

---

#### Feature F1: Invoice Capture (3 Input Methods)

**F1.1 — Camera Capture**
- Open in-app camera with document detection overlay
- Auto-detect invoice edges using computer vision (OpenCV / ML Kit)
- Auto-crop and perspective-correct the captured image
- Capture resolution: minimum 2MP, recommended 8MP+
- Flash toggle for dark environments
- Retake option before processing

**F1.2 — Gallery Upload**
- Pick from device photo gallery
- Supported formats: JPG, PNG, HEIC, WEBP
- Multi-select: up to 20 images in batch upload
- Preview before processing

**F1.3 — PDF Upload**
- Pick PDF from device storage or cloud (Google Drive, Dropbox)
- Multi-page PDF: each page analyzed, invoice data merged
- Supported: scanned PDFs (image-based) and digital PDFs (text-based)
- Max file size: 50MB per PDF

**F1.4 — WhatsApp Integration (v1.5)**
- User sets InvoiceAI as a share target
- When forwarding PDF/image in WhatsApp → share to InvoiceAI
- App processes in background, pushes notification when complete

---

#### Feature F2: AI OCR + Data Extraction Engine

**F2.1 — Extraction Pipeline (Agentic)**

The AI agent follows this autonomous pipeline:

```
[Input: Image/PDF]
     ↓
[Pre-processing Agent]
  - Deskew, denoise, enhance contrast
  - Detect document type (invoice vs receipt vs other)
  - Detect language(s) present
     ↓
[OCR Agent]
  - Vision LLM (GPT-4o Vision / Claude Vision / Gemini Vision)
  - Full document text extraction
  - Preserve spatial layout
     ↓
[Extraction Agent]
  - Parse structured fields from raw OCR text
  - Use LLM with structured output schema
  - Fill extraction confidence scores per field
     ↓
[Validation Agent]
  - Cross-check totals (line items × qty = subtotal)
  - Validate GST calculation (CGST + SGST = Total GST)
  - Flag missing mandatory fields
  - Detect duplicates against existing records
     ↓
[Review Screen]
  - Show extracted data, highlight low-confidence fields
  - User corrects if needed (corrections feed learning loop)
     ↓
[Save to Ledger + Export]
```

**F2.2 — Extracted Fields**

| Field | Type | Required |
|---|---|---|
| Invoice Number | String | Yes |
| Invoice Date | Date | Yes |
| Vendor Name | String | Yes |
| Vendor Phone | String | No |
| Vendor Address | Text | No |
| Vendor GSTIN | String (15-char) | No |
| Buyer Name / Business Name | String | Yes |
| Buyer GSTIN | String | No |
| Line Items (array) | See below | Yes |
| Subtotal | Decimal | Yes |
| Discount | Decimal | No |
| CGST Amount | Decimal | No |
| SGST Amount | Decimal | No |
| IGST Amount | Decimal | No |
| Total Tax Amount | Decimal | No |
| Grand Total | Decimal | Yes |
| Currency | String | Yes (default INR) |
| Payment Terms | String | No |
| Due Date | Date | No |
| Notes / Remarks | Text | No |

**Line Item Sub-fields:**
- Item Name / Description
- HSN/SAC Code
- Quantity
- Unit (kg, pcs, liters, etc.)
- Unit Price
- Line Total
- GST Rate (%)

**F2.3 — Language Support**
- English (primary)
- Hindi (Devanagari script)
- Gujarati
- Tamil
- Telugu
- Marathi
- Bengali
- Malayalam
- Kannada
- Arabic (for UAE/Middle East market, v2)
- Mixed-language documents handled gracefully

**F2.4 — Confidence Scoring**
- Each extracted field gets a confidence score (0–100%)
- Fields < 70% confidence highlighted in yellow for user review
- Fields < 40% confidence shown as blank with "Please verify" prompt
- Overall invoice confidence score shown (e.g., "94% confident")

---

#### Feature F3: Review & Edit Screen

- Display extracted data in clean form layout
- Each field is editable (tap to edit)
- Original invoice image shown side-by-side (or toggle view)
- Zoom into original image to verify a field
- Vendor auto-complete from previously seen vendors
- Category assignment (Food & Beverage, Raw Materials, Utilities, etc.)
- "Mark as Paid" / "Pending" toggle
- Notes field for manual annotations
- Save button → goes to Ledger
- Corrections are logged and used to fine-tune extraction for that vendor

---

#### Feature F4: Invoice Ledger (Dashboard)

**F4.1 — Invoice List View**
- Chronological list of all invoices
- Card per invoice: Vendor name, date, amount, status (Paid/Pending/Overdue)
- Color coding: Green = Paid, Yellow = Pending, Red = Overdue
- Search bar: search by vendor, invoice number, amount, date range
- Filter by: date range, vendor, category, status, amount range
- Sort by: date, amount, vendor name

**F4.2 — Summary Dashboard**
- Total invoices this month
- Total amount this month
- Pending payments total
- Overdue payments total
- Top 5 vendors by spend (bar chart)
- Monthly spend trend (line chart)
- Category breakdown (pie chart)

**F4.3 — Vendor View**
- Group invoices by vendor
- Per vendor: total spend, # invoices, last invoice date
- Tap vendor → all invoices from that vendor
- Contact vendor (call/WhatsApp) directly from vendor card

**F4.4 — Calendar View**
- Calendar with invoice due dates marked
- Tap a date → see invoices due
- Color: Red = overdue, Orange = due today, Blue = upcoming

---

#### Feature F5: Export Engine

**F5.1 — Excel Export (.xlsx)**
- One row per invoice with all extracted fields as columns
- Separate sheet for line items (linked by Invoice ID)
- Auto-format: currency columns, date columns, totals row
- Export options:
  - All invoices
  - Date range
  - By vendor
  - By category
- File naming: `InvoiceAI_Export_[DateRange].xlsx`

**F5.2 — CSV Export**
- Flat file export
- Compatible with Tally import format
- Compatible with Zoho Books import format
- UTF-8 encoding for regional language characters

**F5.3 — Google Sheets Sync**
- OAuth2 login to Google account
- Create or select a target spreadsheet
- Auto-append new invoices to the sheet
- Optional: real-time sync vs manual sync

**F5.4 — PDF Summary Report**
- Monthly/quarterly expense report as PDF
- Vendor-wise summary table
- Category breakdown
- GST summary (total CGST, SGST, IGST paid)
- Shareable with accountant

---

#### Feature F6: Notifications & Alerts (Agentic)

**F6.1 — Payment Due Alerts**
- Push notification 3 days before due date
- Push notification on due date
- Push notification 3 days after (overdue)
- User can set custom reminder intervals

**F6.2 — Duplicate Invoice Alert**
- Agent checks new invoice against existing records
- Flags if: same vendor + same invoice number OR same vendor + same amount + same date ±3 days
- Shows potential duplicate with side-by-side comparison
- User confirms: "Mark as duplicate" or "Keep as separate"

**F6.3 — Anomaly Alerts**
- Vendor invoice amount >50% higher than their 3-month average → flag
- Same vendor invoice submitted twice in same day → flag
- GST calculation mismatch → flag with correct calculation shown

**F6.4 — Weekly Summary**
- Every Monday morning: "Last week you received X invoices totaling ₹Y. Z are still unpaid."

---

### 5.2 EXTENDED FEATURES — v2

#### Feature F7: Multi-User & Roles
- Owner account (full access)
- Accountant role (read + export only)
- Staff role (capture only, no export/delete)
- Invite by phone number or email
- Audit log: who added/edited/deleted what

#### Feature F8: WhatsApp Bot
- WhatsApp Business API integration
- User sends PDF/image to bot number
- Bot processes and replies with extracted summary
- All invoices auto-added to their account
- No app required for this flow

#### Feature F9: Tally Integration
- Export in Tally XML format
- Direct push to Tally via local network (Tally running on same network)
- Map vendor names to Tally ledger names
- Map categories to Tally groups

#### Feature F10: Bank Statement Matching
- Upload bank statement PDF
- Agent matches payments to invoices automatically
- Auto-marks invoices as paid when matching bank debit found
- Unmatched transactions flagged for review

---

## 6. AI AGENT ARCHITECTURE

### 6.1 Agent Design Principles
- Each agent has a **single responsibility**
- Agents communicate via structured JSON messages
- Each agent logs its actions for auditability
- Human override at any point in the pipeline
- Agents learn from corrections (fine-tuning loop)

### 6.2 Agent Definitions

```
InvoiceAI Multi-Agent System
│
├── OrchestratorAgent
│   ├── Receives input (image/PDF path)
│   ├── Routes to correct sub-agents
│   └── Aggregates results
│
├── PreprocessingAgent
│   ├── Image enhancement (brightness, contrast, sharpness)
│   ├── Deskew and perspective correction
│   ├── Document type classification
│   └── Language detection
│
├── OCRAgent
│   ├── Calls Vision LLM API (primary: Claude Vision / GPT-4o Vision)
│   ├── Fallback: Google Vision API / Azure Document Intelligence
│   ├── Returns: raw OCR text + bounding boxes
│   └── Confidence: per-character and per-region
│
├── ExtractionAgent
│   ├── Takes raw OCR text + spatial layout
│   ├── Calls LLM with structured output schema (JSON mode)
│   ├── Returns: InvoiceData object with all fields
│   └── Attaches confidence scores per field
│
├── ValidationAgent
│   ├── Math validation (totals, tax calculations)
│   ├── Field format validation (GSTIN format, date format)
│   ├── Required field check
│   └── Returns: validation_result with error list
│
├── DuplicateDetectionAgent
│   ├── Queries local DB for similar invoices
│   ├── Similarity scoring: vendor + amount + date
│   └── Returns: duplicate_candidates[] with similarity score
│
├── AnomalyDetectionAgent
│   ├── Compares against vendor spending history
│   ├── Flags statistical outliers (>2 std deviations)
│   └── Returns: anomaly_flags[]
│
└── ExportAgent
    ├── Transforms InvoiceData to Excel / CSV / Google Sheets
    ├── Handles batch exports
    └── Manages Google Sheets OAuth sync
```

### 6.3 LLM Prompting Strategy

**Extraction Agent Prompt Structure:**
```
SYSTEM: You are an expert invoice data extraction AI. 
Extract all invoice fields from the OCR text below.
Return ONLY valid JSON matching the InvoiceSchema.
For each field, include a confidence score 0-100.
If a field is not present, return null (not empty string).
Handle Indian invoice formats including GST fields.

SCHEMA: {InvoiceSchema JSON}

OCR_TEXT: {raw OCR output}

SPATIAL_HINTS: {key regions detected - header, line items, totals}
```

**Validation Agent Prompt:**
```
SYSTEM: You are a financial document validator.
Given extracted invoice data, check:
1. Do line item totals add up to subtotal?
2. Does CGST + SGST = Total Tax (for intra-state)?
3. Is Grand Total = Subtotal + Tax - Discount?
4. Is the GSTIN format valid (15 alphanumeric chars)?
5. Are dates in valid format and logical (invoice date <= due date)?

Return a JSON list of validation_issues with field, issue_type, expected_value, found_value.
```

### 6.4 Local Storage + Sync Architecture
```
Mobile App
├── SQLite (local DB) — all invoices stored locally
│   ├── invoices table
│   ├── line_items table
│   ├── vendors table
│   └── corrections table (for learning loop)
├── File Storage — original images/PDFs stored locally
└── Sync Engine
    ├── Cloud backup (Firebase / Supabase)
    ├── Google Sheets sync
    └── Export queue (async)
```

**Offline-first:** All core features work without internet. Sync happens when online.

---

## 7. TECHNICAL SPECIFICATIONS

### 7.1 Mobile App (React Native — iOS + Android)

**Stack:**
- Framework: React Native (Expo managed workflow)
- State Management: Zustand
- Local Database: SQLite via expo-sqlite
- File Storage: expo-file-system
- Camera: expo-camera + expo-image-picker
- PDF Handling: react-native-pdf + pdf.js
- Navigation: React Navigation v6
- UI Components: React Native Paper or NativeWind (Tailwind for RN)
- Charts: Victory Native
- Export: xlsx.js (client-side Excel generation)
- Notifications: expo-notifications

### 7.2 Backend API (Node.js + Express or FastAPI Python)

**Endpoints Required:**

```
POST /api/process-invoice
  Body: { image_base64 OR pdf_base64, user_id, source_type }
  Response: { invoice_data: InvoiceData, confidence_scores, validation_issues, duplicate_candidates }

POST /api/invoices
  Body: InvoiceData (after user review/confirmation)
  Response: { invoice_id, created_at }

GET /api/invoices
  Params: user_id, date_from, date_to, vendor_id, status, page, limit
  Response: { invoices[], total_count, summary }

PUT /api/invoices/:id
  Body: Partial<InvoiceData>
  Response: updated InvoiceData

DELETE /api/invoices/:id

POST /api/export
  Body: { user_id, format, filters }
  Response: file download OR Google Sheets URL

GET /api/vendors
  Params: user_id
  Response: vendors[] with spend stats

POST /api/corrections
  Body: { invoice_id, field, original_value, corrected_value }
  (feeds learning loop)

POST /api/google-sheets/sync
  Body: { user_id, spreadsheet_id, invoices[] }
```

### 7.3 AI/ML Services

**Primary Vision Model:**
- Claude claude-sonnet-4-6 (Vision) — invoice extraction
- Fallback: GPT-4o Vision
- Secondary fallback: Google Cloud Vision API (for pure OCR)

**Image Preprocessing:**
- Python service using OpenCV for deskew, denoise, enhance
- PIL/Pillow for format conversion and resizing

**Regional Language OCR:**
- Google Cloud Vision API (supports 50+ languages)
- Tesseract OCR (offline fallback, pre-trained for Indian languages)
- Azure Document Intelligence (for structured forms)

### 7.4 Database Schema

```sql
-- Core Tables

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  business_name TEXT,
  gstin TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vendors (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  gstin TEXT,
  phone TEXT,
  address TEXT,
  avg_invoice_amount DECIMAL,
  total_invoices INTEGER DEFAULT 0,
  total_spend DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  vendor_id TEXT REFERENCES vendors(id),
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  subtotal DECIMAL,
  discount DECIMAL DEFAULT 0,
  cgst DECIMAL DEFAULT 0,
  sgst DECIMAL DEFAULT 0,
  igst DECIMAL DEFAULT 0,
  total_tax DECIMAL DEFAULT 0,
  grand_total DECIMAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending', -- pending, paid, overdue, cancelled
  category TEXT,
  notes TEXT,
  source_type TEXT, -- camera, gallery, pdf, whatsapp
  original_file_path TEXT,
  confidence_score INTEGER,
  is_duplicate BOOLEAN DEFAULT FALSE,
  has_anomaly BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE line_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id),
  description TEXT,
  hsn_code TEXT,
  quantity DECIMAL,
  unit TEXT,
  unit_price DECIMAL,
  line_total DECIMAL,
  gst_rate DECIMAL,
  sort_order INTEGER
);

CREATE TABLE corrections (
  id TEXT PRIMARY KEY,
  invoice_id TEXT REFERENCES invoices(id),
  field_name TEXT,
  original_value TEXT,
  corrected_value TEXT,
  user_id TEXT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE export_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  export_type TEXT, -- excel, csv, google_sheets, pdf_report
  invoice_count INTEGER,
  date_range_from DATE,
  date_range_to DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.5 Security & Privacy

- All data encrypted at rest (AES-256)
- All API calls over HTTPS/TLS 1.3
- JWT authentication with refresh tokens
- Biometric lock on app (fingerprint/FaceID)
- User data never used to train external AI models
- GDPR-compliant data deletion on account close
- Original invoice images stored encrypted
- Option for fully local processing (no cloud upload)

---

## 8. USER FLOWS

### 8.1 Primary Flow — Capture New Invoice

```
App Open → Home Screen
  ↓
Tap "+" / "Add Invoice" button
  ↓
Choose input method:
  [📷 Take Photo] [🖼 Upload Image] [📄 Upload PDF]
  ↓
Input received
  ↓
"Processing..." screen (show animated invoice being scanned)
  ↓ (5–15 seconds)
Review Screen:
  - Invoice image on top (pinch to zoom)
  - Extracted fields below (editable)
  - Confidence indicators on each field
  - "Duplicate detected" banner (if applicable)
  ↓
User reviews, edits if needed
  ↓
Tap "Save Invoice"
  ↓
Success animation
  ↓
Return to Home / Ledger (new invoice appears at top)
```

### 8.2 Export Flow

```
Ledger Screen → Tap "Export" icon
  ↓
Export Options Screen:
  - Format: [Excel] [CSV] [Google Sheets] [PDF Report]
  - Date range picker
  - Vendor filter (optional)
  - Category filter (optional)
  ↓
Tap "Export"
  ↓
For Excel/CSV: File saved to device → Share sheet opens
For Google Sheets: OAuth login → Select/create sheet → Sync
For PDF: Preview → Share
  ↓
"Export complete" confirmation
```

### 8.3 Onboarding Flow

```
App Install → Splash Screen
  ↓
Language selection (English / Hindi / Gujarati / Tamil / etc.)
  ↓
Phone number entry → OTP verification
  ↓
Business setup:
  - Business name
  - Your name
  - GSTIN (optional)
  - Business type (retail, wholesale, contractor, restaurant, etc.)
  ↓
Tutorial: 3-screen walkthrough (Capture → Review → Export)
  ↓
Offer: "Process your first invoice now"
  ↓
Home Screen
```

---

## 9. MONETIZATION STRATEGY

### 9.1 Freemium Model

| Plan | Price | Limits | Features |
|---|---|---|---|
| **Free** | ₹0 / $0 | 15 invoices/month | Capture, extract, ledger, CSV export |
| **Starter** | ₹199/mo ($3) | 100 invoices/month | + Excel export, PDF report, WhatsApp import |
| **Pro** | ₹499/mo ($7) | 500 invoices/month | + Google Sheets sync, multi-user (2), Tally export, anomaly alerts |
| **Business** | ₹999/mo ($13) | Unlimited | + Multi-user (5), API access, priority support, custom categories |

### 9.2 Revenue Projections (Year 1)
- Target: 50,000 free users, 5,000 paid (10% conversion)
- Average paid plan: ₹350/month
- Monthly Recurring Revenue (MRR): ₹17.5 Lakh (~$21K)
- Annual Recurring Revenue (ARR): ₹2.1 Crore (~$250K)

---

## 10. SUCCESS METRICS (KPIs)

### 10.1 Product Metrics
| Metric | Target (Month 3) | Target (Month 12) |
|---|---|---|
| OCR Accuracy (field-level) | ≥93% | ≥97% |
| Processing Time per invoice | <15 seconds | <8 seconds |
| Invoice capture to save time | <60 seconds | <30 seconds |
| Crash-free sessions | >99% | >99.5% |
| DAU/MAU ratio | >25% | >40% |

### 10.2 Business Metrics
| Metric | Month 3 | Month 12 |
|---|---|---|
| Total registered users | 5,000 | 100,000 |
| Paid subscribers | 200 | 8,000 |
| Invoices processed/month | 50,000 | 2,000,000 |
| MRR | ₹70K | ₹28L |
| Net Promoter Score (NPS) | >40 | >60 |

### 10.3 AI Agent Metrics
| Metric | Target |
|---|---|
| Duplicate detection accuracy | >98% |
| Anomaly false-positive rate | <5% |
| Correction rate (user edits after extract) | <8% |
| Vendor auto-match accuracy | >90% |

---

## 11. IMPLEMENTATION PHASES

### Phase 1 — Foundation (Weeks 1–4)
- [ ] Project setup: React Native (Expo), Node.js backend, PostgreSQL
- [ ] User auth: Phone OTP login
- [ ] Camera capture + gallery upload
- [ ] Basic OCR pipeline (Claude Vision API)
- [ ] Extraction agent with JSON output
- [ ] Manual review/edit screen
- [ ] SQLite local storage
- [ ] Basic invoice list view

### Phase 2 — Core Product (Weeks 5–8)
- [ ] PDF upload and processing
- [ ] Full extraction schema (all fields including GST)
- [ ] Validation agent
- [ ] Duplicate detection agent
- [ ] Excel export (.xlsx)
- [ ] CSV export
- [ ] Dashboard with summary stats
- [ ] Search and filter in ledger
- [ ] Offline-first with sync
- [ ] Push notifications (payment reminders)

### Phase 3 — Intelligence Layer (Weeks 9–12)
- [ ] Regional language OCR (Hindi, Gujarati, Tamil)
- [ ] Anomaly detection agent
- [ ] Google Sheets sync
- [ ] Vendor profile with spend history
- [ ] PDF summary report export
- [ ] Confidence scoring + UI indicators
- [ ] Corrections logging + learning loop
- [ ] Onboarding flow + tutorial
- [ ] App store submission (iOS + Android)

### Phase 4 — Growth Features (Weeks 13–20)
- [ ] WhatsApp share target integration
- [ ] Multi-user / roles
- [ ] Tally export format
- [ ] Subscription billing (Razorpay / Stripe)
- [ ] Web dashboard (React)
- [ ] API access for paid plans
- [ ] Analytics dashboard
- [ ] Admin panel

---

## 12. TECHNICAL RISKS & MITIGATIONS

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OCR accuracy drops for low-quality photos | High | High | Image enhancement pre-processing; prompt user to retake if quality too low |
| Regional language OCR poor accuracy | Medium | High | Multi-model ensemble; Google Vision API as fallback |
| LLM extraction latency too high | Medium | Medium | Cache responses; stream results progressively |
| LLM hallucinating incorrect amounts | Medium | High | Always validate math independently; show raw image for user to verify |
| User data breach | Low | Critical | Encryption, no plaintext storage, regular security audits |
| Google Sheets API rate limits | Low | Medium | Queue sync jobs, backoff retry, notify user of delay |
| Offline sync conflicts | Medium | Medium | Last-write-wins with conflict log; show conflict resolution UI |

---

## 13. DEPENDENCIES & INTEGRATIONS

### External APIs Required
| Service | Purpose | Pricing |
|---|---|---|
| Anthropic API (Claude Vision) | Primary invoice extraction | Pay per token |
| Google Cloud Vision API | OCR fallback + regional languages | $1.50/1000 pages |
| Google Sheets API | Google Sheets sync | Free (OAuth) |
| Firebase | Auth, push notifications, cloud backup | Spark plan free |
| Razorpay | Subscription billing (India) | 2% per transaction |
| Supabase | Hosted PostgreSQL + realtime | Free tier available |
| Expo EAS | App builds + OTA updates | Free/Paid |

### Optional Integrations (v2)
- WhatsApp Business API (Meta) — for WhatsApp bot
- Tally API / ODBC — for Tally direct integration
- Zoho Books API — for Zoho sync
- QuickBooks API — for QuickBooks sync
- Azure Document Intelligence — for high-volume enterprise tier

---

## 14. APPENDIX — DATA SCHEMAS

### 14.1 InvoiceData JSON Schema
```json
{
  "invoice_id": "uuid",
  "invoice_number": "string | null",
  "invoice_date": "YYYY-MM-DD | null",
  "due_date": "YYYY-MM-DD | null",
  "vendor": {
    "name": "string",
    "gstin": "string | null",
    "phone": "string | null",
    "address": "string | null"
  },
  "buyer": {
    "name": "string | null",
    "gstin": "string | null"
  },
  "line_items": [
    {
      "description": "string",
      "hsn_code": "string | null",
      "quantity": "number | null",
      "unit": "string | null",
      "unit_price": "number | null",
      "line_total": "number",
      "gst_rate": "number | null"
    }
  ],
  "subtotal": "number | null",
  "discount": "number | null",
  "cgst": "number | null",
  "sgst": "number | null",
  "igst": "number | null",
  "total_tax": "number | null",
  "grand_total": "number",
  "currency": "string",
  "payment_terms": "string | null",
  "notes": "string | null",
  "confidence_scores": {
    "invoice_number": 95,
    "invoice_date": 98,
    "vendor_name": 99,
    "grand_total": 97
  },
  "validation_issues": [
    {
      "field": "string",
      "issue_type": "math_error | format_error | missing_required",
      "message": "string",
      "expected": "string | null",
      "found": "string | null"
    }
  ],
  "duplicate_candidates": [
    {
      "invoice_id": "uuid",
      "similarity_score": 0.95,
      "match_reasons": ["same_vendor", "same_amount", "same_date"]
    }
  ]
}
```

### 14.2 Export Column Mapping (Excel)

```
Column A: Invoice ID
Column B: Invoice Number
Column C: Invoice Date
Column D: Due Date
Column E: Vendor Name
Column F: Vendor GSTIN
Column G: Subtotal
Column H: Discount
Column I: CGST
Column J: SGST
Column K: IGST
Column L: Total Tax
Column M: Grand Total
Column N: Currency
Column O: Status (Paid/Pending/Overdue)
Column P: Category
Column Q: Source (Camera/Upload/PDF)
Column R: Notes
Column S: Date Added
```

---

## 15. AI AGENT IMPLEMENTATION NOTES

> **For AI Coding Agent:** The following notes are specifically to guide autonomous implementation.

### Architecture Decision: Agentic vs Single LLM Call
Use a **multi-step agentic pipeline** (not a single prompt) because:
1. Preprocessing is best done in code (OpenCV), not LLM
2. Extraction benefits from a focused prompt with only OCR text (not raw image always)
3. Validation must be deterministic math checks, not probabilistic LLM
4. Duplicate detection requires database queries, not memory
5. Each step can fail independently and be retried without re-running the full pipeline

### LLM Prompt Engineering Guidelines
1. Always use **JSON mode / structured output** for extraction — never parse free text
2. Include **few-shot examples** of Indian invoices in the extraction prompt
3. For regional languages, instruct the model: "The invoice may be in Hindi or Gujarati. Extract all fields and return values in their original language. Also provide an English transliteration for vendor names."
4. Always include **schema definition** in the system prompt
5. Set **temperature = 0** for extraction (deterministic)
6. Use **temperature = 0.3** for anomaly explanation (needs some natural language)

### Offline Queue Implementation
```
When internet unavailable:
1. Save image/PDF locally
2. Add to processing_queue (SQLite table)
3. Show "Queued for processing" status in UI
4. When internet restored → process queue in order
5. Update invoice records as each completes
6. Push notification: "5 queued invoices processed"
```

### Error Recovery
- If OCR fails → fallback to manual entry form (all fields empty, user fills manually)
- If LLM extraction fails → show raw OCR text, user can copy-paste
- If validation fails → show invoice anyway with warnings, user decides
- If export fails → save export to local queue, retry on next app open

### Performance Targets
- App cold start: < 2 seconds
- Invoice processing end-to-end: < 15 seconds (target < 8s)
- Dashboard load: < 1 second (SQLite is local)
- Export 1000 invoices to Excel: < 10 seconds

---

*End of PRD — Version 1.0*  
*This document is ready for autonomous AI agent implementation.*  
*All features, schemas, flows, and technical specs are fully defined for code generation.*