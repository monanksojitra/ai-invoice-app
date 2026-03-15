# Frontend Testing Checklist

## Prerequisites

- [ ] Backend server running (`cd backend && ./manage-server.sh start`)
- [ ] MongoDB running
- [ ] Frontend environment configured (EXPO_PUBLIC_BACKEND_URL)

## Setup

```bash
cd frontend
npm install  # if not already done
npx expo start
```

## Testing Checklist

### 1. Settings Tab ⚙️

**Navigate to Settings Tab**
- [ ] Settings tab is accessible from bottom navigation
- [ ] All setting sections are visible
- [ ] No loading errors

### 2. Edit Profile 👤

**Access:**
- [ ] Tap "Edit Profile" row
- [ ] Screen loads successfully

**Test Fields:**
- [ ] Name field shows current name
- [ ] Email field shows current email (read-only)
- [ ] Business Name field is editable
- [ ] GSTIN field validates format (22AAAAA0000A1Z5)
- [ ] Business Type dropdown works

**Test Actions:**
- [ ] Update name → Save → Success message
- [ ] Update business type → Save → Updates reflected
- [ ] Invalid GSTIN → Shows error message
- [ ] Cancel button works → Returns to settings
- [ ] Changes persist after navigation

### 3. Change Password 🔒

**Access:**
- [ ] Tap "Change Password" row
- [ ] Screen loads successfully

**Test Validations:**
- [ ] Old password field works
- [ ] New password field works
- [ ] Confirm password field works
- [ ] Password visibility toggle works
- [ ] Passwords must match → Shows error if don't

**Test Actions:**
- [ ] Correct old password → Success
- [ ] Wrong old password → Error message
- [ ] Weak new password → Validation error
- [ ] Cancel button works

### 4. Business Settings 🏢

**Access:**
- [ ] Tap "Business Settings" row
- [ ] Screen loads successfully

**Test Options:**
- [ ] All 8 business types display:
  - [ ] Retail
  - [ ] Wholesale
  - [ ] Manufacturing
  - [ ] Service
  - [ ] E-commerce
  - [ ] Freelancer
  - [ ] Restaurant
  - [ ] Other

**Test Actions:**
- [ ] Select business type → Highlights
- [ ] Save button works → Success message
- [ ] Selection persists after navigation

### 5. Plan & Billing 💳

**Access:**
- [ ] Tap "Current Plan" or "Upgrade Plan"
- [ ] Screen loads successfully

**Display Checks:**
- [ ] Current plan shows (Free, Starter, or Pro)
- [ ] Credits remaining displays
- [ ] Usage this month displays
- [ ] All 3 plans shown with features
- [ ] Upgrade buttons visible (if not on Pro)

**Test Actions:**
- [ ] Tap upgrade button → Opens purchase flow
- [ ] Plan features list is readable
- [ ] Price formatting correct (₹299/mo)
- [ ] Pull to refresh works

### 6. Buy Credits 💰

**Access:**
- [ ] Tap "Buy Credits" row
- [ ] Screen loads successfully

**Display Checks:**
- [ ] Current balance shows at top
- [ ] All 4 credit packages display:
  - [ ] 100 credits (₹100)
  - [ ] 550 credits (₹500, 10% bonus)
  - [ ] 1200 credits (₹1000, 20% bonus)
  - [ ] 6500 credits (₹5000, 30% bonus)
- [ ] Bonus badges visible on packages

**Test Actions:**
- [ ] Select package → Highlights
- [ ] Continue to payment button works
- [ ] Package details clear (credits, price, savings)

### 7. Usage Analytics 📊

**Access:**
- [ ] Tap "Usage Analytics" row
- [ ] Screen loads successfully

**Display Checks:**
- [ ] Total invoices processed shows
- [ ] Credits used this month shows
- [ ] Invoices this month shows
- [ ] Usage history list displays (if data exists)
- [ ] "No usage data" message if empty

**Test Actions:**
- [ ] Pull to refresh works
- [ ] Scroll through history (if data exists)

### 8. About InvoiceAI ℹ️

