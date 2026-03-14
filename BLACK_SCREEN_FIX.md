# Black Screen Troubleshooting Guide

## The Issue

If you're seeing a "black screen", there are two possibilities:

### 1. This is Actually the Design! ✅

The Sendit app uses **Alpine Dark Mode** with a very dark background (#12181B - almost black). This is intentional! 

When you load the app, you should see:
- Very dark slate background (looks almost black)
- Sendit logo at the top
- White text "Welcome Back"
- Email and password inputs
- Ice blue "Sign In" button

**If you see this, the app is working perfectly!** The dark appearance is the design.

### 2. Truly Blank/Black Screen (Nothing Visible) ❌

If you see literally nothing (no logo, no text, no buttons), try these fixes:

## Quick Fixes

### Fix 1: Hard Refresh Your Browser
**Most Common Solution!**

**Chrome/Edge**:
- Press `Ctrl + Shift + R` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

**Firefox**:
- Press `Ctrl + F5` (Windows/Linux)
- Press `Cmd + Shift + R` (Mac)

**Safari**:
- Press `Cmd + Option + R`

### Fix 2: Clear Browser Cache

1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Fix 3: Check Browser Console

1. Press F12 to open Developer Tools
2. Click the "Console" tab
3. Look for red error messages
4. Common errors and fixes:

**If you see: "Failed to load resource"**
- The app is trying to load but files aren't found
- Try Fix 1 (hard refresh)

**If you see: "Supabase" errors**
- The app is working! You just need to configure Supabase
- Follow `/app/SUPABASE_SETUP.md`

**If you see: "Module not found" or "@/" errors**
- This means imports are broken
- Run: `cd /app/frontend && yarn install && sudo supervisorctl restart frontend`

### Fix 4: Try Incognito/Private Mode

Open the app in an incognito/private window:
- This bypasses cache entirely
- If it works here, it's a cache issue (use Fix 1)

### Fix 5: Restart Frontend Service

```bash
cd /app/frontend
sudo supervisorctl restart frontend
sleep 5
sudo supervisorctl status frontend
```

Should show: `frontend  RUNNING`

### Fix 6: Check Frontend Logs

```bash
# Check for errors
tail -n 50 /var/log/supervisor/frontend.err.log

# Check build status  
tail -n 50 /var/log/supervisor/frontend.out.log
```

Look for "Compiled successfully" or "Compiled with warnings" - both are OK.
If you see "Failed to compile" - that's the issue.

## Verify It's Working

Visit: https://run-sesh.preview.emergentagent.com/login

You should see (in order from top to bottom):
1. **Sendit logo** (blue location pin with mountain)
2. Dark glassmorphism card with:
   - "Welcome Back" heading in white
   - "Ready to track your season? 🏔️" subtext
   - Email input field
   - Password input field  
   - Ice blue "Sign In" button
   - "Don't have an account? Sign up" link at bottom
3. "Made with Emergent" badge at bottom right

**Background color**: Very dark slate (almost black) - this is correct!

## Still Not Working?

Run this diagnostic script:

```bash
cd /app/frontend

# Check if app compiled
echo "=== Checking Build Status ==="
grep -E "(Compiled|Failed)" /var/log/supervisor/frontend.out.log | tail -n 5

# Check for errors
echo -e "\n=== Checking for Errors ==="
tail -n 20 /var/log/supervisor/frontend.err.log

# Check service status
echo -e "\n=== Service Status ==="
sudo supervisorctl status frontend

# Check if Supabase env vars exist
echo -e "\n=== Supabase Configuration ==="
grep "SUPABASE" .env

# Test if files exist
echo -e "\n=== Checking Key Files ==="
ls -lh src/App.js src/index.js src/lib/supabase.js
```

Send me the output and I can help diagnose further!

## What the Dark Design Looks Like

**Color Palette**:
- Background: #12181B (Deep Slate - very dark, almost black)
- Cards: #1A2126 (Charcoal - slightly lighter)
- Text: White (#FFFFFF)
- Buttons: #00B4D8 (Ice Blue)
- Success: #00E676 (Lime Green)

This creates a premium, immersive alpine night-mode aesthetic. It's supposed to be very dark!

## Expected Screenshots

### Login Page (What You Should See):
- Dark background (looks almost black)
- Logo centered at top
- Glass card in center
- White text
- Ice blue button

If this is what you see - **the app is working!** 

If you see truly nothing (no logo, no card, no text) - follow the fixes above.
