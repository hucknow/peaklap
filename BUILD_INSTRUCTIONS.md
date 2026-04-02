# PeakLap Build & Versioning Instructions

This document outlines the complete process for version updating, building, deploying, and saving the PeakLap application to GitHub.

---

## 1. Version Updating

Before creating a new build or committing to GitHub, ensure you have properly bumped the version number according to [VERSION_POLICY.md](VERSION_POLICY.md).

1. **Update User-Facing Version:** Modify the version string in `frontend/src/pages/Settings.js` (e.g., `PeakLap v0.6.0`).
2. **SQL Migrations:** Ensure any database changes are saved as a standalone `.sql` file.
3. **Update Documentation:** Update the version number at the bottom of this file.
4. **Changelog:** Add an entry to `CHANGELOG.md` detailing the new features or fixes.

---

## 2. Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js** (v18+ recommended)
- **npm** (comes with Node.js)
- **Android Studio** (Required for compiling the Android APK/Bundle)
- **Java Development Kit (JDK)** (Required by Android Studio/Gradle)
- **Git** (for version control)

---

## 3. Pre-Flight Checks & Environment Setup

Before building the app, verify that your environment variables and dependencies are properly configured.

### Install Dependencies
Navigate to the frontend directory and install the required npm packages:
```bash
cd frontend
npm install
```

### Environment Variables
Ensure you have a `.env` file located in the `frontend/` directory (`frontend/.env`). It must contain the following production keys:
```env
REACT_APP_SUPABASE_URL=your_production_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_production_supabase_anon_key
REACT_APP_REVENUECAT_API_KEY=your_production_revenuecat_key
```

### Asset Generation (Icons & Splash Screens)
If you have updated your app icon or splash screen, you need to regenerate the native Android assets.
1. Ensure your high-res source images are in `frontend/assets/icon.png` and `frontend/assets/splash.png`.
2. Run the Capacitor asset generator:
```bash
cd frontend
npx @capacitor/assets generate --android
```

---

## 4. Building for the Web (Production)

To deploy the web version of PeakLap (e.g., to Vercel, Netlify, or Firebase Hosting), you need to create a static production build.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Run the React build script:
   ```bash
   npm run build
   ```
3. The compiled web assets will be generated inside the `frontend/build/` directory. These files are optimized, minified, and ready to be deployed to your web host.

---

## 5. Building for Android (Native)

Capacitor uses your compiled web build to power the native Android app. **You must build the web assets before syncing with Android.**

### Step 1: Build the Web App
```bash
cd frontend
npm run build
```

### Step 2: Sync with Capacitor
Copy the newly built web assets and your `capacitor.config.ts` updates into the native Android project:
```bash
npx cap sync android
```

### Step 3: Open Android Studio
Launch the Android project in Android Studio:
```bash
npx cap open android
```

### Step 4: Compile the APK or App Bundle
Once Android Studio opens and the initial Gradle sync completes:
- **To test on a device/emulator:** Select your target device from the dropdown in the top toolbar and click the green **Play (Run)** button.
- **To build an APK for distribution/testing:** In the top menu bar, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
- **To build for Google Play Store Release:** In the top menu bar, select **Build > Generate Signed Bundle / APK**, choose **Android App Bundle**, and provide your keystore credentials.

---

## 6. Post-Build QA Checklist

Before releasing a new build, verify the following core flows:

- [ ] **Authentication:** Can you sign up, sign in, and sign out successfully?
- [ ] **Offline Mode (Android):** 
  - Turn on Airplane mode.
  - Verify the `OfflineBanner` appears.
  - Verify cached trail maps load successfully.
  - Log a run offline, verify it enters the pending sync queue, and syncs when reconnected.
- [ ] **RevenueCat (Subscriptions):** 
  - Navigate to the Settings -> Pro page.
  - Ensure the paywall loads.
  - Test a purchase using a sandbox test account.
  - Verify the "Pro" badge appears upon successful purchase.
- [ ] **GPS Location:** Grant location permissions and ensure the app auto-detects the closest resort on the onboarding/home screens.

---

## 7. Deploying

### Web Deployment
To deploy the production web build (e.g., to Vercel, Netlify, or Firebase Hosting):
1. Ensure you have run `npm run build` in the `frontend/` directory.
2. Deploy the `frontend/build/` directory using your hosting provider's CLI or via automatic GitHub integration.

### Android Deployment
To deploy to the Google Play Store:
1. Generate a Signed App Bundle (`.aab`) from Android Studio (**Build > Generate Signed Bundle / APK**).
2. Upload the generated `.aab` file to the Google Play Console under your desired release track.

---

## 8. Saving to GitHub

Once your version is bumped, built, and tested, save your progress to version control:

1. **Stage all changes:**
   ```bash
   git add .
   ```
2. **Commit with a descriptive message** (include the version number):
   ```bash
   git commit -m "v0.6.0: Brief description of features or fixes"
   ```
3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

---
**Version:** v0.6.0
**Last Updated:** March 2026
