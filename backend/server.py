"""InvoiceAI Backend — FastAPI + MongoDB + Claude Vision AI"""

from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any, Annotated
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
import json
import base64
import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
import csv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ─── Config ───────────────────────────────────────────────────────────────────
mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
db_name = os.environ.get("DB_NAME", "invoiceai_db")
JWT_SECRET = os.environ.get("JWT_SECRET", "invoiceai-secret")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

app = FastAPI(title="InvoiceAI API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ─── Pydantic Models ──────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    business_name: str
    gstin: Optional[str] = None
    business_type: Optional[str] = "retail"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    business_name: str
    gstin: Optional[str] = None
    business_type: Optional[str] = None
    plan: str = "free"
    created_at: datetime

class LineItemModel(BaseModel):
    description: str
    hsn_code: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    line_total: float = 0.0
    gst_rate: Optional[float] = None

class InvoiceCreate(BaseModel):
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    vendor_name: Optional[str] = None
    vendor_gstin: Optional[str] = None
    vendor_phone: Optional[str] = None
    vendor_address: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_gstin: Optional[str] = None
    line_items: List[LineItemModel] = []
    subtotal: Optional[float] = None
    discount: Optional[float] = 0.0
    cgst: Optional[float] = 0.0
    sgst: Optional[float] = 0.0
    igst: Optional[float] = 0.0
    total_tax: Optional[float] = 0.0
    grand_total: float = 0.0
    currency: str = "INR"
    payment_terms: Optional[str] = None
    status: str = "pending"
    category: Optional[str] = None
    notes: Optional[str] = None
    source_type: str = "camera"
    confidence_score: Optional[int] = None
    is_duplicate: bool = False
    has_anomaly: bool = False

class InvoiceOut(InvoiceCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

class ProcessInvoiceRequest(BaseModel):
    image_base64: str
    source_type: str = "camera"
    mime_type: str = "image/jpeg"

class ExportRequest(BaseModel):
    format: str = "excel"
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    vendor_name: Optional[str] = None
    status_filter: Optional[str] = None

class CorrectionCreate(BaseModel):
    invoice_id: str
    field_name: str
    original_value: str
    corrected_value: str

class InvoiceStatusUpdate(BaseModel):
    status: str

# ─── JWT Utilities ────────────────────────────────────────────────────────────

def create_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    payload = decode_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()

def verify_password(pwd: str, hashed: str) -> bool:
    return bcrypt.checkpw(pwd.encode(), hashed.encode())

# ─── AI Extraction ────────────────────────────────────────────────────────────

EXTRACTION_SYSTEM_PROMPT = """You are an expert invoice data extraction AI specializing in Indian business invoices.
Extract all invoice fields from the provided image and return ONLY valid JSON — no markdown, no explanation.

Return this exact JSON structure:
{
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "vendor_name": "string or null",
  "vendor_gstin": "15-char string or null",
  "vendor_phone": "string or null",
  "vendor_address": "string or null",
  "buyer_name": "string or null",
  "buyer_gstin": "string or null",
  "line_items": [
    {
      "description": "string",
      "hsn_code": "string or null",
      "quantity": "number or null",
      "unit": "string or null",
      "unit_price": "number or null",
      "line_total": "number",
      "gst_rate": "number or null"
    }
  ],
  "subtotal": "number or null",
  "discount": "number or null",
  "cgst": "number or null",
  "sgst": "number or null",
  "igst": "number or null",
  "total_tax": "number or null",
  "grand_total": "number",
  "currency": "INR",
  "payment_terms": "string or null",
  "notes": "string or null",
  "confidence_scores": {
    "invoice_number": 0-100,
    "invoice_date": 0-100,
    "vendor_name": 0-100,
    "grand_total": 0-100,
    "line_items": 0-100
  }
}

Rules:
1. For intra-state GST: extract CGST and SGST. For inter-state: extract IGST only.
2. All monetary amounts should be numbers (not strings).
3. Dates must be YYYY-MM-DD format.
4. If text is Hindi/Gujarati/Tamil, extract data and transliterate vendor/buyer names to English.
5. Confidence 95-100=very clear, 70-94=readable, 40-69=partially visible, 0-39=unclear.
6. If image is not an invoice, return {"error": "Not an invoice"}.
7. Return null for missing fields, not empty strings."""

async def extract_invoice_from_image(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """Run AI extraction pipeline on invoice image."""
    try:
        session_id = str(uuid.uuid4())
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=EXTRACTION_SYSTEM_PROMPT
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text="Extract all invoice data from this image and return the JSON as specified.",
            file_contents=[image_content]
        )
        response = await chat.send_message(user_message)

        # Strip markdown fences if present
        text = response.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        extracted = json.loads(text)
        if "error" in extracted:
            return {"error": extracted["error"]}
        return extracted

    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}, response: {response[:500]}")
        return {"error": "Failed to parse extraction response"}
    except Exception as e:
        logger.error(f"Extraction error: {e}")
        return {"error": str(e)}

def validate_invoice_math(data: dict) -> list:
    """Validate invoice math and return list of issues."""
    issues = []
    try:
        subtotal = float(data.get("subtotal") or 0)
        discount = float(data.get("discount") or 0)
        cgst = float(data.get("cgst") or 0)
        sgst = float(data.get("sgst") or 0)
        igst = float(data.get("igst") or 0)
        total_tax = float(data.get("total_tax") or 0)
        grand_total = float(data.get("grand_total") or 0)

        # Check total_tax = cgst + sgst + igst
        computed_tax = cgst + sgst + igst
        if abs(computed_tax - total_tax) > 1.0 and total_tax > 0:
            issues.append({
                "field": "total_tax",
                "issue_type": "math_error",
                "message": f"Total tax ({total_tax}) ≠ CGST+SGST+IGST ({computed_tax:.2f})",
                "expected": str(computed_tax),
                "found": str(total_tax)
            })

        # Check grand_total = subtotal - discount + total_tax
        if subtotal > 0:
            computed_total = subtotal - discount + computed_tax
            if abs(computed_total - grand_total) > 2.0:
                issues.append({
                    "field": "grand_total",
                    "issue_type": "math_error",
                    "message": f"Grand total ({grand_total}) ≠ Subtotal-Discount+Tax ({computed_total:.2f})",
                    "expected": str(computed_total),
                    "found": str(grand_total)
                })

        # Validate line items sum
        line_items = data.get("line_items", [])
        if line_items and subtotal > 0:
            items_total = sum(float(item.get("line_total") or 0) for item in line_items)
            if abs(items_total - subtotal) > 2.0:
                issues.append({
                    "field": "subtotal",
                    "issue_type": "math_error",
                    "message": f"Line items total ({items_total:.2f}) ≠ subtotal ({subtotal})",
                    "expected": str(items_total),
                    "found": str(subtotal)
                })
    except Exception:
        pass
    return issues

async def detect_duplicates(user_id: str, data: dict) -> list:
    """Check for potential duplicate invoices."""
    candidates = []
    try:
        vendor = data.get("vendor_name", "")
        invoice_no = data.get("invoice_number", "")
        grand_total = float(data.get("grand_total") or 0)
        invoice_date = data.get("invoice_date", "")

        query = {"user_id": user_id}
        if vendor:
            query["vendor_name"] = {"$regex": f"^{vendor}$", "$options": "i"}

        existing = await db.invoices.find(query).limit(50).to_list(50)
        for inv in existing:
            reasons = []
            score = 0.0
            if invoice_no and inv.get("invoice_number") == invoice_no:
                reasons.append("same_invoice_number")
                score += 0.5
            if grand_total > 0 and abs(float(inv.get("grand_total", 0)) - grand_total) < 1.0:
                reasons.append("same_amount")
                score += 0.3
            if invoice_date and inv.get("invoice_date") == invoice_date:
                reasons.append("same_date")
                score += 0.2
            if score >= 0.5:
                candidates.append({
                    "invoice_id": inv["id"],
                    "similarity_score": round(score, 2),
                    "match_reasons": reasons,
                    "vendor_name": inv.get("vendor_name"),
                    "invoice_number": inv.get("invoice_number"),
                    "grand_total": inv.get("grand_total"),
                    "invoice_date": inv.get("invoice_date")
                })
    except Exception as e:
        logger.error(f"Duplicate detection error: {e}")
    return candidates

# ─── Auth Routes ──────────────────────────────────────────────────────────────

@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "name": data.name,
        "business_name": data.business_name,
        "gstin": data.gstin,
        "business_type": data.business_type,
        "plan": "free",
        "created_at": datetime.now(timezone.utc)
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.email)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": data.email,
            "name": data.name,
            "business_name": data.business_name,
            "plan": "free"
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "business_name": user["business_name"],
            "plan": user.get("plan", "free")
        }
    }

