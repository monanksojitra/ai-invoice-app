"""
Create MongoDB indexes for InvoiceAI collections
Run this script once to set up required indexes for optimal performance and security
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "invoiceai_db")


async def create_indexes():
    """Create all necessary indexes for the database"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    
    print("Creating indexes for InvoiceAI database...")
    
    # Users collection indexes
    print("📌 Creating users indexes...")
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index("plan")
    await db.users.create_index("created_at")
    
    # Subscriptions collection indexes
    print("📌 Creating subscriptions indexes...")
    await db.subscriptions.create_index("user_id", unique=True)
    await db.subscriptions.create_index("subscription_tier")
    await db.subscriptions.create_index("subscription_end_date")
    await db.subscriptions.create_index("monthly_reset_date")
    await db.subscriptions.create_index([("user_id", 1), ("subscription_tier", 1)])
    await db.subscriptions.create_index("is_active")
    
    # Transactions collection indexes
    print("📌 Creating transactions indexes...")
    await db.transactions.create_index("id", unique=True)
    await db.transactions.create_index("user_id")
    await db.transactions.create_index("status")
    await db.transactions.create_index("created_at")
    await db.transactions.create_index([("user_id", 1), ("status", 1)])
    await db.transactions.create_index([("user_id", 1), ("created_at", -1)])  # For history queries
    await db.transactions.create_index("razorpay_order_id", sparse=True)
    await db.transactions.create_index("payment_gateway_id", sparse=True)
    
    # Usage tracking collection indexes
    print("📌 Creating usage_tracking indexes...")
    await db.usage_tracking.create_index("id", unique=True)
    await db.usage_tracking.create_index("user_id")
    await db.usage_tracking.create_index("invoice_id", sparse=True)
    await db.usage_tracking.create_index("timestamp")
    await db.usage_tracking.create_index([("user_id", 1), ("timestamp", -1)])  # For history queries
    await db.usage_tracking.create_index([("user_id", 1), ("action_type", 1)])
    
    # Invoices collection indexes (ensure they exist)
    print("📌 Creating invoices indexes...")
    await db.invoices.create_index("id", unique=True)
    await db.invoices.create_index("user_id")
    await db.invoices.create_index("invoice_number")
    await db.invoices.create_index("vendor_name")
    await db.invoices.create_index("status")
    await db.invoices.create_index("invoice_date")
    await db.invoices.create_index([("user_id", 1), ("invoice_date", -1)])
    await db.invoices.create_index([("user_id", 1), ("status", 1)])
    await db.invoices.create_index([("user_id", 1), ("vendor_name", 1)])
    
    # Vendors collection indexes
    print("📌 Creating vendors indexes...")
    await db.vendors.create_index("id", unique=True)
    await db.vendors.create_index([("user_id", 1), ("name", 1)])
    await db.vendors.create_index("user_id")
    
    # Corrections collection indexes
    print("📌 Creating corrections indexes...")
    await db.corrections.create_index("id", unique=True)
    await db.corrections.create_index("user_id")
    await db.corrections.create_index("invoice_id")
    await db.corrections.create_index("created_at")
    
    print("✅ All indexes created successfully!")
    
    # Print index statistics
    print("\n📊 Index Statistics:")
    collections = ["users", "subscriptions", "transactions", "usage_tracking", "invoices", "vendors", "corrections"]
    for collection_name in collections:
        indexes = await db[collection_name].index_information()
        print(f"  {collection_name}: {len(indexes)} indexes")
    
    client.close()


if __name__ == "__main__":
    asyncio.run(create_indexes())
