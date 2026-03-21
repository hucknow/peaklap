import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { RevenueCatService } from '../lib/revenuecat-service';
import { isPlatform } from '../lib/platform';

const RevenueCatContext = createContext(null);

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};

export const RevenueCatProvider = ({ children }) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [isProUser, setIsProUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkProAccess = useCallback((info) => {
    if (!info) return false;
    return info.entitlements?.active?.['peaklap_pro']?.isActive === true;
  }, []);

  const updateCustomerInfo = useCallback(async () => {
    try {
      const info = await RevenueCatService.getCustomerInfo();
      setCustomerInfo(info);
      setIsProUser(checkProAccess(info));
      setError(null);
      return info;
    } catch (err) {
      console.error('Failed to update customer info:', err);
      setError(err.message);
      return null;
    }
  }, [checkProAccess]);

  const initializeRevenueCat = useCallback(async () => {
    if (!isPlatform(['android', 'ios'])) {
      console.log('RevenueCat: Not on mobile platform, skipping initialization');
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      await RevenueCatService.configure(user?.id);

      const info = await RevenueCatService.getCustomerInfo();
      setCustomerInfo(info);
      setIsProUser(checkProAccess(info));

      const currentOfferings = await RevenueCatService.getOfferings();
      setOfferings(currentOfferings);

      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize RevenueCat:', err);
      setError(err.message);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, checkProAccess]);

  useEffect(() => {
    if (user) {
      initializeRevenueCat();
    }
  }, [user, initializeRevenueCat]);

  const purchasePackage = async (pkg) => {
    try {
      setIsLoading(true);
      const { customerInfo: info } = await RevenueCatService.purchasePackage(pkg);
      setCustomerInfo(info);
      setIsProUser(checkProAccess(info));
      setError(null);
      return { success: true, customerInfo: info };
    } catch (err) {
      console.error('Purchase failed:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const restorePurchases = async () => {
    try {
      setIsLoading(true);
      const info = await RevenueCatService.restorePurchases();
      setCustomerInfo(info);
      setIsProUser(checkProAccess(info));
      setError(null);
      return { success: true, customerInfo: info };
    } catch (err) {
      console.error('Restore failed:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  };

  const showPaywall = async () => {
    try {
      const result = await RevenueCatService.presentPaywall();
      if (result?.customerInfo) {
        setCustomerInfo(result.customerInfo);
        setIsProUser(checkProAccess(result.customerInfo));
      }
      return result;
    } catch (err) {
      console.error('Failed to show paywall:', err);
      setError(err.message);
      throw err;
    }
  };

  const showCustomerCenter = async () => {
    try {
      await RevenueCatService.presentCustomerCenter();
    } catch (err) {
      console.error('Failed to show customer center:', err);
      setError(err.message);
      throw err;
    }
  };

  const value = {
    isInitialized,
    customerInfo,
    offerings,
    isProUser,
    isLoading,
    error,
    purchasePackage,
    restorePurchases,
    updateCustomerInfo,
    showPaywall,
    showCustomerCenter,
    checkProAccess
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};