@api_router.get("/auth/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "business_name": current_user["business_name"],
        "gstin": current_user.get("gstin"),
        "business_type": current_user.get("business_type"),
        "plan": current_user.get("plan", "free"),
        "created_at": current_user["created_at"]
    }

# ─── Invoice Processing ───────────────────────────────────────────────────────

@api_router.post("/process-invoice")
async def process_invoice(req: ProcessInvoiceRequest, current_user: dict = Depends(get_current_user)):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI API key not configured")

    # Run extraction
    extracted = await extract_invoice_from_image(req.image_base64, req.mime_type)
    if "error" in extracted:
        raise HTTPException(status_code=422, detail=extracted["error"])

    # Validate math
    validation_issues = validate_invoice_math(extracted)

    # Detect duplicates
    duplicate_candidates = await detect_duplicates(current_user["id"], extracted)

    # Extract confidence scores
    confidence_scores = extracted.pop("confidence_scores", {})
    overall_confidence = int(sum(confidence_scores.values()) / max(len(confidence_scores), 1)) if confidence_scores else 80

    return {
        "extracted_data": extracted,
        "confidence_scores": confidence_scores,
        "overall_confidence": overall_confidence,
        "validation_issues": validation_issues,
        "duplicate_candidates": duplicate_candidates,
        "source_type": req.source_type
    }

