#!/bin/bash

# Server Management Script for InvoiceAI Backend

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$BACKEND_DIR/server.pid"
LOG_FILE="$BACKEND_DIR/server.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

case "$1" in
  start)
    echo -e "${GREEN}Starting InvoiceAI Backend Server...${NC}"
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    
    # Check if already running
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo -e "${YELLOW}Server is already running (PID: $PID)${NC}"
        exit 1
      fi
    fi
    
    # Start server in background
    nohup python3 server.py > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    sleep 2
    
    # Check if started successfully
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Server started successfully (PID: $(cat $PID_FILE))${NC}"
      echo "Log file: $LOG_FILE"
    else
      echo -e "${RED}✗ Server failed to start. Check $LOG_FILE${NC}"
      exit 1
    fi
    ;;
    
  stop)
    echo -e "${YELLOW}Stopping InvoiceAI Backend Server...${NC}"
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        kill "$PID"
        rm "$PID_FILE"
        echo -e "${GREEN}✓ Server stopped${NC}"
      else
        echo -e "${YELLOW}Server was not running${NC}"
        rm "$PID_FILE"
      fi
    else
      echo -e "${YELLOW}No PID file found${NC}"
    fi
    ;;
    
  restart)
    echo -e "${YELLOW}Restarting InvoiceAI Backend Server...${NC}"
    $0 stop
    sleep 2
    $0 start
    ;;
    
  status)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo -e "${GREEN}✓ Server is running (PID: $PID)${NC}"
        if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
          echo -e "${GREEN}✓ Server is responding to requests${NC}"
        else
          echo -e "${RED}✗ Server process exists but not responding${NC}"
        fi
      else
        echo -e "${RED}✗ Server is not running (stale PID file)${NC}"
        rm "$PID_FILE"
      fi
    else
      echo -e "${RED}✗ Server is not running${NC}"
    fi
    ;;
    
  logs)
    if [ -f "$LOG_FILE" ]; then
      tail -f "$LOG_FILE"
    else
      echo -e "${RED}No log file found${NC}"
    fi
    ;;
    
  test)
    echo -e "${GREEN}Running API tests...${NC}"
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    python3 test_settings_api.py
    ;;
    
  *)
    echo "Usage: $0 {start|stop|restart|status|logs|test}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the backend server"
    echo "  stop    - Stop the backend server"
    echo "  restart - Restart the backend server"
    echo "  status  - Check server status"
    echo "  logs    - Tail server logs"
    echo "  test    - Run API tests"
    exit 1
    ;;
esac