**Access:**
- [ ] Tap "About InvoiceAI" row
- [ ] Screen loads successfully

**Display Checks:**
- [ ] App version displays
- [ ] Description text readable
- [ ] All links/buttons visible
- [ ] Contact information correct

**Test Actions:**
- [ ] External links work (if any)
- [ ] Back button works

### 9. Privacy Policy 📜

**Access:**
- [ ] Tap "Privacy Policy" row
- [ ] Screen loads successfully

**Display Checks:**
- [ ] Full policy text displays
- [ ] Scrollable content
- [ ] Formatted properly
- [ ] No layout issues

**Test Actions:**
- [ ] Scroll through full policy
- [ ] Back button works

### 10. Logout 🚪

**Test:**
- [ ] Tap "Logout" row
- [ ] Confirmation prompt appears (if implemented)
- [ ] Logout successful → Returns to login/onboarding
- [ ] Cannot access protected screens after logout

## Integration Tests

### User Flow 1: New User Setup
1. [ ] Register new account
2. [ ] Verify free plan assigned (100 credits)
3. [ ] Navigate to settings → All tabs work
4. [ ] Update profile → Success
5. [ ] Check usage stats → Shows 0 invoices

### User Flow 2: Profile Management
1. [ ] Login as existing user
2. [ ] Edit profile → Update name
3. [ ] Change password → Success
4. [ ] Logout and login with new password
5. [ ] Profile changes persist

### User Flow 3: Plan Exploration
1. [ ] View current plan
2. [ ] Check features comparison
3. [ ] View upgrade options
4. [ ] Check credit packages
5. [ ] View usage analytics

## Performance Tests

### Loading Speed
- [ ] Settings tab loads < 1 second
- [ ] Sub-screens load < 1 second
- [ ] No lag when scrolling
- [ ] Smooth animations

### Memory
- [ ] No memory leaks when navigating between screens
- [ ] App remains responsive after extended use

## Error Handling

### Network Errors
- [ ] Backend offline → Appropriate error message
- [ ] Timeout → Retry mechanism works
- [ ] Invalid data → Validation errors display

### Form Validation
- [ ] Empty required fields → Shows error
- [ ] Invalid GSTIN format → Shows error
- [ ] Password mismatch → Shows error
- [ ] Invalid email format → Shows error

## UI/UX Checks

### Layout
- [ ] All text readable on small screens
- [ ] No text cutoff or overflow
- [ ] Proper spacing and padding
- [ ] Consistent font sizes

### Responsiveness
- [ ] Works on iPhone SE (small)
- [ ] Works on iPhone 14 Pro Max (large)
- [ ] Works on Android phones
- [ ] Keyboard doesn't hide input fields

### Accessibility
- [ ] Touch targets > 44x44 points
- [ ] Sufficient color contrast
- [ ] Screen reader compatible (if tested)

### Dark Mode (if implemented)
- [ ] All screens work in dark mode
- [ ] Proper contrast maintained
- [ ] No color issues

## Device Testing

### iOS
- [ ] iPhone 12/13/14
- [ ] iPad (if supported)
- [ ] iOS 15+

### Android
- [ ] Pixel/Samsung devices
- [ ] Android 11+

## Known Issues

_(Document any issues found during testing)_

| Issue | Screen | Severity | Status |
|-------|--------|----------|--------|
| | | | |

## Test Results Summary

**Date:** _______________  
**Tester:** _______________  
**Device:** _______________  
**OS:** _______________

**Total Tests:** _____ / _____  
**Pass Rate:** _____%

**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

## Notes

_(Add any additional observations)_

---

## Quick Commands

```bash
# Start backend
cd backend && ./manage-server.sh start

# Start frontend
cd frontend && npx expo start

# Check backend status
cd backend && ./manage-server.sh status

# View backend logs
cd backend && ./manage-server.sh logs

# Test API directly
curl http://localhost:8000/api/health
```

## Next Steps After Testing

1. Fix any issues found
2. Implement payment gateway (Razorpay)
3. Add end-to-end tests
4. Prepare for production deployment