# ─── Invoice CRUD ─────────────────────────────────────────────────────────────

@api_router.post("/invoices", response_model=InvoiceOut)
async def create_invoice(data: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    invoice_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # Upsert vendor
    if data.vendor_name:
        await db.vendors.update_one(
            {"user_id": current_user["id"], "name": {"$regex": f"^{data.vendor_name}$", "$options": "i"}},
            {"$setOnInsert": {
                "id": str(uuid.uuid4()),
                "user_id": current_user["id"],
                "name": data.vendor_name,
                "gstin": data.vendor_gstin,
                "phone": data.vendor_phone,
                "address": data.vendor_address,
                "created_at": now
            }, "$inc": {"total_invoices": 1, "total_spend": float(data.grand_total or 0)}},
            upsert=True
        )

    invoice_doc = {
        "id": invoice_id,
        "user_id": current_user["id"],
        **data.dict(),
        "line_items": [item.dict() for item in data.line_items],
        "created_at": now,
        "updated_at": now
    }
    await db.invoices.insert_one(invoice_doc)
    return {**invoice_doc}

@api_router.get("/invoices")
async def list_invoices(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    vendor_name: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"user_id": current_user["id"]}
    if search:
        query["$or"] = [
            {"vendor_name": {"$regex": search, "$options": "i"}},
            {"invoice_number": {"$regex": search, "$options": "i"}},
            {"buyer_name": {"$regex": search, "$options": "i"}}
        ]
    if status_filter:
        query["status"] = status_filter
    if vendor_name:
        query["vendor_name"] = {"$regex": vendor_name, "$options": "i"}
    if date_from:
        query["invoice_date"] = query.get("invoice_date", {})
        query["invoice_date"]["$gte"] = date_from
    if date_to:
        query["invoice_date"] = query.get("invoice_date", {})
        query["invoice_date"]["$lte"] = date_to

    total = await db.invoices.count_documents(query)
    invoices = await db.invoices.find(query).sort("created_at", -1).skip((page - 1) * limit).limit(limit).to_list(limit)
    for inv in invoices:
        inv.pop("_id", None)

    # Summary
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {
            "_id": None,
            "total_amount": {"$sum": "$grand_total"},
            "pending_amount": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, "$grand_total", 0]}},
            "overdue_amount": {"$sum": {"$cond": [{"$eq": ["$status", "overdue"]}, "$grand_total", 0]}}
        }}
    ]
    summary_result = await db.invoices.aggregate(pipeline).to_list(1)
    summary = summary_result[0] if summary_result else {"total_amount": 0, "pending_amount": 0, "overdue_amount": 0}
    summary.pop("_id", None)

    return {"invoices": invoices, "total": total, "page": page, "limit": limit, "summary": summary}

