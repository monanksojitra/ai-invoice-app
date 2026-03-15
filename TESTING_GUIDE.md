# Testing Guide for InvoiceAI Settings Implementation

## Prerequisites

1. **MongoDB** must be running on localhost:27017
2. **Redis** (optional but recommended for rate limiting)
3. **Python 3.8+** with virtual environment

## Setup Steps

### 1. Install Dependencies (if not already done)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Create Database Indexes

```bash
source .venv/bin/activate
python3 create_indexes.py
```

Expected output:
```
Creating indexes for InvoiceAI database...
📌 Creating users indexes...
📌 Creating subscriptions indexes...
...
✅ All indexes created successfully!
```

### 3. Start the Backend Server

**Option A: Start in foreground (for debugging)**
```bash
source .venv/bin/activate
python3 server.py
```

**Option B: Start in background**
```bash
source .venv/bin/activate
nohup python3 server.py > server.log 2>&1 &
echo $! > server.pid
```

**Option C: Using uvicorn (recommended for production)**
```bash
source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Verify Server is Running

```bash
curl http://localhost:8000/api/health
```

Expected: `{"status":"ok","service":"InvoiceAI Backend"}`

### 5. Run API Tests

```bash
source .venv/bin/activate
python3 test_settings_api.py
```

## Manual API Testing with curl

### 1. Register a Test User

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "name": "Test User",
    "business_name": "Test Business",
    "gstin": "22AAAAA0000A1Z5",
    "business_type": "retail"
  }'
```

Save the `token` from the response!

### 2. Get Available Plans

```bash
curl http://localhost:8000/api/plans
```

### 3. Get User Subscription (requires token)

```bash
TOKEN="your_token_here"

curl http://localhost:8000/api/user/subscription \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get Usage Statistics

```bash
curl http://localhost:8000/api/user/usage-stats \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Update Profile

```bash
curl -X PATCH http://localhost:8000/api/user/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "business_type": "wholesale"
  }'
```

### 6. Change Password

```bash
curl -X PATCH http://localhost:8000/api/user/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "TestPass123!",
    "new_password": "NewPass123!"
  }'
```

### 7. Update Notification Preferences

```bash
curl -X PATCH http://localhost:8000/api/user/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_reminders": true,
    "invoice_alerts": true,
    "push_enabled": true
  }'
```

### 8. Purchase Credits (creates transaction)

```bash
curl -X POST http://localhost:8000/api/credits/purchase \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credits": 500,
    "payment_method": "razorpay"
  }'
```

### 9. Get Credit Balance

```bash
curl http://localhost:8000/api/credits/balance \
  -H "Authorization: Bearer $TOKEN"
```

### 10. Get Transaction History

```bash
curl http://localhost:8000/api/transactions?limit=20 \
  -H "Authorization: Bearer $TOKEN"
```

### 11. Get Usage History

```bash
curl http://localhost:8000/api/usage/history?limit=50&days=30 \
  -H "Authorization: Bearer $TOKEN"
```

### 12. Upgrade Subscription (creates transaction)

```bash
curl -X POST http://localhost:8000/api/subscription/upgrade \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "target_plan": "starter",
    "payment_method": "razorpay"
  }'
```

## Frontend Testing

### 1. Start the Frontend

```bash
cd frontend
npm start
# or
npx expo start
```

### 2. Test Each Screen

Navigate through the app and test:

1. **Settings Tab** → Should show all sections clickable
2. **Edit Profile** → Update name, business details, GSTIN
3. **Change Password** → Test password validation
4. **Business Settings** → Select business type
5. **Plan & Billing** → View current plan and usage
6. **Buy Credits** → Select package (payment placeholder)
7. **Usage Analytics** → View stats and history
8. **About** → Check app info
9. **Privacy Policy** → Verify content displays

### 3. Testing Checklist

- [ ] All screens load without errors
- [ ] Navigation works between screens
- [ ] Forms validate input correctly
- [ ] Error messages display properly
- [ ] Loading states show during API calls
- [ ] Success messages after updates
- [ ] Data persists after navigation
- [ ] Subscription data displays correctly
- [ ] Credit balance updates

## Common Issues & Solutions

### Issue: 404 errors on new endpoints

**Solution:** Restart the backend server
```bash
# Kill existing process
pkill -f "python.*server.py"
# Or if you saved PID
kill $(cat server.pid)

# Start again
source .venv/bin/activate
python3 server.py
```

### Issue: MongoDB connection failed

**Solution:** Start MongoDB
```bash
# Ubuntu/Debian
sudo systemctl start mongod

# macOS
brew services start mongodb-community

# Docker
docker run -d -p 27017:27017 mongo:latest
```

### Issue: Module not found errors

**Solution:** Reinstall dependencies
```bash
source .venv/bin/activate
pip install -r requirements.txt
```

### Issue: Rate limiting not working

**Solution:** Install and start Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

### Issue: Frontend can't connect to backend

**Solution:** Check EXPO_PUBLIC_BACKEND_URL
```bash
# In frontend/.env or .env.local
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

For physical device testing:
```bash
# Replace with your machine's IP
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8000
```

## Performance Testing

### Test Rate Limiting

```bash
# Rapid fire requests (should hit rate limit)
for i in {1..15}; do
  curl http://localhost:8000/api/user/subscription \
    -H "Authorization: Bearer $TOKEN" &
done
wait
```

### Test Credit Deduction

```bash
# Process an invoice (should deduct credits)
curl -X POST http://localhost:8000/api/process-invoice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "image_base64": "base64_encoded_image_here",
    "source_type": "camera",
    "mime_type": "image/jpeg"
  }'

# Check updated balance
curl http://localhost:8000/api/credits/balance \
  -H "Authorization: Bearer $TOKEN"
```

## Monitoring & Logs

### View Server Logs

```bash
# If running in background
tail -f server.log

# Or check directly
journalctl -u invoiceai -f
```

### Check Database

```bash
# Connect to MongoDB
mongosh ai_invoice_db

# View collections
show collections

# Check subscriptions
db.subscriptions.find().pretty()

# Check transactions
db.transactions.find().pretty()

# Check usage tracking
db.usage_tracking.find().limit(10).sort({timestamp: -1}).pretty()
```

## Next Steps After Testing

1. ✅ All API tests passing
2. ✅ All screens working
3. → Integrate Razorpay payment gateway
4. → Add end-to-end tests
5. → Deploy to staging environment
6. → User acceptance testing
7. → Production deployment

## Support

If you encounter issues:
1. Check the logs
2. Verify environment variables
3. Ensure all services (MongoDB, Redis) are running
4. Review the error messages
5. Check the troubleshooting section above
