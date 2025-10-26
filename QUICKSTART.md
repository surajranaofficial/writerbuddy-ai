# 🚀 Quick Start Guide - Google OAuth Setup

## ⚡ 5-Minute Setup

### Step 1: Google Cloud Console (2 minutes)

1. **Go to**: https://console.cloud.google.com/
2. **Create** new project or select existing
3. **Enable** APIs:
   - Navigate to "APIs & Services"
   - Click "Enable APIs and Services"
   - Search for "Google+ API" and enable it

### Step 2: OAuth Configuration (2 minutes)

1. **Go to**: "APIs & Services" → "OAuth consent screen"
2. **Choose**: External
3. **Fill in**:
   - App name: `WritterBuddy AI`
   - User support email: `your-email@example.com`
   - Scopes: `openid`, `email`, `profile`
4. **Save** and continue

### Step 3: Create Credentials (1 minute)

1. **Go to**: "APIs & Services" → "Credentials"
2. **Click**: "Create Credentials" → "OAuth client ID"
3. **Select**: "Chrome App"
4. **Enter**: Your extension ID (get it from `chrome://extensions/`)
5. **Copy**: The Client ID

### Step 4: Update Extension

1. **Open**: `manifest.json`
2. **Find**: `"oauth2"` section
3. **Replace**:
   ```json
   {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com"
   }
   ```
4. **Save** the file
5. **Reload** extension in Chrome

### Step 5: Test It! 🎉

1. **Open** WritterBuddy AI
2. **Go to** Settings
3. **Click** "Sign in with Google"
4. **Authorize** the app
5. **Done!** You should see your profile

---

## 🔧 Troubleshooting

### ❌ "Authorization Error"
**Fix**: Check Client ID matches in manifest.json

### ❌ "Redirect URI mismatch"
**Fix**: Verify Extension ID is correct in Google Console

### ❌ "Access Denied"
**Fix**: Make sure OAuth consent screen is configured

---

## 📱 Alternative: Manual API Key

Don't want to use Google Sign-In? No problem!

1. **Get API Key**: https://aistudio.google.com/app/apikey
2. **Go to** Settings in WritterBuddy
3. **Enter** API key manually
4. **Click** "Save API Key"

Your API key will be **encrypted** and stored securely!

---

## ✅ Verification

After setup, you should see:
- ✅ Your Google profile photo
- ✅ Your name and email
- ✅ "Sign Out" button
- ✅ No errors in console

---

**Need help?** Check `GOOGLE_OAUTH_SETUP.md` for detailed instructions!

---

**🎉 Happy Writing with WritterBuddy AI!**