@api_router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": invoice_id, "user_id": current_user["id"]})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    inv.pop("_id", None)
    return inv

@api_router.put("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, data: InvoiceCreate, current_user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": invoice_id, "user_id": current_user["id"]})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    update_data = {**data.dict(), "line_items": [item.dict() for item in data.line_items], "updated_at": datetime.now(timezone.utc)}
    await db.invoices.update_one({"id": invoice_id}, {"$set": update_data})
    updated = await db.invoices.find_one({"id": invoice_id})
    updated.pop("_id", None)
    return updated

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": invoice_id, "user_id": current_user["id"]})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    await db.invoices.delete_one({"id": invoice_id})
    return {"message": "Invoice deleted"}

@api_router.patch("/invoices/{invoice_id}/status")
async def update_invoice_status(invoice_id: str, data: InvoiceStatusUpdate, current_user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": invoice_id, "user_id": current_user["id"]})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    await db.invoices.update_one({"id": invoice_id}, {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc)}})
    return {"message": "Status updated", "status": data.status}

# ─── Vendors ─────────────────────────────────────────────────────────────────

@api_router.get("/vendors")
async def list_vendors(current_user: dict = Depends(get_current_user)):
    pipeline = [
        {"$match": {"user_id": current_user["id"]}},
        {"$group": {
            "_id": "$vendor_name",
            "total_invoices": {"$sum": 1},
            "total_spend": {"$sum": "$grand_total"},
            "last_invoice_date": {"$max": "$invoice_date"},
            "vendor_gstin": {"$first": "$vendor_gstin"},
            "vendor_phone": {"$first": "$vendor_phone"}
        }},
        {"$sort": {"total_spend": -1}}
    ]
    vendors = await db.invoices.aggregate(pipeline).to_list(100)
    return [
        {
            "name": v["_id"],
            "total_invoices": v["total_invoices"],
            "total_spend": round(v["total_spend"], 2),
            "last_invoice_date": v["last_invoice_date"],
            "gstin": v.get("vendor_gstin"),
            "phone": v.get("vendor_phone")
        }
        for v in vendors if v["_id"]
    ]

# ─── Analytics ────────────────────────────────────────────────────────────────

@api_router.get("/analytics/summary")
async def analytics_summary(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).strftime("%Y-%m-%d")

    # Overall stats
    all_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "total_invoices": {"$sum": 1},
            "total_amount": {"$sum": "$grand_total"},
            "paid_amount": {"$sum": {"$cond": [{"$eq": ["$status", "paid"]}, "$grand_total", 0]}},
            "pending_amount": {"$sum": {"$cond": [{"$eq": ["$status", "pending"]}, "$grand_total", 0]}},
            "overdue_amount": {"$sum": {"$cond": [{"$eq": ["$status", "overdue"]}, "$grand_total", 0]}}
        }}
    ]
    all_result = await db.invoices.aggregate(all_pipeline).to_list(1)
    stats = all_result[0] if all_result else {"total_invoices": 0, "total_amount": 0, "paid_amount": 0, "pending_amount": 0, "overdue_amount": 0}
    stats.pop("_id", None)

    # This month stats
    month_pipeline = [
        {"$match": {"user_id": user_id, "invoice_date": {"$gte": month_start}}},
        {"$group": {"_id": None, "count": {"$sum": 1}, "amount": {"$sum": "$grand_total"}}}
    ]
    month_result = await db.invoices.aggregate(month_pipeline).to_list(1)
    month_stats = month_result[0] if month_result else {"count": 0, "amount": 0}
    month_stats.pop("_id", None)

    # Top vendors
    vendor_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$vendor_name", "total_spend": {"$sum": "$grand_total"}, "count": {"$sum": 1}}},
        {"$sort": {"total_spend": -1}},
        {"$limit": 5}
    ]
    top_vendors = await db.invoices.aggregate(vendor_pipeline).to_list(5)
    top_vendors = [{"name": v["_id"], "total_spend": round(v["total_spend"], 2), "count": v["count"]} for v in top_vendors if v["_id"]]

    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(5, -1, -1):
        month_date = now.replace(day=1) - timedelta(days=i * 30)
        m_start = month_date.replace(day=1).strftime("%Y-%m-%d")
        if month_date.month == 12:
            m_end = month_date.replace(year=month_date.year + 1, month=1, day=1).strftime("%Y-%m-%d")
        else:
            m_end = month_date.replace(month=month_date.month + 1, day=1).strftime("%Y-%m-%d")
        trend_result = await db.invoices.aggregate([
            {"$match": {"user_id": user_id, "invoice_date": {"$gte": m_start, "$lt": m_end}}},
            {"$group": {"_id": None, "amount": {"$sum": "$grand_total"}, "count": {"$sum": 1}}}
        ]).to_list(1)
        trend_data = trend_result[0] if trend_result else {"amount": 0, "count": 0}
        monthly_trend.append({"month": month_date.strftime("%b %Y"), "amount": round(trend_data.get("amount", 0), 2), "count": trend_data.get("count", 0)})

    # Category breakdown
    category_pipeline = [
        {"$match": {"user_id": user_id, "category": {"$ne": None}}},
        {"$group": {"_id": "$category", "amount": {"$sum": "$grand_total"}, "count": {"$sum": 1}}},
        {"$sort": {"amount": -1}}
    ]
    categories = await db.invoices.aggregate(category_pipeline).to_list(10)
    category_data = [{"category": c["_id"], "amount": round(c["amount"], 2), "count": c["count"]} for c in categories]

    # Status breakdown
    status_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "amount": {"$sum": "$grand_total"}}}
    ]
    status_data = await db.invoices.aggregate(status_pipeline).to_list(10)
    status_breakdown = {s["_id"]: {"count": s["count"], "amount": round(s["amount"], 2)} for s in status_data if s["_id"]}

    return {
        "overall": stats,
        "this_month": month_stats,
        "top_vendors": top_vendors,
        "monthly_trend": monthly_trend,
        "categories": category_data,
        "status_breakdown": status_breakdown
    }

