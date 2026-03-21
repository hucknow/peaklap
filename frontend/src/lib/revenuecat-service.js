import { Purchases } from '@revenuecat/purchases-capacitor';
import { RevenueCatUI } from '@revenuecat/purchases-capacitor-ui';
import { isPlatform } from './platform';

const REVENUECAT_API_KEY = process.env.REACT_APP_REVENUECAT_API_KEY || '';

const ENTITLEMENT_ID = 'peaklap_pro';

export class RevenueCatService {
  static isConfigured = false;

  static async configure(userId = null) {
    if (this.isConfigured) {
      console.log('RevenueCat already configured');
      return;
    }

    if (!isPlatform(['android', 'ios'])) {
      console.warn('RevenueCat is only available on mobile platforms');
      return;
    }

    if (!REVENUECAT_API_KEY) {
      throw new Error('RevenueCat API key is not configured. Please add REACT_APP_REVENUECAT_API_KEY to your .env file');
    }

    try {
      await Purchases.configure({
        apiKey: REVENUECAT_API_KEY,
        appUserID: userId || undefined,
      });

      await Purchases.setLogLevel({ level: 'DEBUG' });

      this.isConfigured = true;
      console.log('RevenueCat configured successfully');
    } catch (error) {
      console.error('Failed to configure RevenueCat:', error);
      throw new Error(`RevenueCat configuration failed: ${error.message}`);
    }
  }

  static async getCustomerInfo() {
    try {
      const { customerInfo } = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw new Error(`Failed to get customer info: ${error.message}`);
    }
  }

  static async getOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings?.current || null;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw new Error(`Failed to get offerings: ${error.message}`);
    }
  }

  static async purchasePackage(pkg) {
    try {
      const result = await Purchases.purchasePackage({ aPackage: pkg });
      return result;
    } catch (error) {
      if (error.code === 'PURCHASE_CANCELLED') {
        throw new Error('Purchase was cancelled');
      }
      console.error('Purchase failed:', error);
      throw new Error(`Purchase failed: ${error.message}`);
    }
  }

  static async restorePurchases() {
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw new Error(`Failed to restore purchases: ${error.message}`);
    }
  }

  static async checkEntitlement(entitlementId = ENTITLEMENT_ID) {
    try {
      const customerInfo = await this.getCustomerInfo();
      const entitlement = customerInfo?.entitlements?.active?.[entitlementId];
      return entitlement?.isActive === true;
    } catch (error) {
      console.error('Failed to check entitlement:', error);
      return false;
    }
  }

  static async getActiveSubscription() {
    try {
      const customerInfo = await this.getCustomerInfo();
      const activeEntitlements = customerInfo?.entitlements?.active || {};

      const proEntitlement = activeEntitlements[ENTITLEMENT_ID];

      if (proEntitlement?.isActive) {
        return {
          isActive: true,
          productIdentifier: proEntitlement.productIdentifier,
          willRenew: proEntitlement.willRenew,
          periodType: proEntitlement.periodType,
          expirationDate: proEntitlement.expirationDate,
          isLifetime: proEntitlement.periodType === 'NORMAL' && !proEntitlement.willRenew && proEntitlement.expirationDate === null
        };
      }

      return { isActive: false };
    } catch (error) {
      console.error('Failed to get active subscription:', error);
      return { isActive: false };
    }
  }

  static async presentPaywall(options = {}) {
    try {
      const result = await RevenueCatUI.presentPaywall({
        requiredEntitlementIdentifier: options.requiredEntitlementIdentifier || ENTITLEMENT_ID,
        ...options
      });
      return result;
    } catch (error) {
      console.error('Failed to present paywall:', error);
      throw new Error(`Failed to present paywall: ${error.message}`);
    }
  }

  static async presentPaywallIfNeeded(options = {}) {
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: options.requiredEntitlementIdentifier || ENTITLEMENT_ID,
        ...options
      });
      return result;
    } catch (error) {
      console.error('Failed to present paywall if needed:', error);
      throw new Error(`Failed to present paywall if needed: ${error.message}`);
    }
  }

  static async presentCustomerCenter() {
    try {
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.error('Failed to present customer center:', error);
      throw new Error(`Failed to present customer center: ${error.message}`);
    }
  }

  static async setAttributes(attributes) {
    try {
      for (const [key, value] of Object.entries(attributes)) {
        await Purchases.setAttributes({ attributes: { [key]: value } });
      }
    } catch (error) {
      console.error('Failed to set attributes:', error);
      throw new Error(`Failed to set attributes: ${error.message}`);
    }
  }

  static async logIn(userId) {
    try {
      const { customerInfo } = await Purchases.logIn({ appUserID: userId });
      return customerInfo;
    } catch (error) {
      console.error('Failed to log in:', error);
      throw new Error(`Failed to log in: ${error.message}`);
    }
  }

  static async logOut() {
    try {
      const { customerInfo } = await Purchases.logOut();
      return customerInfo;
    } catch (error) {
      console.error('Failed to log out:', error);
      throw new Error(`Failed to log out: ${error.message}`);
    }
  }

  static getEntitlementId() {
    return ENTITLEMENT_ID;
  }
}
