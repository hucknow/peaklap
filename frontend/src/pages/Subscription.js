import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import Footer from '@/components/Footer';
import { Crown, Check, ArrowLeft, Sparkles, Loader as Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { isPlatform } from '@/lib/platform';

const features = [
  'Unlimited run tracking',
  'Advanced statistics and analytics',
  'Offline mode with full functionality',
  'Export your ski data',
  'Priority support',
  'Early access to new features',
  'Ad-free experience',
  'Custom resort maps'
];

const SubscriptionCard = ({ pkg, onPurchase, isLoading, popular = false }) => {
  const getPrice = () => {
    if (!pkg?.product?.priceString) return 'N/A';
    return pkg.product.priceString;
  };

  const getPeriod = () => {
    const identifier = pkg?.identifier?.toLowerCase() || '';
    if (identifier.includes('lifetime')) return 'one-time';
    if (identifier.includes('annual') || identifier.includes('yearly')) return 'year';
    if (identifier.includes('monthly')) return 'month';
    return 'subscription';
  };

  const getTitle = () => {
    const identifier = pkg?.identifier?.toLowerCase() || '';
    if (identifier.includes('lifetime')) return 'Lifetime';
    if (identifier.includes('annual') || identifier.includes('yearly')) return 'Annual';
    if (identifier.includes('monthly')) return 'Monthly';
    return 'Subscription';
  };

  const getDescription = () => {
    const period = getPeriod();
    if (period === 'one-time') return 'Pay once, use forever';
    return `Billed ${period === 'year' ? 'annually' : 'monthly'}`;
  };

  return (
    <Card className={`relative ${popular ? 'border-amber-500 border-2' : ''}`}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
          Most Popular
        </Badge>
      )}
      <CardHeader>
        <CardTitle className="text-white">{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-bold text-white">
          {getPrice()}
          {getPeriod() !== 'one-time' && (
            <span className="text-sm font-normal text-gray-400">/{getPeriod() === 'year' ? 'year' : 'month'}</span>
          )}
        </div>
        <Button
          onClick={() => onPurchase(pkg)}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Subscribe Now'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function Subscription() {
  const navigate = useNavigate();
  const { offerings, isProUser, purchasePackage, restorePurchases, showPaywall } = useRevenueCat();
  const [isProcessing, setIsProcessing] = useState(false);

  const isMobile = isPlatform(['android', 'ios']);

  const handlePurchase = async (pkg) => {
    setIsProcessing(true);
    try {
      const result = await purchasePackage(pkg);
      if (result.success) {
        toast.success('Subscription activated!', {
          description: 'Welcome to Peaklap Pro!'
        });
        navigate('/home');
      } else {
        toast.error('Purchase failed', {
          description: result.error || 'Please try again'
        });
      }
    } catch (error) {
      toast.error('Purchase error', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const result = await restorePurchases();
      if (result.success) {
        if (result.customerInfo?.entitlements?.active?.['peaklap_pro']) {
          toast.success('Purchases restored!', {
            description: 'Your subscription has been restored'
          });
          navigate('/home');
        } else {
          toast.info('No purchases found', {
            description: 'No active subscriptions to restore'
          });
        }
      } else {
        toast.error('Restore failed', {
          description: result.error || 'Please try again'
        });
      }
    } catch (error) {
      toast.error('Restore error', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShowPaywall = async () => {
    try {
      await showPaywall();
    } catch (error) {
      toast.error('Failed to show paywall', {
        description: error.message
      });
    }
  };

  if (isProUser) {
    return (
      <div className="min-h-screen pb-20" style={{ backgroundColor: '#12181B' }}>
        <Header />
        <div className="p-6 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/settings')}
            className="mb-4 text-white hover:text-white/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>

          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full mb-4">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">You're a Pro!</h1>
            <p className="text-gray-400">
              You have access to all premium features
            </p>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Pro Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-white">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#12181B' }}>
      <Header />
      <div className="p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/home')}
          className="mb-4 text-white hover:text-white/80"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full mb-4">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Upgrade to Peaklap Pro</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Unlock all premium features and take your skiing experience to the next level
          </p>
        </div>

        {!isMobile && (
          <Alert className="mb-6 border-blue-500/50 bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              Subscriptions are only available on mobile devices. Please use the iOS or Android app to subscribe.
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Pro Features
            </CardTitle>
            <CardDescription>Everything you need for the ultimate ski tracking experience</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-white">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {isMobile && (
          <>
            <div className="mb-6">
              <Button
                onClick={handleShowPaywall}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold py-6 text-lg"
              >
                View Subscription Options
              </Button>
            </div>

            {offerings?.availablePackages && offerings.availablePackages.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {offerings.availablePackages.map((pkg, index) => (
                  <SubscriptionCard
                    key={pkg.identifier}
                    pkg={pkg}
                    onPurchase={handlePurchase}
                    isLoading={isProcessing}
                    popular={index === 1}
                  />
                ))}
              </div>
            )}

            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={handleRestore}
                disabled={isProcessing}
                className="text-gray-400 hover:text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  'Restore Purchases'
                )}
              </Button>
            </div>
          </>
        )}
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