# ─── Export ───────────────────────────────────────────────────────────────────

@api_router.post("/export")
async def export_invoices(req: ExportRequest, current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]}
    if req.date_from:
        query["invoice_date"] = query.get("invoice_date", {})
        query["invoice_date"]["$gte"] = req.date_from
    if req.date_to:
        query["invoice_date"] = query.get("invoice_date", {})
        query["invoice_date"]["$lte"] = req.date_to
    if req.vendor_name:
        query["vendor_name"] = {"$regex": req.vendor_name, "$options": "i"}
    if req.status_filter:
        query["status"] = req.status_filter

    invoices = await db.invoices.find(query).sort("invoice_date", -1).to_list(10000)

    if req.format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        headers = ["Invoice ID", "Invoice No", "Date", "Due Date", "Vendor", "Vendor GSTIN",
                   "Subtotal", "Discount", "CGST", "SGST", "IGST", "Total Tax", "Grand Total",
                   "Currency", "Status", "Category", "Source", "Notes"]
        writer.writerow(headers)
        for inv in invoices:
            writer.writerow([
                inv.get("id"), inv.get("invoice_number"), inv.get("invoice_date"),
                inv.get("due_date"), inv.get("vendor_name"), inv.get("vendor_gstin"),
                inv.get("subtotal"), inv.get("discount"), inv.get("cgst"), inv.get("sgst"),
                inv.get("igst"), inv.get("total_tax"), inv.get("grand_total"),
                inv.get("currency", "INR"), inv.get("status"), inv.get("category"),
                inv.get("source_type"), inv.get("notes")
            ])
        csv_bytes = output.getvalue().encode("utf-8")
        b64 = base64.b64encode(csv_bytes).decode()
        return {"format": "csv", "filename": f"InvoiceAI_Export.csv", "data_base64": b64, "count": len(invoices)}

    else:  # Excel
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Invoices"

        header_font = Font(bold=True, color="FFFFFF", size=11)
        header_fill = PatternFill("solid", fgColor="1E1B4B")
        alt_fill = PatternFill("solid", fgColor="F3F4F6")
        center = Alignment(horizontal="center")

        headers = ["Invoice ID", "Invoice No", "Date", "Due Date", "Vendor Name", "Vendor GSTIN",
                   "Buyer Name", "Subtotal (₹)", "Discount (₹)", "CGST (₹)", "SGST (₹)",
                   "IGST (₹)", "Total Tax (₹)", "Grand Total (₹)", "Currency", "Status",
                   "Category", "Source", "Notes", "Created At"]
        for col, h in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=h)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center

        for row_idx, inv in enumerate(invoices, 2):
            fill = alt_fill if row_idx % 2 == 0 else None
            row_data = [
                inv.get("id"), inv.get("invoice_number"), inv.get("invoice_date"),
                inv.get("due_date"), inv.get("vendor_name"), inv.get("vendor_gstin"),
                inv.get("buyer_name"), inv.get("subtotal"), inv.get("discount"),
                inv.get("cgst"), inv.get("sgst"), inv.get("igst"), inv.get("total_tax"),
                inv.get("grand_total"), inv.get("currency", "INR"), inv.get("status"),
                inv.get("category"), inv.get("source_type"), inv.get("notes"),
                inv.get("created_at").strftime("%Y-%m-%d") if isinstance(inv.get("created_at"), datetime) else str(inv.get("created_at", ""))
            ]
            for col, value in enumerate(row_data, 1):
                cell = ws.cell(row=row_idx, column=col, value=value)
                if fill:
                    cell.fill = fill

        # Auto-width
        for col in ws.columns:
            max_len = max((len(str(cell.value)) for cell in col if cell.value), default=10)
            ws.column_dimensions[col[0].column_letter].width = min(max_len + 2, 40)

        # Line items sheet
        ws2 = wb.create_sheet("Line Items")
        li_headers = ["Invoice ID", "Description", "HSN Code", "Qty", "Unit", "Unit Price", "Line Total", "GST %"]
        for col, h in enumerate(li_headers, 1):
            cell = ws2.cell(row=1, column=col, value=h)
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = center

        li_row = 2
        for inv in invoices:
            for item in inv.get("line_items", []):
                ws2.cell(row=li_row, column=1, value=inv.get("id"))
                ws2.cell(row=li_row, column=2, value=item.get("description"))
                ws2.cell(row=li_row, column=3, value=item.get("hsn_code"))
                ws2.cell(row=li_row, column=4, value=item.get("quantity"))
                ws2.cell(row=li_row, column=5, value=item.get("unit"))
                ws2.cell(row=li_row, column=6, value=item.get("unit_price"))
                ws2.cell(row=li_row, column=7, value=item.get("line_total"))
                ws2.cell(row=li_row, column=8, value=item.get("gst_rate"))
                li_row += 1

        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        b64 = base64.b64encode(buffer.read()).decode()
        return {"format": "excel", "filename": "InvoiceAI_Export.xlsx", "data_base64": b64, "count": len(invoices)}

# ─── Corrections ─────────────────────────────────────────────────────────────

@api_router.post("/corrections")
async def log_correction(data: CorrectionCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        **data.dict(),
        "created_at": datetime.now(timezone.utc)
    }
    await db.corrections.insert_one(doc)
    return {"message": "Correction logged"}

# ─── Health ───────────────────────────────────────────────────────────────────

@api_router.get("/health")
async def health():
    return {"status": "ok", "service": "InvoiceAI Backend"}

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
