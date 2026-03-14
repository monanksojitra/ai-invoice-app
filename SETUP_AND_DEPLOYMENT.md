# InvoiceAI - Setup, Testing & Deployment Guide

> Complete instructions for local development, testing, and production deployment

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start (TL;DR)](#2-quick-start-tldr)
3. [Backend Setup](#3-backend-setup)
4. [Frontend Setup](#4-frontend-setup)
5. [Database Setup](#5-database-setup)
6. [Environment Configuration](#6-environment-configuration)
7. [Running the Application](#7-running-the-application)
8. [Testing](#8-testing)
9. [Deployment](#9-deployment)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Monitoring & Logging](#11-monitoring--logging)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### Required Software

| Software | Version | Purpose | Installation |
|----------|---------|---------|--------------|
| **Node.js** | 18.x or 20.x | Frontend runtime | [nodejs.org](https://nodejs.org) |
| **Python** | 3.10+ | Backend runtime | [python.org](https://python.org) |
| **MongoDB** | 6.0+ | Database | [mongodb.com](https://mongodb.com) or Docker |
| **Git** | 2.x | Version control | Pre-installed on most systems |

### Optional (Recommended)

| Software | Purpose |
|----------|---------|
| **Docker & Docker Compose** | Containerized deployment |
| **Expo CLI** | React Native development |
| **Android Studio** | Android emulator |
| **Xcode** (macOS only) | iOS simulator |
| **VS Code** | Recommended IDE |

### API Keys Required

| Service | Required For | Get Key |
|---------|--------------|---------|
| **Emergent Integrations** | Claude AI access | Contact provider |
| **Expo** (optional) | Push notifications, EAS builds | [expo.dev](https://expo.dev) |

---

## 2. Quick Start (TL;DR)

```bash
# Clone repository
git clone <repository-url>
cd ai-invoice-app

# === BACKEND ===
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install openpyxl pillow scipy PyMuPDF apscheduler httpx

# Create .env file
cat > .env << 'EOF'
MONGO_URL=mongodb://localhost:27017
DB_NAME=invoiceai_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EMERGENT_LLM_KEY=your-api-key-here
EOF

# Start backend (new terminal)
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# === FRONTEND ===
cd ../frontend
npm install

# Create .env file (use your machine's IP for mobile testing)
echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > .env

# Start frontend
npx expo start

# Press 'a' for Android, 'i' for iOS, or scan QR with Expo Go
```

---

## 3. Backend Setup

### 3.1 Create Virtual Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Linux/macOS:
source venv/bin/activate

# Windows CMD:
venv\Scripts\activate.bat

# Windows PowerShell:
venv\Scripts\Activate.ps1
```

### 3.2 Install Dependencies

```bash
# Install from requirements.txt
pip install -r requirements.txt

# Install additional packages (may not be in requirements.txt)
pip install openpyxl pillow scipy PyMuPDF apscheduler httpx
```

**Full dependency list:**

```txt
# Core Framework
fastapi==0.110.1
uvicorn==0.25.0
pydantic>=2.6.4

# Database
pymongo==4.5.0
motor==3.3.1

# Authentication
bcrypt==4.1.3
python-jose>=3.3.0
passlib>=1.7.4

# AI/ML
emergentintegrations==0.1.0

# Image Processing
pillow
scipy
numpy>=1.26.0

# PDF Processing
PyMuPDF  # imported as 'fitz'

# Excel Export
openpyxl

# Background Jobs
apscheduler
httpx

# Utilities
python-dotenv>=1.0.1
python-multipart>=0.0.9
email-validator>=2.2.0

# Development
pytest>=8.0.0
black>=24.1.1
flake8>=7.0.0
```

### 3.3 Create Environment File

```bash
# Create .env file in backend directory
cat > .env << 'EOF'
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=invoiceai_db

# Authentication (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars

# AI API Key
EMERGENT_LLM_KEY=your-emergent-api-key

# Optional: Batch processing toggle
BATCH_ENABLED=true
EOF
```

### 3.4 Verify Installation

```bash
# Check Python version
python --version  # Should be 3.10+

# Test imports
python -c "import fastapi, motor, fitz, PIL; print('All imports OK')"

# Run server (will fail if MongoDB not running - that's OK)
uvicorn server:app --reload --port 8000
```

---

## 4. Frontend Setup

### 4.1 Install Node Dependencies

```bash
cd frontend

# Using npm
npm install

# OR using yarn (if you prefer)
yarn install
```

### 4.2 Create Environment File

```bash
# For local development (localhost)
echo "EXPO_PUBLIC_BACKEND_URL=http://localhost:8000" > .env

# For testing on physical device (use your computer's IP)
# Find your IP: ifconfig (Linux/Mac) or ipconfig (Windows)
echo "EXPO_PUBLIC_BACKEND_URL=http://192.168.1.XXX:8000" > .env
```

### 4.3 Install Expo CLI (Global)

```bash
# Install Expo CLI globally
npm install -g expo-cli

# Or use npx (no global install needed)
npx expo --version
```

### 4.4 Verify Installation

```bash
# Check Node version
node --version  # Should be 18.x or 20.x

# Check npm version
npm --version

# Verify Expo
npx expo --version

# Run type check
npx tsc --noEmit
```

---

## 5. Database Setup

### Option A: Local MongoDB

```bash
# Ubuntu/Debian
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS (Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Verify MongoDB is running
mongosh --eval "db.version()"
```

### Option B: Docker MongoDB

```bash
# Run MongoDB in Docker
docker run -d \
  --name invoiceai-mongo \
  -p 27017:27017 \
  -v invoiceai-data:/data/db \
  mongo:6.0

# Verify
docker logs invoiceai-mongo
```

### Option C: MongoDB Atlas (Cloud)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a free cluster (M0 Sandbox)
3. Create database user with password
4. Add your IP to whitelist (or 0.0.0.0/0 for development)
5. Get connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/invoiceai_db
   ```
6. Update `.env`:
   ```
   MONGO_URL=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net
   DB_NAME=invoiceai_db
   ```

### Initialize Database Collections

The collections are created automatically on first use, but you can verify:

```bash
# Connect to MongoDB
mongosh

# Switch to database
use invoiceai_db

# Check collections (will be empty initially)
show collections

# Expected collections after use:
# - users
# - invoices
# - vendors
# - batch_queue
# - corrections
```

---

## 6. Environment Configuration

### Backend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URL` | Yes | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Yes | Database name | `invoiceai_db` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens (min 32 chars) | `your-super-secret-key` |
| `EMERGENT_LLM_KEY` | Yes | API key for Claude access | `em-xxxx` |
| `BATCH_ENABLED` | No | Enable batch processing | `true` |

### Frontend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EXPO_PUBLIC_BACKEND_URL` | Yes | Backend API URL | `http://localhost:8000` |

### Environment Templates

**Development (`backend/.env.development`):**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=invoiceai_dev
JWT_SECRET=dev-secret-key-not-for-production-use
EMERGENT_LLM_KEY=your-dev-api-key
BATCH_ENABLED=false
```

**Production (`backend/.env.production`):**
```env
MONGO_URL=mongodb+srv://user:pass@prod-cluster.mongodb.net
DB_NAME=invoiceai_prod
JWT_SECRET=<generated-secure-key-64-chars>
EMERGENT_LLM_KEY=<production-api-key>
BATCH_ENABLED=true
```

---

## 7. Running the Application

### 7.1 Start Backend Server

```bash
cd backend

# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Development mode (with auto-reload)
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

**Verify backend is running:**
```bash
# Health check
curl http://localhost:8000/api/health

# Expected response:
# {"status": "ok", "timestamp": "..."}
```

### 7.2 Start Frontend App

```bash
cd frontend

# Start Expo development server
npx expo start

# Or with specific options:
npx expo start --clear  # Clear cache
npx expo start --tunnel  # Use Expo tunnel for remote testing
```

**Expo Options:**
- Press `a` - Open Android emulator
- Press `i` - Open iOS simulator (macOS only)
- Press `w` - Open web browser
- Scan QR code - Open on physical device with Expo Go app

### 7.3 Running Both Together

**Terminal 1 (Backend):**
```bash
cd backend && source venv/bin/activate && uvicorn server:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npx expo start
```

### 7.4 Docker Compose (Full Stack)

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: invoiceai-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    networks:
      - invoiceai-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: invoiceai-backend
    ports:
      - "8000:8000"
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=invoiceai_db
      - JWT_SECRET=${JWT_SECRET}
      - EMERGENT_LLM_KEY=${EMERGENT_LLM_KEY}
    depends_on:
      - mongodb
    networks:
      - invoiceai-network

networks:
  invoiceai-network:
    driver: bridge

volumes:
  mongo-data:
```

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for PIL, scipy, PyMuPDF
RUN apt-get update && apt-get install -y \
    gcc \
    libffi-dev \
    libmupdf-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir openpyxl pillow scipy PyMuPDF apscheduler httpx

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

Run with Docker Compose:
```bash
# Create .env file with secrets
echo "JWT_SECRET=your-secret" > .env
echo "EMERGENT_LLM_KEY=your-key" >> .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

---

## 8. Testing

### 8.1 Backend Tests

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Set test environment
export EXPO_PUBLIC_BACKEND_URL=http://localhost:8000

# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_invoiceai.py -v

# Run with coverage
pip install pytest-cov
pytest tests/ --cov=. --cov-report=html
```

**Test Categories:**

| Category | Tests |
|----------|-------|
| Health | API health check |
| Auth | Register, login, duplicate rejection, /me endpoint |
| Invoices | Create, list, get, update status, delete |
| Analytics | Summary endpoint |
| Vendors | List vendors |

### 8.2 Running Tests Manually

```bash
# 1. Start backend server in one terminal
uvicorn server:app --reload --port 8000

# 2. Run tests in another terminal
cd backend
export EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
pytest tests/test_invoiceai.py -v
```

**Expected Output:**
```
tests/test_invoiceai.py::TestHealth::test_health PASSED
tests/test_invoiceai.py::TestAuth::test_register PASSED
tests/test_invoiceai.py::TestAuth::test_login_success PASSED
tests/test_invoiceai.py::TestAuth::test_login_wrong_password PASSED
tests/test_invoiceai.py::TestAuth::test_me PASSED
tests/test_invoiceai.py::TestInvoices::test_create_invoice PASSED
tests/test_invoiceai.py::TestInvoices::test_list_invoices PASSED
tests/test_invoiceai.py::TestInvoices::test_get_invoice PASSED
tests/test_invoiceai.py::TestInvoices::test_update_invoice_status PASSED
tests/test_invoiceai.py::TestInvoices::test_delete_invoice PASSED
tests/test_invoiceai.py::TestAnalyticsVendors::test_analytics_summary PASSED
tests/test_invoiceai.py::TestAnalyticsVendors::test_vendors PASSED
```

### 8.3 Frontend Tests

```bash
cd frontend

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Fix lint issues
npx expo lint --fix
```

### 8.4 API Testing with curl

```bash
# Health Check
curl http://localhost:8000/api/health

# Register User
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User","business_name":"Test Biz"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Store token and use in subsequent requests
TOKEN="your-jwt-token-from-login"

# Get Current User
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# List Invoices
curl http://localhost:8000/api/invoices \
  -H "Authorization: Bearer $TOKEN"

# Get Analytics
curl http://localhost:8000/api/analytics/summary \
  -H "Authorization: Bearer $TOKEN"
```

### 8.5 Testing AI Extraction

```bash
# Process an invoice image (base64 encoded)
# First, encode an image:
BASE64_IMAGE=$(base64 -w 0 test_invoice.jpg)

# Then call the API:
curl -X POST http://localhost:8000/api/process-invoice \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"image_base64\":\"$BASE64_IMAGE\",\"source_type\":\"camera\",\"mime_type\":\"image/jpeg\"}"
```

---

## 9. Deployment

### 9.1 Backend Deployment Options

#### Option A: Railway.app (Recommended for Quick Deploy)

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

```bash
# railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "backend/Dockerfile"

[deploy]
startCommand = "uvicorn server:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/api/health"
```

#### Option B: Render.com

1. Create new Web Service
2. Connect repository
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Add environment variables

#### Option C: AWS EC2 / DigitalOcean

```bash
# On server:
sudo apt update && sudo apt install -y python3.11 python3.11-venv nginx

# Clone and setup
git clone <repo> /opt/invoiceai
cd /opt/invoiceai/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install openpyxl pillow scipy PyMuPDF apscheduler httpx gunicorn

# Create systemd service
sudo cat > /etc/systemd/system/invoiceai.service << 'EOF'
[Unit]
Description=InvoiceAI Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/invoiceai/backend
Environment="PATH=/opt/invoiceai/backend/venv/bin"
EnvironmentFile=/opt/invoiceai/backend/.env
ExecStart=/opt/invoiceai/backend/venv/bin/gunicorn server:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable invoiceai
sudo systemctl start invoiceai
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.invoiceai.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 9.2 Frontend Deployment (Expo/EAS)

#### Build for Production

```bash
cd frontend

# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Build for both
eas build --platform all --profile production
```

#### EAS Build Configuration (`eas.json`)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_BACKEND_URL": "https://api.invoiceai.com"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

#### Submit to App Stores

```bash
# Submit to Google Play Store
eas submit --platform android

# Submit to Apple App Store
eas submit --platform ios
```

### 9.3 Database (MongoDB Atlas)

For production, use MongoDB Atlas:

1. Create M10+ cluster (dedicated resources)
2. Enable backups
3. Set up IP whitelist (or VPC peering)
4. Create indexes:

```javascript
// Connect to MongoDB and create indexes
db.invoices.createIndex({ "user_id": 1, "created_at": -1 });
db.invoices.createIndex({ "user_id": 1, "vendor_name": 1 });
db.invoices.createIndex({ "user_id": 1, "status": 1 });
db.invoices.createIndex({ "user_id": 1, "invoice_date": 1 });
db.users.createIndex({ "email": 1 }, { unique: true });
db.batch_queue.createIndex({ "status": 1, "queued_at": 1 });
```

---

## 10. CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Backend Tests
  backend-test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install openpyxl pillow scipy PyMuPDF apscheduler httpx pytest
      
      - name: Run tests
        env:
          MONGO_URL: mongodb://localhost:27017
          DB_NAME: invoiceai_test
          JWT_SECRET: test-secret-key
          EMERGENT_LLM_KEY: ${{ secrets.EMERGENT_LLM_KEY }}
          EXPO_PUBLIC_BACKEND_URL: http://localhost:8000
        run: |
          cd backend
          uvicorn server:app --host 0.0.0.0 --port 8000 &
          sleep 5
          pytest tests/ -v

  # Frontend Type Check & Lint
  frontend-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Type check
        run: |
          cd frontend
          npx tsc --noEmit
      
      - name: Lint
        run: |
          cd frontend
          npm run lint

  # Build Android APK (on main only)
  build-android:
    needs: [backend-test, frontend-check]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Build APK
        run: |
          cd frontend
          eas build --platform android --profile preview --non-interactive
```

---

## 11. Monitoring & Logging

### Backend Logging

The server uses Python's built-in logging:

```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s"
)
```

**View logs:**
```bash
# Uvicorn development
uvicorn server:app --reload --port 8000 2>&1 | tee app.log

# Production (systemd)
sudo journalctl -u invoiceai -f

# Docker
docker logs -f invoiceai-backend
```

### Health Check Endpoint

```bash
# Check API health
curl http://localhost:8000/api/health

# Response:
# {"status": "ok", "timestamp": "2026-03-14T18:00:00Z"}
```

### Recommended Monitoring Tools

| Tool | Purpose | Setup |
|------|---------|-------|
| **Sentry** | Error tracking | `pip install sentry-sdk[fastapi]` |
| **Datadog** | APM & metrics | Agent installation |
| **Prometheus + Grafana** | Metrics visualization | Self-hosted |
| **MongoDB Atlas** | Database monitoring | Built-in |

---

## 12. Troubleshooting

### Common Issues

#### Backend won't start

```bash
# Check Python version
python --version  # Must be 3.10+

# Check if port is in use
lsof -i :8000
# Kill the process if needed

# Check MongoDB connection
mongosh --eval "db.version()"

# Check .env file exists
cat backend/.env
```

#### MongoDB connection failed

```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string
mongosh "mongodb://localhost:27017"
```

#### Frontend can't connect to backend

```bash
# Check backend is running
curl http://localhost:8000/api/health

# Check frontend .env
cat frontend/.env

# For physical device testing, use your machine's IP (not localhost)
# Find IP:
ip addr show  # Linux
ifconfig | grep "inet "  # macOS
ipconfig  # Windows
```

#### Expo app crashes

```bash
# Clear Expo cache
npx expo start --clear

# Reset Metro bundler
rm -rf frontend/.expo
rm -rf frontend/node_modules/.cache

# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
```

#### AI extraction fails

```bash
# Check API key is set
echo $EMERGENT_LLM_KEY

# Check API key in .env
grep EMERGENT backend/.env

# Test with smaller image (reduce token usage)
# Check server logs for detailed error
```

#### Export fails (Excel/CSV)

```bash
# Check openpyxl is installed
pip show openpyxl

# Install if missing
pip install openpyxl
```

### Debug Mode

**Backend:**
```bash
# Run with debug logging
LOG_LEVEL=DEBUG uvicorn server:app --reload --port 8000
```

**Frontend:**
```bash
# Enable React Native debugger
# In Expo Go: Shake device > "Open JS Debugger"
# Or use Flipper
```

### Reset Development Environment

```bash
# Full reset - Backend
cd backend
rm -rf venv __pycache__ .pytest_cache
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install openpyxl pillow scipy PyMuPDF apscheduler httpx

# Full reset - Frontend
cd frontend
rm -rf node_modules .expo
npm install
npx expo start --clear

# Reset MongoDB (WARNING: deletes all data)
mongosh --eval "use invoiceai_db; db.dropDatabase()"
```

---

## Quick Reference

### Start Development

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate && uvicorn server:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npx expo start
```

### Run Tests

```bash
cd backend
export EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
pytest tests/ -v
```

### Build Production

```bash
# Backend: Deploy to Railway/Render/EC2 with Docker

# Frontend:
cd frontend
eas build --platform all --profile production
```

### Useful Commands

| Command | Purpose |
|---------|---------|
| `uvicorn server:app --reload` | Start backend dev server |
| `npx expo start` | Start frontend dev server |
| `pytest tests/ -v` | Run backend tests |
| `npx tsc --noEmit` | TypeScript type check |
| `npm run lint` | Run ESLint |
| `eas build --platform android` | Build Android APK |
| `docker-compose up -d` | Start with Docker |

---

*Last updated: March 2026*
