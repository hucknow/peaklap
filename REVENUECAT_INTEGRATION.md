# RevenueCat Integration Guide for Peaklap

This document provides complete documentation for the RevenueCat SDK integration in your Peaklap app.

## Overview

RevenueCat has been successfully integrated into your Peaklap app with support for:
- ✅ Subscription management (Monthly, Yearly, Lifetime)
- ✅ Entitlement checking for "Peaklap Pro"
- ✅ Native paywalls with RevenueCat UI
- ✅ Customer Center for subscription management
- ✅ Purchase restoration
- ✅ Capacitor support for iOS and Android

## Installation

The following packages have been installed:
```bash
npm install @revenuecat/purchases-capacitor @revenuecat/purchases-capacitor-ui
```

## Configuration

### 1. Add Your RevenueCat API Key

You need to manually add your RevenueCat API key to your environment variables:

**Location:** `/tmp/cc-agent/64903855/project/frontend/.env`

Add the following line to your `.env` file:
```env
REACT_APP_REVENUECAT_API_KEY=your_api_key_here
```

**Where to find your API key:**
1. Go to https://app.revenuecat.com
2. Select your project
3. Navigate to Settings → API Keys
4. Copy your **Public SDK Key** (iOS or Android depending on your platform)
5. Paste it into your `.env` file

### 2. Product Configuration

Configure your products in the RevenueCat Dashboard:

**Products to create:**
- **Monthly subscription** - identifier: `monthly`
- **Yearly subscription** - identifier: `yearly`
- **Lifetime purchase** - identifier: `lifetime`

**Entitlement:**
- Create an entitlement called `peaklap_pro`
- Attach all three products to this entitlement

**Steps in RevenueCat Dashboard:**
1. Go to Products → Add Product
2. Create three products with the identifiers above
3. Go to Entitlements → Add Entitlement
4. Name it `peaklap_pro`
5. Attach all three products to this entitlement

### 3. Configure Paywall

Create a paywall in the RevenueCat Dashboard:
1. Go to Paywalls → Create Paywall
2. Use the visual editor to design your paywall
3. Add your three products (monthly, yearly, lifetime)
4. Configure text, colors, and images
5. Assign the paywall to your default offering

## Architecture

### File Structure

```
frontend/src/
├── contexts/
│   └── RevenueCatContext.js          # Main context provider
├── lib/
│   ├── revenuecat-service.js         # Service layer for API calls
│   └── platform.js                   # Platform detection utilities
├── components/
│   ├── SubscriptionStatus.js         # Display subscription status
│   ├── ProBadge.js                   # Show PRO badge for subscribers
│   └── ProFeatureGate.js             # Gate features behind subscription
└── pages/
    └── Subscription.js               # Subscription management page
```

### Core Components

#### 1. RevenueCatContext

**Location:** `frontend/src/contexts/RevenueCatContext.js`

Provides subscription state management throughout the app.

**Usage:**
```javascript
import { useRevenueCat } from '@/contexts/RevenueCatContext';

function MyComponent() {
  const {
    isProUser,           // boolean: user has active subscription
    customerInfo,        // object: full customer info from RevenueCat
    offerings,           // object: available offerings/packages
    isLoading,          // boolean: loading state
    showPaywall,        // function: present paywall
    showCustomerCenter, // function: show subscription management
    purchasePackage,    // function: purchase a specific package
    restorePurchases    // function: restore previous purchases
  } = useRevenueCat();

  return (
    <div>
      {isProUser ? 'Welcome Pro User!' : 'Upgrade to Pro'}
    </div>
  );
}
```

#### 2. RevenueCatService

**Location:** `frontend/src/lib/revenuecat-service.js`

Service layer that handles all RevenueCat SDK interactions.

