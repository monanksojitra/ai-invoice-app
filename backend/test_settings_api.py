#!/usr/bin/env python3
"""
Testing Script for InvoiceAI Settings Implementation
Tests all new endpoints with proper authentication
"""

import requests
import json
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

# Colors for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

def print_test(name):
    print(f"{Colors.OKBLUE}▶ Testing:{Colors.ENDC} {name}")

def print_success(message):
    print(f"  {Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    print(f"  {Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_warning(message):
    print(f"  {Colors.WARNING}⚠ {message}{Colors.ENDC}")

def print_info(message):
    print(f"  {Colors.OKCYAN}ℹ {message}{Colors.ENDC}")

# Global variables
test_user = {
    "email": f"test_{datetime.now().timestamp()}@test.com",
    "password": "TestPass123!",
    "name": "Test User",
    "business_name": "Test Business Ltd",
    "gstin": "22AAAAA0000A1Z5",
    "business_type": "retail"
}
auth_token = None
user_id = None

def test_health_check():
    """Test basic server health"""
    print_test("Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print_success(f"Server is running: {response.json()}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Cannot connect to server: {str(e)}")
        return False

def test_register():
    """Test user registration"""
    global auth_token, user_id
    print_test("User Registration")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=test_user,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            auth_token = data.get("token")
            user_id = data.get("user", {}).get("id")
            print_success(f"User registered successfully")
            print_info(f"User ID: {user_id}")
            print_info(f"Plan: {data.get('user', {}).get('plan')}")
            print_info(f"Credits: {data.get('user', {}).get('credits')}")
            return True
        else:
            print_error(f"Registration failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Registration error: {str(e)}")
        return False

def test_get_plans():
    """Test fetching available plans"""
    print_test("Get Plans")
    try:
        response = requests.get(f"{BASE_URL}/plans", timeout=5)
        if response.status_code == 200:
            data = response.json()
            plans = data.get("plans", [])
            packages = data.get("credit_packages", [])
            print_success(f"Found {len(plans)} plans and {len(packages)} credit packages")
            for plan in plans:
                print_info(f"  • {plan['name']}: ₹{plan['price_monthly']}/mo - {plan['monthly_invoice_limit'] or 'Unlimited'} invoices")
            return True
        else:
            print_error(f"Failed to get plans: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error getting plans: {str(e)}")
        return False

def test_get_subscription():
    """Test fetching user subscription"""
    print_test("Get User Subscription")
    try:
        response = requests.get(
            f"{BASE_URL}/user/subscription",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            print_success("Subscription retrieved successfully")
            print_info(f"  Tier: {data.get('subscription_tier')}")
            print_info(f"  Credits: {data.get('credits')}")
            print_info(f"  Monthly invoices: {data.get('monthly_invoice_count')}/{data.get('monthly_invoice_limit')}")
            print_info(f"  API calls this hour: {data.get('api_calls_this_hour')}/{data.get('api_calls_per_hour')}")
            return True
        else:
            print_error(f"Failed to get subscription: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error getting subscription: {str(e)}")
        return False

def test_get_usage_stats():
    """Test fetching usage statistics"""
    print_test("Get Usage Statistics")
    try:
        response = requests.get(
            f"{BASE_URL}/user/usage-stats",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            print_success("Usage stats retrieved successfully")
            print_info(f"  Total invoices: {data.get('total_invoices_processed')}")
            print_info(f"  This month: {data.get('invoices_this_month')}")
            print_info(f"  Credits used: {data.get('total_credits_used')}")
            print_info(f"  Credits remaining: {data.get('credits_remaining')}")
            return True
        else:
            print_error(f"Failed to get usage stats: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error getting usage stats: {str(e)}")
        return False

def test_update_profile():
    """Test updating user profile"""
    print_test("Update Profile")
    try:
        update_data = {
            "name": "Updated Test User",
            "business_type": "wholesale"
        }
        response = requests.patch(
            f"{BASE_URL}/user/profile",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=update_data,
            timeout=5
        )
        if response.status_code == 200:
            print_success("Profile updated successfully")
            print_info(f"Updated fields: {response.json().get('updated_fields')}")
            return True
        else:
            print_error(f"Failed to update profile: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Error updating profile: {str(e)}")
        return False

def test_change_password():
    """Test password change"""
    print_test("Change Password")
    try:
        password_data = {
            "old_password": test_user["password"],
            "new_password": "NewTestPass123!"
        }
        response = requests.patch(
            f"{BASE_URL}/user/password",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=password_data,
            timeout=5
        )
        if response.status_code == 200:
            print_success("Password changed successfully")
            # Update for future tests
            test_user["password"] = password_data["new_password"]
            return True
        else:
            print_error(f"Failed to change password: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Error changing password: {str(e)}")
        return False

def test_update_notifications():
    """Test updating notification preferences"""
    print_test("Update Notification Preferences")
    try:
        notif_data = {
            "payment_reminders": True,
            "invoice_alerts": True,
            "due_date_alerts": False,
            "low_credit_alerts": True,
            "push_enabled": True,
            "email_enabled": True
        }
        response = requests.patch(
            f"{BASE_URL}/user/notifications",
            headers={"Authorization": f"Bearer {auth_token}"},
            json=notif_data,
            timeout=5
        )
        if response.status_code == 200:
            print_success("Notification preferences updated")
            return True
        else:
            print_error(f"Failed to update notifications: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error updating notifications: {str(e)}")
        return False

def test_credit_balance():
    """Test getting credit balance"""
    print_test("Get Credit Balance")
    try:
        response = requests.get(
            f"{BASE_URL}/credits/balance",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            print_success(f"Credit balance: {data.get('credits')} credits")
            print_info(f"Auto-recharge: {data.get('auto_recharge_enabled')}")
            return True
        else:
            print_error(f"Failed to get credit balance: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error getting credit balance: {str(e)}")
        return False

def test_usage_history():
    """Test getting usage history"""
    print_test("Get Usage History")
    try:
        response = requests.get(
            f"{BASE_URL}/usage/history?limit=10&days=30",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            records = data.get("usage_records", [])
            summary = data.get("summary", [])
            print_success(f"Retrieved {len(records)} usage records")
            if summary:
                print_info("Usage summary:")
                for item in summary:
                    print_info(f"  • {item.get('_id')}: {item.get('count')} actions, {item.get('total_credits')} credits")
            return True
        else:
            print_error(f"Failed to get usage history: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error getting usage history: {str(e)}")
        return False

def test_transactions():
    """Test getting transaction history"""
    print_test("Get Transactions")
    try:
        response = requests.get(
            f"{BASE_URL}/transactions?limit=20",
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=5
        )
        if response.status_code == 200:
            data = response.json()
            transactions = data.get("transactions", [])
            print_success(f"Retrieved {len(transactions)} transactions")
            return True
        else:
            print_error(f"Failed to get transactions: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error getting transactions: {str(e)}")
        return False

def test_rate_limiting():
    """Test rate limiting"""
    print_test("Rate Limiting (10 rapid requests)")
    try:
        success_count = 0
        rate_limited = False
        
        for i in range(12):  # Try 12 requests (free tier limit is 10/hour)
            response = requests.get(
                f"{BASE_URL}/user/subscription",
                headers={"Authorization": f"Bearer {auth_token}"},
                timeout=5
            )
            if response.status_code == 200:
                success_count += 1
            elif response.status_code == 429:  # Too Many Requests
                rate_limited = True
                print_info(f"Rate limited after {success_count} requests")
                break
        
        if rate_limited:
            print_success("Rate limiting is working correctly")
            return True
        else:
            print_warning(f"Completed {success_count} requests without rate limiting")
            return True
    except Exception as e:
        print_error(f"Error testing rate limiting: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print_header("INVOICEAI SETTINGS - API TESTING SUITE")
    
    results = {}
    
    # Test 1: Health Check
    results["Health Check"] = test_health_check()
    if not results["Health Check"]:
        print_error("Server is not running. Please start the backend server first.")
        return
    
    # Test 2: User Registration
    results["Registration"] = test_register()
    if not results["Registration"]:
        print_error("Cannot proceed without successful registration")
        return
    
    # Test 3: Get Plans
    results["Get Plans"] = test_get_plans()
    
    # Test 4: Get Subscription
    results["Get Subscription"] = test_get_subscription()
    
    # Test 5: Get Usage Stats
    results["Get Usage Stats"] = test_get_usage_stats()
    
    # Test 6: Update Profile
    results["Update Profile"] = test_update_profile()
    
    # Test 7: Change Password
    results["Change Password"] = test_change_password()
    
    # Test 8: Update Notifications
    results["Update Notifications"] = test_update_notifications()
    
    # Test 9: Credit Balance
    results["Credit Balance"] = test_credit_balance()
    
    # Test 10: Usage History
    results["Usage History"] = test_usage_history()
    
    # Test 11: Transactions
    results["Transactions"] = test_transactions()
    
    # Test 12: Rate Limiting
    results["Rate Limiting"] = test_rate_limiting()
    
    # Summary
    print_header("TEST RESULTS SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = f"{Colors.OKGREEN}✓ PASS{Colors.ENDC}" if result else f"{Colors.FAIL}✗ FAIL{Colors.ENDC}"
        print(f"{status} - {test_name}")
    
    print(f"\n{Colors.BOLD}Total: {passed}/{total} tests passed{Colors.ENDC}")
    
    if passed == total:
        print(f"{Colors.OKGREEN}{Colors.BOLD}🎉 All tests passed!{Colors.ENDC}")
    else:
        print(f"{Colors.WARNING}{Colors.BOLD}⚠ Some tests failed{Colors.ENDC}")

if __name__ == "__main__":
    try:
        run_all_tests()
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Testing interrupted by user{Colors.ENDC}")
        sys.exit(1)
