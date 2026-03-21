import React from 'react';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Crown, Loader as Loader2 } from 'lucide-react';

export const SubscriptionStatus = ({ showManageButton = true }) => {
  const { customerInfo, isProUser, isLoading, showCustomerCenter } = useRevenueCat();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  const getSubscriptionDetails = () => {
    if (!customerInfo?.entitlements?.active?.['peaklap_pro']) {
      return null;
    }

    const entitlement = customerInfo.entitlements.active['peaklap_pro'];
    const expirationDate = entitlement.expirationDate
      ? new Date(entitlement.expirationDate).toLocaleDateString()
      : null;

    if (entitlement.periodType === 'NORMAL' && !entitlement.willRenew && !expirationDate) {
      return { type: 'Lifetime', details: 'Never expires' };
    }

    if (entitlement.periodType === 'TRIAL') {
      return { type: 'Trial', details: `Ends ${expirationDate}` };
    }

    const productId = entitlement.productIdentifier || '';
    let planType = 'Subscription';

    if (productId.includes('monthly')) {
      planType = 'Monthly';
    } else if (productId.includes('yearly') || productId.includes('annual')) {
      planType = 'Annual';
    }

    if (entitlement.willRenew) {
      return { type: planType, details: `Renews ${expirationDate}` };
    } else {
      return { type: planType, details: `Expires ${expirationDate}` };
    }
  };

  const subscriptionDetails = getSubscriptionDetails();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <CardTitle>Subscription Status</CardTitle>
          </div>
          {isProUser && (
            <Badge variant="default" className="bg-amber-500">
              PRO
            </Badge>
          )}
        </div>
        <CardDescription>
          {isProUser ? 'You have access to all Pro features' : 'Upgrade to unlock Pro features'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscriptionDetails && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Plan Type</span>
              <span className="font-medium">{subscriptionDetails.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className="font-medium">{subscriptionDetails.details}</span>
            </div>
          </div>
        )}

        {showManageButton && isProUser && (
          <Button
            onClick={showCustomerCenter}
            variant="outline"
            className="w-full"
          >
            Manage Subscription
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
