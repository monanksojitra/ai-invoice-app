"""
Test Payment Integration - InvoiceAI
Tests Razorpay payment flow with mock credentials
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def print_test(name):
    print(f"\n{'='*70}")
    print(f"▶ Testing: {name}")
    print('='*70)

def print_success(message):
    print(f"  ✓ {message}")

def print_error(message):
    print(f"  ✗ {message}")

def print_info(message):
    print(f"  ℹ {message}")

# Global test data
test_user_token = None
test_user_id = None

def test_register_and_login():
    """Register a test user"""
    global test_user_token, test_user_id
    
    print_test("User Registration")
    
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"payment_test_{timestamp}@test.com"
    
    payload = {
        "email": email,
        "password": "TestPass123!",
        "name": "Payment Test User",
        "business_name": "Test Business",
        "gstin": "22AAAAA0000A1Z5",
        "business_type": "retail"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload)
        if response.status_code in [200, 201]:  # Accept both 200 and 201
            data = response.json()
            test_user_token = data.get("token")
            test_user_id = data.get("user", {}).get("id")
            print_success(f"User registered: {email}")
            print_info(f"User ID: {test_user_id}")
            print_info(f"Credits: {data.get('user', {}).get('credits', 0)}")
            return True
        else:
            print_error(f"Registration failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Registration error: {str(e)}")
        return False

def test_payment_gateways():
    """Test payment gateway configuration endpoint"""
    print_test("Get Payment Gateways")
    
    try:
        response = requests.get(f"{BASE_URL}/payment/gateways")
        if response.status_code == 200:
            data = response.json()
            gateways = data.get("available_gateways", [])
            if gateways:
                print_success(f"Gateways available: {', '.join(gateways)}")
                print_info(f"Primary gateway: {data.get('primary')}")
            else:
                print_info("No payment gateways configured (expected with placeholder credentials)")
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_create_payment_order_not_configured():
    """Test payment order creation when gateway not configured"""
    print_test("Create Payment Order (Gateway Not Configured)")
    
    if not test_user_token:
        print_error("No user token available")
        return False
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    payload = {
        "amount": 500.0,
        "currency": "INR",
        "type": "credit_purchase",
        "credits": 500
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/payment/create-order",
            json=payload,
            headers=headers
        )
        
        # Should fail with 503 because gateway not configured
        if response.status_code == 503:
            print_success("Correctly rejected - payment gateway not configured")
            print_info(response.json().get("detail"))
            return True
        else:
            print_error(f"Unexpected status: {response.status_code}")
            print_info(response.text)
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_get_subscription():
    """Test getting subscription details"""
    print_test("Get User Subscription")
    
    if not test_user_token:
        print_error("No user token available")
        return False
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/user/subscription", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print_success("Subscription retrieved")
            print_info(f"  Plan: {data.get('subscription_tier')}")
            print_info(f"  Credits: {data.get('credits')}")
            print_info(f"  Monthly limit: {data.get('monthly_invoice_limit')}")
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_credit_balance():
    """Test getting credit balance"""
    print_test("Get Credit Balance")
    
    if not test_user_token:
        print_error("No user token available")
        return False
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/credits/balance", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print_success(f"Credit balance: {data.get('credits')} credits")
            print_info(f"Auto-recharge: {data.get('auto_recharge_enabled')}")
            return True
        else:
            print_error(f"Failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_api_structure():
    """Test that all payment endpoints are registered"""
    print_test("API Structure Validation")
    
    endpoints_to_check = [
        ("/payment/create-order", "POST"),
        ("/payment/verify", "POST"),
        ("/payment/webhook", "POST"),
        ("/payment/gateways", "GET"),
    ]
    
    all_good = True
    for endpoint, method in endpoints_to_check:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            else:
                # POST without data will fail but endpoint should exist
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            # 404 means endpoint doesn't exist, anything else means it exists
            if response.status_code != 404:
                print_success(f"{method} {endpoint} - Registered ✓")
            else:
                print_error(f"{method} {endpoint} - NOT FOUND")
                all_good = False
        except Exception as e:
            print_error(f"{method} {endpoint} - Error: {str(e)}")
            all_good = False
    
    return all_good

def run_all_tests():
    print("\n" + "="*70)
    print("         PAYMENT INTEGRATION - API TESTING SUITE")
    print("="*70)
    
    tests = [
        ("User Registration", test_register_and_login),
        ("Payment Gateways", test_payment_gateways),
        ("Create Order (Not Configured)", test_create_payment_order_not_configured),
        ("Get Subscription", test_get_subscription),
        ("Get Credit Balance", test_credit_balance),
        ("API Structure", test_api_structure),
    ]
    
    results = {}
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            results[name] = False
            print_error(f"Test crashed: {str(e)}")
    
    # Summary
    print("\n" + "="*70)
    print("                     TEST RESULTS SUMMARY")
    print("="*70)
    print()
    
    for name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status} - {name}")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    
    print()
    print(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
    elif passed > total / 2:
        print("⚠ Some tests failed")
    else:
        print("❌ Most tests failed")
    
    print()
    print("="*70)
    print()
    print("NEXT STEPS:")
    print("1. Add real Razorpay test credentials to backend/.env")
    print("2. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET")
    print("3. Re-run tests to verify full payment flow")
    print()
    print("To get Razorpay test credentials:")
    print("→ Sign up at https://razorpay.com/")
    print("→ Go to Settings → API Keys")
    print("→ Generate Test Keys")
    print("="*70)

if __name__ == "__main__":
    try:
        # Check if server is running
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            print("✗ Server is not running. Please start the backend server first.")
            print("  Run: cd backend && ./manage-server.sh start")
            exit(1)
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to server at", BASE_URL)
        print("  Please start the backend server first.")
        print("  Run: cd backend && ./manage-server.sh start")
        exit(1)
    
    run_all_tests()
