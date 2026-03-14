# InvoiceAI - Developer Guide & Project Documentation

> **Agentic Invoice Capture & Management Platform for Local Businesses**  
> Version: 1.0 | Tech Stack: React Native (Expo) + FastAPI + MongoDB + Claude Vision AI

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Backend Implementation](#5-backend-implementation)
6. [Frontend Implementation](#6-frontend-implementation)
7. [AI/ML Pipeline](#7-aiml-pipeline)
8. [API Reference](#8-api-reference)
9. [Data Models](#9-data-models)
10. [Key Features Implemented](#10-key-features-implemented)
11. [Getting Started](#11-getting-started)
12. [Environment Variables](#12-environment-variables)
13. [Cost Optimization Strategies](#13-cost-optimization-strategies)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Project Overview

### What is InvoiceAI?

InvoiceAI is a mobile-first application that enables local business owners (retailers, wholesalers, contractors, restaurants) to:

1. **Capture invoices** via camera, gallery upload, or PDF
2. **AI extracts all data** using Claude Vision + LLM
3. **Review & correct** extracted data before saving
4. **Manage ledger** with search, filter, and analytics
5. **Export** to Excel/CSV for accounting

### Problem Solved

| Pain Point | Our Solution |
|------------|--------------|
| Manual data entry (14.6 days avg per invoice workflow) | AI extraction in <15 seconds |
| 39% error rate in manual processing | 95%+ AI accuracy with validation |
| $15-40 per invoice processing cost | Near-zero marginal cost |
| Paper/Excel chaos | Searchable digital ledger |
| No visibility into spend | Real-time analytics dashboard |

### Target Users

- **Primary:** Small retail/wholesale business owners (India market focus)
- **Secondary:** Boutique owners, contractors, restaurant owners
- **Key needs:** GST compliance, regional language support (Hindi, Gujarati, Tamil)

---

## 2. Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React Native/Expo)                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Capture │  │  Review  │  │  Ledger  │  │ Vendors  │  │ Settings │  │
│  │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │             │             │             │         │
│  ┌────┴─────────────┴─────────────┴─────────────┴─────────────┴────┐   │
│  │                    Zustand State Management                       │   │
│  │            (authStore, invoiceStore)                              │   │
│  └────────────────────────────────┬──────────────────────────────────┘   │
│                                   │ API Client (src/utils/api.ts)        │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (FastAPI + Python)                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                          API Router (/api)                         │  │
│  ├──────────┬──────────┬───────────┬───────────┬──────────┬─────────┤  │
│  │ Auth     │ Process  │ Invoices  │ Vendors   │ Analytics│ Export  │  │
│  │ Routes   │ Invoice  │ CRUD      │ List      │ Summary  │ Engine  │  │
│  └────┬─────┴────┬─────┴────┬──────┴────┬──────┴────┬─────┴────┬────┘  │
│       │          │          │           │           │          │        │
│  ┌────┴──────────┴──────────┴───────────┴───────────┴──────────┴────┐  │
│  │                         Services Layer                            │  │
│  ├─────────────────┬─────────────────┬────────────────┬─────────────┤  │
│  │ Image           │ PDF Handler     │ Model Router   │ Batch       │  │
│  │ Preprocessor    │ (PyMuPDF)       │ (Cost Opt.)    │ Processor   │  │
│  └─────────────────┴─────────────────┴────────────────┴─────────────┘  │
│                                   │                                      │
│  ┌────────────────────────────────┴──────────────────────────────────┐  │
│  │                    AI Extraction Pipeline                          │  │
│  │       Claude Sonnet 4.5 Vision / Haiku (emergentintegrations)      │  │
│  └────────────────────────────────┬──────────────────────────────────┘  │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              DATABASE (MongoDB)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  users   │  │ invoices │  │ vendors  │  │  batch   │  │corrections│  │
│  │          │  │          │  │          │  │  _queue  │  │           │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Invoice Processing

```
┌──────────┐    ┌─────────────┐    ┌────────────┐    ┌────────────┐
│ Camera/  │───▶│ Processing  │───▶│ AI Extract │───▶│  Review &  │
│ Gallery/ │    │   Screen    │    │  (Claude)  │    │   Edit     │
│ PDF      │    │             │    │            │    │   Screen   │
└──────────┘    └─────────────┘    └────────────┘    └─────┬──────┘
                                                           │
     ┌───────────────────────────────────────────────────────┘
     ▼
┌──────────┐    ┌─────────────┐    ┌────────────┐
│  Save    │───▶│   Ledger    │───▶│  Export    │
│ Invoice  │    │  Dashboard  │    │ Excel/CSV  │
└──────────┘    └─────────────┘    └────────────┘
```

---

## 3. Tech Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **React Native** | Cross-platform mobile framework | via Expo |
| **Expo** | Development toolkit & managed workflow | Latest |
| **TypeScript** | Type-safe JavaScript | 5.x |
| **Zustand** | Lightweight state management | 4.x |
| **Expo Router** | File-based navigation | 3.x |
| **expo-camera** | Camera access | - |
| **expo-image-picker** | Gallery/camera image selection | - |
| **expo-document-picker** | PDF file selection | - |
| **expo-file-system** | Local file operations | - |
| **expo-secure-store** | Secure token storage | - |
| **@expo/vector-icons** | MaterialCommunityIcons | - |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **FastAPI** | High-performance Python web framework | 0.100+ |
| **MongoDB** | NoSQL document database | - |
| **Motor** | Async MongoDB driver | - |
| **PyMuPDF (fitz)** | PDF text extraction | - |
| **Pillow** | Image preprocessing | - |
| **bcrypt** | Password hashing | - |
| **python-jose** | JWT authentication | - |
| **openpyxl** | Excel file generation | - |
| **emergentintegrations** | LLM API wrapper (Claude) | - |
| **APScheduler** | Batch job scheduling | - |

### AI/ML

| Technology | Purpose |
|------------|---------|
| **Claude Sonnet 4.5 Vision** | Primary invoice OCR + extraction |
| **Claude Haiku 4.5** | Cost-optimized batch processing |
| **emergentintegrations** | Unified LLM API wrapper |

---

## 4. Project Structure

```
ai-invoice-app/
├── PRD.MD                      # Product Requirements Document
├── DEVELOPER_GUIDE.md          # This documentation
├── design_guidelines.json      # UI/UX design tokens
├── README.md                   # Project intro
│
├── backend/                    # FastAPI Backend
│   ├── server.py              # Main API server (all routes)
│   ├── requirements.txt       # Python dependencies
│   ├── services/              # Business logic modules
│   │   ├── __init__.py
│   │   ├── image_preprocessor.py  # Image optimization for AI
│   │   ├── pdf_handler.py         # PDF text/image extraction
│   │   ├── model_router.py        # Smart model selection (cost opt)
│   │   └── batch_processor.py     # Async batch processing
│   └── tests/                 # Backend tests
│
├── frontend/                   # React Native (Expo) Frontend
│   ├── app/                   # Expo Router pages
│   │   ├── (auth)/            # Auth screens (login/register)
│   │   ├── (tabs)/            # Main tab navigation
│   │   │   ├── _layout.tsx    # Tab navigator config
│   │   │   ├── index.tsx      # Home/Dashboard
│   │   │   ├── capture.tsx    # Invoice capture options
│   │   │   ├── ledger.tsx     # Invoice list/ledger
│   │   │   ├── vendors.tsx    # Vendor directory
│   │   │   └── settings.tsx   # User settings
│   │   ├── processing.tsx     # AI processing animation
│   │   ├── review-invoice.tsx # Review & edit extracted data
│   │   ├── invoice-detail.tsx # Single invoice view
│   │   ├── export.tsx         # Export options screen
│   │   └── _layout.tsx        # Root layout
│   │
│   ├── src/                   # Source code
│   │   ├── components/        # Reusable UI components
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       └── Input.tsx
│   │   ├── constants/         # Design system constants
│   │   │   ├── Colors.ts      # Color palette
│   │   │   └── Layout.ts      # Spacing, typography, radius
│   │   ├── store/             # Zustand state stores
│   │   │   ├── authStore.ts   # Auth state & actions
│   │   │   └── invoiceStore.ts# Invoice state & actions
│   │   └── utils/             # Utility functions
│   │       └── api.ts         # API client with auth
│   │
│   ├── assets/                # Static assets (icons, images)
│   ├── app.json               # Expo configuration
│   ├── package.json           # Node dependencies
│   └── tsconfig.json          # TypeScript config
│
├── tests/                     # Integration tests
├── memory/                    # Agent memory/context files
└── test_reports/              # Test execution reports
```

---

## 5. Backend Implementation

### 5.1 Server Architecture (`backend/server.py`)

The backend is a single-file FastAPI application (~850 lines) organized into sections:

```python
# ─── Config ───────────────────────────────────────────────────────────────────
# MongoDB connection, JWT settings, API keys

# ─── Pydantic Models ──────────────────────────────────────────────────────────
# UserCreate, UserLogin, InvoiceCreate, ExportRequest, etc.

# ─── JWT Utilities ────────────────────────────────────────────────────────────
# create_token(), decode_token(), get_current_user()

# ─── AI Extraction ────────────────────────────────────────────────────────────
# EXTRACTION_SYSTEM_PROMPT, extract_invoice_from_image()
# validate_invoice_math(), detect_duplicates()

# ─── Auth Routes ──────────────────────────────────────────────────────────────
# POST /api/auth/register, /api/auth/login, GET /api/auth/me

# ─── Invoice Processing ───────────────────────────────────────────────────────
# POST /api/process-invoice

# ─── Invoice CRUD ─────────────────────────────────────────────────────────────
# POST/GET/PUT/DELETE /api/invoices, PATCH /api/invoices/:id/status

# ─── Vendors ─────────────────────────────────────────────────────────────────
# GET /api/vendors

# ─── Analytics ────────────────────────────────────────────────────────────────
# GET /api/analytics/summary

# ─── Export ───────────────────────────────────────────────────────────────────
# POST /api/export (Excel/CSV)
```

### 5.2 Services Layer

#### Image Preprocessor (`services/image_preprocessor.py`)

**Purpose:** Reduce Vision API token costs by 50-60%

```python
def preprocess_invoice_image(image_b64: str) -> Tuple[str, float]:
    """
    - Resize to max 1500x2000px (fewer vision tokens)
    - Convert to grayscale (invoices are text)
    - Enhance contrast (better OCR for faded text)
    - Sharpen for text clarity
    - Return quality score (blur detection)
    """
```

#### PDF Handler (`services/pdf_handler.py`)

**Purpose:** Free text extraction for digital PDFs (no AI tokens needed)

```python
def process_pdf(pdf_b64: str) -> Tuple[str, bool, int]:
    """
    - Digital PDF: extract text via PyMuPDF (FREE)
    - Scanned PDF: convert to image for vision API
    - Returns: (content, is_digital, page_count)
    """
```

#### Model Router (`services/model_router.py`)

**Purpose:** Select cheapest model that handles the task correctly

```python
def select_model(quality_score, user_plan, is_multipage, page_count) -> Tuple[str, str]:
    """
    Decision logic:
    - Premium plan → always Sonnet (best accuracy)
    - Low quality image → Sonnet (Haiku struggles with blur)
    - Multi-page complex PDF → Sonnet
    - Everything else → Haiku (5x cheaper)
    """
```

#### Batch Processor (`services/batch_processor.py`)

**Purpose:** Async processing for cost savings

```python
# Features:
# - Queue invoices for batch processing
# - Process every 15 minutes via APScheduler
# - Send push notifications when complete
# - 70-80% cost savings vs real-time Sonnet
```

---

## 6. Frontend Implementation

### 6.1 Navigation Structure

```
app/
├── (auth)/               # Auth group (unauthenticated)
│   ├── login.tsx
│   └── register.tsx
│
├── (tabs)/               # Main app (authenticated)
│   ├── _layout.tsx       # Tab bar configuration
│   ├── index.tsx         # Home/Dashboard (default tab)
│   ├── capture.tsx       # Add invoice options
│   ├── ledger.tsx        # Invoice list
│   ├── vendors.tsx       # Vendor directory
│   └── settings.tsx      # User profile & settings
│
├── processing.tsx        # AI processing (modal/full-screen)
├── review-invoice.tsx    # Review extracted data
├── invoice-detail.tsx    # Single invoice view
└── export.tsx            # Export options
```

### 6.2 State Management (Zustand)

#### Auth Store (`src/store/authStore.ts`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  setAuth: (user: User, token: string) => void;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}
```

#### Invoice Store (`src/store/invoiceStore.ts`)

```typescript
interface InvoiceState {
  invoices: Invoice[];
  total: number;
  isLoading: boolean;
  selectedInvoice: Invoice | null;
  analytics: AnalyticsData | null;
  
  fetchInvoices: (params?: Record<string, string>) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  refreshAll: () => Promise<void>;
}
```

### 6.3 Key Screens

#### Home Screen (`app/(tabs)/index.tsx`)

- Welcome header with business name
- Quick action: "Scan New Invoice" button
- Stats grid: Total invoices, This month, Pending, Overdue
- Top vendors horizontal scroll
- Recent invoices list

#### Capture Screen (`app/(tabs)/capture.tsx`)

Three capture options:
1. **Take Photo** - Camera with document overlay
2. **Upload Image** - Gallery picker
3. **Upload PDF** - Document picker

#### Processing Screen (`app/processing.tsx`)

- Animated AI processing indicator
- Step-by-step progress:
  1. Preprocessing image
  2. Running AI OCR
  3. Extracting fields
  4. Validating & checking duplicates
- Error handling with retry option

#### Review Screen (`app/review-invoice.tsx`)

- Original image preview toggle
- Editable fields with confidence indicators:
  - Vendor Information
  - Invoice Details
  - Amounts (GST breakdown)
  - Category & Status
  - Line Items display
- Duplicate/anomaly alerts
- Save to ledger button

#### Ledger Screen (`app/(tabs)/ledger.tsx`)

- Search bar (vendor, invoice #)
- Status filter chips (All, Pending, Paid, Overdue)
- Invoice list with:
  - Source icon (camera/gallery/PDF)
  - Vendor name & invoice number
  - Amount & status badge
  - Due date (if pending)
- Pull-to-refresh
- Export button → Export screen

#### Export Screen (`app/export.tsx`)

- Format selection: Excel (.xlsx) / CSV
- Date range filter (optional)
- Status filter
- Export includes: All fields, GST breakdown, Line items

---

## 7. AI/ML Pipeline

### 7.1 Extraction System Prompt

```
You are an expert invoice data extraction AI specializing in Indian business invoices.
Extract all invoice fields from the provided image and return ONLY valid JSON.

Return this exact JSON structure:
{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "vendor_name": "string or null",
  "vendor_gstin": "15-char string or null",
  "line_items": [...],
  "subtotal": "number or null",
  "cgst": "number or null",
  "sgst": "number or null",
  "igst": "number or null",
  "grand_total": "number",
  "confidence_scores": {...}
}

Rules:
1. For intra-state GST: extract CGST and SGST. For inter-state: IGST only.
2. All monetary amounts should be numbers (not strings).
3. Dates must be YYYY-MM-DD format.
4. If text is Hindi/Gujarati/Tamil, extract and transliterate vendor names to English.
5. Confidence 95-100=very clear, 70-94=readable, 40-69=partial, 0-39=unclear.
```

### 7.2 Validation Agent

```python
def validate_invoice_math(data: dict) -> list:
    """
    Checks:
    1. total_tax == CGST + SGST + IGST
    2. grand_total == subtotal - discount + total_tax
    3. Line items sum == subtotal
    
    Returns: List of validation issues with field, expected, found
    """
```

### 7.3 Duplicate Detection

```python
async def detect_duplicates(user_id: str, data: dict) -> list:
    """
    Checks against existing invoices:
    - Same vendor + same invoice number (0.5 score)
    - Same vendor + same amount (0.3 score)
    - Same vendor + same date (0.2 score)
    
    Returns candidates with similarity >= 0.5
    """
```

---

## 8. API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/login` | POST | Login and get JWT token |
| `/api/auth/me` | GET | Get current user profile |

### Invoice Processing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/process-invoice` | POST | Extract data from image/PDF |

**Request:**
```json
{
  "image_base64": "...",
  "source_type": "camera|gallery|pdf",
  "mime_type": "image/jpeg|application/pdf"
}
```

**Response:**
```json
{
  "extracted_data": {...},
  "confidence_scores": {...},
  "overall_confidence": 85,
  "validation_issues": [...],
  "duplicate_candidates": [...]
}
```

### Invoices CRUD

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices` | POST | Create invoice |
| `/api/invoices` | GET | List invoices (with filters) |
| `/api/invoices/{id}` | GET | Get single invoice |
| `/api/invoices/{id}` | PUT | Update invoice |
| `/api/invoices/{id}` | DELETE | Delete invoice |
| `/api/invoices/{id}/status` | PATCH | Update status only |

### Other Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vendors` | GET | List vendors with stats |
| `/api/analytics/summary` | GET | Dashboard analytics |
| `/api/export` | POST | Export invoices (Excel/CSV) |
| `/api/corrections` | POST | Log field corrections |

---

## 9. Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  business_name: string;
  gstin?: string;
  business_type?: string;
  plan: 'free' | 'starter' | 'pro';
  created_at: Date;
}
```

### Invoice

```typescript
interface Invoice {
  id: string;
  user_id: string;
  invoice_number?: string;
  invoice_date?: string;        // YYYY-MM-DD
  due_date?: string;
  vendor_name?: string;
  vendor_gstin?: string;
  vendor_phone?: string;
  vendor_address?: string;
  buyer_name?: string;
  buyer_gstin?: string;
  line_items: LineItem[];
  subtotal?: number;
  discount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total_tax?: number;
  grand_total: number;
  currency: string;             // Default: "INR"
  payment_terms?: string;
  status: 'pending' | 'paid' | 'overdue';
  category?: string;
  notes?: string;
  source_type: 'camera' | 'gallery' | 'pdf';
  confidence_score?: number;
  is_duplicate: boolean;
  has_anomaly: boolean;
  created_at: Date;
  updated_at: Date;
}

interface LineItem {
  description: string;
  hsn_code?: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  line_total: number;
  gst_rate?: number;
}
```

### Analytics Response

```typescript
interface AnalyticsData {
  overall: {
    total_invoices: number;
    total_amount: number;
    paid_amount: number;
    pending_amount: number;
    overdue_amount: number;
  };
  this_month: {
    count: number;
    amount: number;
  };
  top_vendors: Array<{
    name: string;
    total_spend: number;
    count: number;
  }>;
  monthly_trend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  categories: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
  status_breakdown: Record<string, {
    count: number;
    amount: number;
  }>;
}
```

---

## 10. Key Features Implemented

### ✅ MVP Features (Completed)

| Feature | Status | Location |
|---------|--------|----------|
| Camera capture | ✅ | `capture.tsx` |
| Gallery upload | ✅ | `capture.tsx` |
| PDF upload | ✅ | `capture.tsx` |
| AI OCR extraction (Claude Vision) | ✅ | `server.py` |
| Field confidence scores | ✅ | `review-invoice.tsx` |
| Review & edit screen | ✅ | `review-invoice.tsx` |
| Invoice ledger with search/filter | ✅ | `ledger.tsx` |
| Vendor directory | ✅ | `vendors.tsx` |
| Excel export | ✅ | `export.tsx`, `server.py` |
| CSV export | ✅ | `export.tsx`, `server.py` |
| Analytics dashboard | ✅ | `index.tsx` (home) |
| Math validation | ✅ | `server.py` |
| Duplicate detection | ✅ | `server.py` |
| GST field extraction (CGST/SGST/IGST) | ✅ | Throughout |
| Regional language support (OCR) | ✅ | AI prompt |
| JWT authentication | ✅ | `server.py` |
| User registration/login | ✅ | `(auth)/` screens |

### ✅ Cost Optimization (Sprint 1)

| Optimization | Savings | Implementation |
|--------------|---------|----------------|
| Image preprocessing | 50-60% tokens | `image_preprocessor.py` |
| Digital PDF text extraction | 100% (no AI) | `pdf_handler.py` |
| Smart model routing | 5x cheaper (Haiku vs Sonnet) | `model_router.py` |
| Batch processing | Additional cost reduction | `batch_processor.py` |

### 📋 Pending/Future (v2)

| Feature | PRD Reference |
|---------|---------------|
| Payment due reminders (push) | F6.1 |
| Anomaly detection alerts | F6.3 |
| Weekly summary notification | F6.4 |
| Multi-user roles | F7 |
| WhatsApp integration | F8 |
| Tally export format | F9 |
| Google Sheets sync | F5.3 |
| Calendar view | F4.4 |
| Offline mode + sync | PRD Section 6.4 |

---

## 11. Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
MONGO_URL=mongodb://localhost:27017
DB_NAME=invoiceai_db
JWT_SECRET=your-secret-key-here
EMERGENT_LLM_KEY=your-api-key-here
EOF

# Run server
uvicorn server:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set backend URL
echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > .env

# Start Expo
npx expo start

# Run on:
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Scan QR code with Expo Go app
```

---

## 12. Environment Variables

### Backend (`.env`)

```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=invoiceai_db

# Authentication
JWT_SECRET=your-secure-secret-key

# AI API
EMERGENT_LLM_KEY=your-emergent-api-key

# Optional: Batch processing
BATCH_ENABLED=true
```

### Frontend (`.env`)

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## 13. Cost Optimization Strategies

### Current Implementation

| Strategy | How It Works | Savings |
|----------|--------------|---------|
| **Image Preprocessing** | Resize, grayscale, compress before AI | 50-60% vision tokens |
| **Digital PDF Detection** | Extract text via PyMuPDF (free) | 100% for digital PDFs |
| **Model Routing** | Use Haiku for standard invoices | 5x cheaper than Sonnet |
| **Batch Processing** | Queue free-tier users | Async = lower priority |
| **Prompt Caching** | Reuse system prompt | 90% cache savings |

### Cost Comparison

| Processing Type | Model | Cost per Invoice (approx) |
|-----------------|-------|---------------------------|
| Real-time, clear image | Haiku | ₹0.25 - 0.50 |
| Real-time, blurry image | Sonnet | ₹1.00 - 1.50 |
| Batch processing | Haiku | ₹0.15 - 0.30 |
| Digital PDF (text) | Haiku (text only) | ₹0.05 - 0.10 |

---

## 14. Future Roadmap

### Phase 2 (v1.5)

- [ ] Push notifications (payment reminders)
- [ ] Offline capture with sync queue
- [ ] WhatsApp share integration
- [ ] Google Sheets sync

### Phase 3 (v2.0)

- [ ] Multi-user & roles (owner/accountant/staff)
- [ ] WhatsApp Business API bot
- [ ] Tally/QuickBooks/Zoho integration
- [ ] Bank statement matching
- [ ] Advanced analytics & reports

### Technical Improvements

- [ ] SQLite local cache (faster offline)
- [ ] Image caching strategy
- [ ] Background sync service
- [ ] E2E encryption for sensitive data

---

## Contributing

1. Check open issues or PRD for feature requirements
2. Create feature branch from `main`
3. Follow existing code patterns and styling
4. Add tests for new features
5. Submit PR with clear description

---

## License

Proprietary - All rights reserved.

---

*Last updated: March 2026*  
*Document version: 1.0*
