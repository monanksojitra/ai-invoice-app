#!/bin/bash

# Quick Start Script for Testing InvoiceAI Settings
# This script helps you quickly start testing the implementation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}         InvoiceAI Settings - Quick Start Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Check MongoDB
echo -e "${YELLOW}[1/5] Checking MongoDB...${NC}"
if pgrep -x mongod > /dev/null; then
    echo -e "${GREEN}✓ MongoDB is running${NC}"
else
    echo -e "${RED}✗ MongoDB is not running${NC}"
    echo "Start MongoDB: sudo systemctl start mongod"
    exit 1
fi

# Check backend server
echo -e "${YELLOW}[2/5] Checking backend server...${NC}"
cd "$PROJECT_ROOT/backend"
if ./manage-server.sh status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend server is running${NC}"
else
    echo -e "${YELLOW}! Backend server not running, starting now...${NC}"
    ./manage-server.sh start
fi

# Run backend tests
echo -e "${YELLOW}[3/5] Running backend API tests...${NC}"
cd "$PROJECT_ROOT/backend"
source .venv/bin/activate
python3 test_settings_api.py | tail -20

# Check test results
if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✓ All backend tests passed${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
    echo "Check logs: tail -f backend/server.log"
fi

# Check frontend setup
echo -e "${YELLOW}[4/5] Checking frontend setup...${NC}"
cd "$PROJECT_ROOT/frontend"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}! Installing frontend dependencies...${NC}"
    npm install
fi

# Display next steps
echo -e "${YELLOW}[5/5] Ready for manual testing!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup Complete! Ready for Testing${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo -e "1. ${GREEN}Start Frontend:${NC}"
echo "   cd $PROJECT_ROOT/frontend"
echo "   npx expo start"
echo ""
echo -e "2. ${GREEN}Follow Testing Checklist:${NC}"
echo "   Open: test_reports/frontend_testing_checklist.md"
echo ""
echo -e "3. ${GREEN}Test All Screens:${NC}"
echo "   • Settings Tab → All sections"
echo "   • Edit Profile"
echo "   • Change Password"
echo "   • Business Settings"
echo "   • Plan & Billing"
echo "   • Buy Credits"
echo "   • Usage Analytics"
echo "   • About"
echo "   • Privacy Policy"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo "   Backend status:   cd backend && ./manage-server.sh status"
echo "   Backend logs:     cd backend && ./manage-server.sh logs"
echo "   Run API tests:    cd backend && ./manage-server.sh test"
echo "   Stop backend:     cd backend && ./manage-server.sh stop"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "   • test_reports/IMPLEMENTATION_SUMMARY.md  (Start here!)"
echo "   • TESTING_GUIDE.md"
echo "   • test_reports/frontend_testing_checklist.md"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Backend API: http://localhost:8000${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════════${NC}"
