import React from 'react';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

export const ProFeatureGate = ({
  children,
  fallback = null,
  showUpgradeButton = true,
  message = 'This feature requires Peaklap Pro'
}) => {
  const { isProUser, showPaywall } = useRevenueCat();

  if (isProUser) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <Alert className="border-amber-500/50 bg-amber-50">
      <Crown className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">{message}</span>
        {showUpgradeButton && (
          <Button
            size="sm"
            onClick={showPaywall}
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            Upgrade to Pro
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