**Key Methods:**
- `configure(userId)` - Initialize SDK with user ID
- `getCustomerInfo()` - Get current customer info
- `getOfferings()` - Get available offerings
- `purchasePackage(pkg)` - Purchase a package
- `restorePurchases()` - Restore previous purchases
- `checkEntitlement(entitlementId)` - Check if user has entitlement
- `presentPaywall(options)` - Show native paywall
- `presentCustomerCenter()` - Show customer center

#### 3. Subscription Components

**SubscriptionStatus** - Display user's subscription status
```javascript
import { SubscriptionStatus } from '@/components/SubscriptionStatus';

<SubscriptionStatus showManageButton={true} />
```

**ProBadge** - Show PRO badge for subscribers
```javascript
import { ProBadge } from '@/components/ProBadge';

<ProBadge />  // Automatically hidden if not pro user
```

**ProFeatureGate** - Gate content behind subscription
```javascript
import { ProFeatureGate } from '@/components/ProFeatureGate';

<ProFeatureGate message="This feature requires Peaklap Pro">
  <PremiumFeature />
</ProFeatureGate>
```

## Usage Examples

### Example 1: Check if User is Pro

```javascript
import { useRevenueCat } from '@/contexts/RevenueCatContext';

function FeatureButton() {
  const { isProUser } = useRevenueCat();

  if (!isProUser) {
    return <button disabled>Pro Only Feature</button>;
  }

  return <button onClick={handleFeature}>Use Feature</button>;
}
```

### Example 2: Show Paywall

```javascript
import { useRevenueCat } from '@/contexts/RevenueCatContext';

function UpgradeButton() {
  const { showPaywall } = useRevenueCat();

  const handleUpgrade = async () => {
    try {
      await showPaywall();
      // Paywall will be shown, purchase handled automatically
    } catch (error) {
      console.error('Failed to show paywall:', error);
    }
  };

  return <button onClick={handleUpgrade}>Upgrade to Pro</button>;
}
```

### Example 3: Manual Purchase

```javascript
import { useRevenueCat } from '@/contexts/RevenueCatContext';

function PurchasePackages() {
  const { offerings, purchasePackage, isLoading } = useRevenueCat();

  const handlePurchase = async (pkg) => {
    const result = await purchasePackage(pkg);
    if (result.success) {
      console.log('Purchase successful!');
    }
  };

  return (
    <div>
      {offerings?.availablePackages.map(pkg => (
        <button
          key={pkg.identifier}
          onClick={() => handlePurchase(pkg)}
          disabled={isLoading}
        >
          Buy {pkg.product.priceString}
        </button>
      ))}
    </div>
  );
}
```

### Example 4: Restore Purchases

```javascript
import { useRevenueCat } from '@/contexts/RevenueCatContext';

function RestoreButton() {
  const { restorePurchases, isLoading } = useRevenueCat();

  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result.success) {
      console.log('Purchases restored!');
    }
  };

  return (
    <button onClick={handleRestore} disabled={isLoading}>
      Restore Purchases
    </button>
  );
}
```

### Example 5: Customer Center

```javascript
import { useRevenueCat } from '@/contexts/RevenueCatContext';

function ManageSubscriptionButton() {
  const { showCustomerCenter, isProUser } = useRevenueCat();

  if (!isProUser) return null;

  return (
    <button onClick={showCustomerCenter}>
      Manage Subscription
    </button>
  );
}
```

## Pages

### Subscription Page

**Route:** `/subscription`

A dedicated subscription page that shows:
- Current subscription status (if pro user)
- List of available subscription packages
- Option to view RevenueCat paywall
- Restore purchases button
- Pro features list

**Access:** Available in Settings page and as standalone route

## Settings Integration

The Settings page has been updated to include:
- Subscription status card (mobile only)
- "Upgrade to Pro" button (if not subscribed)
- "Manage Subscription" button (if subscribed)
- Direct navigation to subscription page

## Platform Support

### Mobile (iOS/Android)

Full support with Capacitor:
- Native paywall presentation
- Customer Center
- Purchase/restore functionality
- Real-time entitlement checking

### Web/Desktop

