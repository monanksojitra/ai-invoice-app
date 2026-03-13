# InvoiceAI — Product Requirements Document

**Version:** 1.0  
**Date:** March 2026  
**Status:** MVP Implementation Complete

---

## Architecture

### Backend (FastAPI + MongoDB)
- **Framework:** FastAPI with async motor MongoDB driver
- **Auth:** JWT (python-jose) + bcrypt password hashing, 30-day tokens
- **AI:** Claude Sonnet 4.5 Vision via emergentintegrations library
- **Export:** openpyxl (Excel), csv module (CSV)

### Frontend (Expo React Native)
- **Navigation:** Expo Router (file-based) with auth groups
- **State:** Zustand stores (authStore, invoiceStore)
- **Token Storage:** expo-secure-store (native) + AsyncStorage (web)
- **UI:** Custom components with "Indian Commerce 2.0" design theme

---

## What's Been Implemented (v1.0 - March 2026)

### Backend APIs
- `POST /api/auth/register` - User registration (email/password/name/business)
- `POST /api/auth/login` - Login with JWT token response
- `GET /api/auth/me` - Current user profile
- `POST /api/process-invoice` - AI invoice extraction (Claude Vision)
- `POST /api/invoices` - Save invoice after review
- `GET /api/invoices` - List with search/filter/pagination
- `GET /api/invoices/{id}` - Single invoice detail
- `PUT /api/invoices/{id}` - Update invoice
- `DELETE /api/invoices/{id}` - Delete invoice
- `PATCH /api/invoices/{id}/status` - Update payment status
- `GET /api/vendors` - Vendor list with spend aggregation
- `GET /api/analytics/summary` - Dashboard stats + monthly trend + top vendors
- `POST /api/export` - Export to Excel/CSV (base64 response)
- `POST /api/corrections` - Log AI correction for learning loop

### AI Pipeline
- **OCR Agent:** Claude Sonnet 4.5 Vision (claude-sonnet-4-5-20250929)
- **Extraction Agent:** Structured JSON output with confidence scores
- **Validation Agent:** Math validation (totals, tax calculations)
- **Duplicate Detection:** Similarity scoring against existing records
- **Fields:** 20+ invoice fields including CGST/SGST/IGST (Indian GST)

### Frontend Screens
- **(auth)/login.tsx** - Login form with validation
- **(auth)/register.tsx** - 2-step registration (personal + business)
- **(tabs)/index.tsx** - Dashboard (stats, recent invoices, quick capture)
- **(tabs)/ledger.tsx** - Invoice list with search/filter/sort
- **(tabs)/capture.tsx** - 3-way capture (camera/gallery/PDF)
- **(tabs)/vendors.tsx** - Vendor list with spend analytics
- **(tabs)/settings.tsx** - Profile, plan, app settings
- **processing.tsx** - AI processing animation screen
- **review-invoice.tsx** - Edit extracted data with confidence indicators
- **invoice-detail.tsx** - Full invoice view with status management
- **export.tsx** - Export to Excel/CSV with filters

---

## Core Requirements (Static)

### G1: Invoice Capture ✅
- Camera photo capture (expo-camera)
- Gallery upload (expo-image-picker) 
- PDF upload (expo-document-picker)

### G2: AI Extraction ✅
- Claude Sonnet 4.5 Vision
- Confidence scores per field
- Indian GST fields (CGST/SGST/IGST/GSTIN)
- Math validation

### G3: Export ✅
- Excel (.xlsx) with formatting + line items sheet
- CSV (Tally/Zoho compatible)
- File sharing via expo-sharing

### G4: Ledger/Dashboard ✅
- Invoice CRUD
- Search by vendor/invoice number
- Filter by status/date
- Analytics with top vendors + monthly trends

### G5: Auth & Security ✅
- JWT auth with bcrypt
- Platform-aware token storage
- Protected routes

---

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] Google Sheets OAuth sync
- [ ] Push notifications for payment reminders
- [ ] Offline queue (process when internet returns)

### P1 (High Priority)
- [ ] PDF to image conversion (PyMuPDF) on backend for better OCR
- [ ] Analytics charts (Victory Native or react-native-chart-kit)
- [ ] Edit existing invoice with corrections logging
- [ ] WhatsApp share target integration

### P2 (Future)
- [ ] Multi-user roles (owner, accountant, staff)
- [ ] Tally XML export format
- [ ] Bank statement matching
- [ ] Subscription billing (Razorpay)
- [ ] Regional language UI (Hindi, Gujarati)
- [ ] Anomaly detection agent

---

## Next Tasks
1. Test full invoice capture → AI extraction → save flow
2. Implement react-native-chart-kit charts on dashboard
3. Add offline queue processing
4. Set up push notifications
5. Add Google Sheets sync
