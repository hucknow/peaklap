# Fix: "Missing Supabase environment variables" Error

## The Issue

When opening the browser console (F12), you see:
```
Uncaught Error: Missing Supabase environment variables
    at supabase.js:7:9
```

## Why This Happens

This error occurs because:
1. **Browser cache** - Your browser is loading an old version of the app built before the environment variables were added
2. **Service worker cache** - React apps can cache the JavaScript bundles
3. **CDN cache** - The preview URL might be serving cached content

## Solution: Clear Cache and Restart

### Step 1: Restart Frontend Service

**On the server:**
```bash
cd /app/frontend
sudo supervisorctl restart frontend
```

Wait 10-15 seconds for the app to recompile.

### Step 2: Hard Refresh Your Browser

**Chrome/Edge:**
- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

**Firefox:**
- Press `Ctrl + F5` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

**Safari:**
- Press `Cmd + Option + R`

### Step 3: Clear Browser Cache (If Hard Refresh Doesn't Work)

1. Open Developer Tools (F12)
2. Right-click the refresh button in browser toolbar
3. Select **"Empty Cache and Hard Reload"**

### Step 4: Try Incognito/Private Mode

If you still see the error:
- Open the app in an incognito/private window
- This forces a fresh load without any cache

## Verify Environment Variables Are Set

Check the `.env` file contains:

```bash
cat /app/frontend/.env
```

Should show:
```
REACT_APP_SUPABASE_URL=https://wnbtpsqsoxczncebwnds.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_kRt9AcMiCQkLsVkcxWvNVw_kW0xynLl
```

## If Still Not Working

### Check Compilation Status:

```bash
tail -n 30 /var/log/supervisor/frontend.out.log
```

Look for: `Compiled successfully!`

### Check for Errors:

```bash
tail -n 30 /var/log/supervisor/frontend.err.log
```

Should have no errors (just some deprecation warnings which are harmless).

### Rebuild Manually:

```bash
cd /app/frontend

# Clear old build
rm -rf build

# Restart service
sudo supervisorctl restart frontend

# Wait for compilation
sleep 15

# Check status
sudo supervisorctl status frontend
```

### Force Browser to Get New Version:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear storage** in left sidebar
4. Check all boxes
5. Click **Clear site data**
6. Close DevTools
7. Hard refresh (Ctrl+Shift+R)

## Understanding the Error

The error happens because Create React App only exposes environment variables that start with `REACT_APP_` to the browser.

**Our variables (correct):**
```javascript
process.env.REACT_APP_SUPABASE_URL      // ✅ Works
process.env.REACT_APP_SUPABASE_ANON_KEY // ✅ Works
```

**If we used (incorrect):**
```javascript
process.env.SUPABASE_URL      // ❌ Would be undefined in browser
process.env.SUPABASE_ANON_KEY // ❌ Would be undefined in browser
```

The code checks if these variables exist, and if not, throws the error you're seeing.

## After Fix - What You Should See

Once the cache is cleared and the new build loads:

✅ **No errors in console**
✅ **Login page displays correctly**
✅ **Dark background (#12181B) with white text**
✅ **Logo at top**
✅ **Email/password inputs work**

## Prevention

**Always restart frontend after .env changes:**
```bash
sudo supervisorctl restart frontend
```

**Then hard refresh your browser:**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

## Quick Troubleshooting Checklist

- [ ] Environment variables exist in `/app/frontend/.env`
- [ ] Variables start with `REACT_APP_`
- [ ] Frontend service restarted after .env changes
- [ ] Browser cache cleared (hard refresh)
- [ ] Checked in incognito mode
- [ ] Compilation successful (no build errors)
- [ ] Waited 15+ seconds after restart

## Still Having Issues?

Run this diagnostic:

```bash
cd /app/frontend

echo "=== Checking .env file ==="
grep SUPABASE .env

echo -e "\n=== Frontend Status ==="
sudo supervisorctl status frontend

echo -e "\n=== Recent Compilation ==="
tail -n 10 /var/log/supervisor/frontend.out.log | grep "Compiled"

echo -e "\n=== Test URL ==="
curl -I https://run-sesh.preview.emergentagent.com
```

If frontend shows RUNNING and compilation shows "Compiled successfully!", the issue is definitely browser cache.

---

**TL;DR:**
1. `sudo supervisorctl restart frontend`
2. Hard refresh browser: `Ctrl + Shift + R`
3. If still failing: Try incognito mode
4. The app works - it's just a cache issue! 🚀