Limited support:
- Shows informational UI
- Directs users to mobile app for purchases
- RevenueCat subscriptions are mobile-only by design

## Entitlement Checking

The app uses a single entitlement: `peaklap_pro`

**Check entitlement:**
```javascript
const { isProUser } = useRevenueCat();

if (isProUser) {
  // User has active Peaklap Pro subscription
}
```

**Behind the scenes:**
- The SDK automatically checks if the user has the `peaklap_pro` entitlement active
- Updates in real-time when purchases are made
- Syncs across devices automatically
- Works offline with cached data

## Error Handling

The integration includes comprehensive error handling:

```javascript
const { error } = useRevenueCat();

if (error) {
  console.error('RevenueCat error:', error);
}
```

Common errors:
- `RevenueCat API key is not configured` - Add API key to .env
- `Purchase cancelled` - User cancelled purchase flow
- `Purchase failed` - Payment issue or validation failed

## Testing

### Test Purchases

1. **iOS:** Use sandbox tester accounts
2. **Android:** Use test accounts in Google Play Console

### Test Flows

1. **Purchase flow:**
   - Navigate to /subscription
   - Click "View Subscription Options"
   - Select a package
   - Complete purchase

2. **Restore flow:**
   - Navigate to /subscription
   - Click "Restore Purchases"
   - Verify subscription restored

3. **Entitlement check:**
   - Purchase subscription
   - Verify PRO badge appears
   - Verify gated features unlock

## Best Practices

1. **Always check isProUser before showing premium features**
   ```javascript
   const { isProUser } = useRevenueCat();
   if (!isProUser) return <UpgradePrompt />;
   ```

2. **Use ProFeatureGate for consistent gating**
   ```javascript
   <ProFeatureGate>
     <PremiumContent />
   </ProFeatureGate>
   ```

3. **Handle loading states**
   ```javascript
   const { isLoading } = useRevenueCat();
   if (isLoading) return <LoadingSpinner />;
   ```

4. **Provide restore purchases option**
   - Always visible on subscription page
   - Helps users who reinstall app

5. **Use native paywalls**
   - Better conversion rates
   - Managed remotely via dashboard
   - A/B testing support

## Troubleshooting

### Issue: "RevenueCat API key is not configured"

**Solution:** Add `REACT_APP_REVENUECAT_API_KEY` to your `.env` file

### Issue: Purchases not working

**Checklist:**
- [ ] API key configured correctly
- [ ] Products created in App Store Connect / Google Play Console
- [ ] Products linked in RevenueCat dashboard
- [ ] Entitlement configured with products attached
- [ ] Test account configured properly

### Issue: Entitlements not updating

**Solution:**
- Check internet connection
- Call `updateCustomerInfo()` to force refresh
- Verify product identifiers match exactly

### Issue: Paywall not showing

**Solution:**
- Verify offering is configured in dashboard
- Check that paywall is assigned to offering
- Ensure running on mobile device/simulator (not web browser)

## Next Steps

1. **Add your RevenueCat API key** to `.env` file
2. **Configure products** in App Store Connect and Google Play Console
3. **Set up products** in RevenueCat dashboard
4. **Create entitlement** called `peaklap_pro`
5. **Design paywall** using RevenueCat Paywall Editor
6. **Test purchases** with sandbox accounts
7. **Monitor analytics** in RevenueCat dashboard

## Resources

- RevenueCat Documentation: https://docs.revenuecat.com
- Capacitor Integration Guide: https://docs.revenuecat.com/docs/capacitor
- Paywall Editor: https://docs.revenuecat.com/docs/paywalls
- Customer Center: https://docs.revenuecat.com/docs/customer-center

## Support

For RevenueCat-specific issues:
- RevenueCat Community: https://community.revenuecat.com
- RevenueCat Support: support@revenuecat.com

For app-specific issues:
- Check this documentation
- Review console logs for errors
- Verify configuration in RevenueCat dashboard
