# Google OAuth Setup Guide for WritterBuddy AI

## 🔐 Google OAuth Integration

WritterBuddy AI now supports **Google Sign-In** for automatic API key management and secure authentication.

### Features
✅ **One-Click Google Login** - Sign in with your Google account  
✅ **Encrypted API Key Storage** - All API keys are encrypted using XOR-based encryption  
✅ **Manual Fallback** - Advanced users can still enter API keys manually  
✅ **Secure Session Management** - OAuth tokens are encrypted and cached  

---

## 📋 Setup Instructions

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - **Google+ API** (for user profile)
   - **Chrome Identity API**

### Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - **App name**: WritterBuddy AI
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Save and continue

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Chrome App** as application type
4. Enter your **Chrome Extension ID**:
   - Install the extension in Chrome
   - Go to `chrome://extensions/`
   - Copy the Extension ID
5. Click **Create**
6. Copy the **Client ID**

### Step 4: Update manifest.json

1. Open `manifest.json`
2. Update the `oauth2` section:

```json
{
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "openid",
      "email",
      "profile"
    ]
  }
}
```

3. Replace `YOUR_CLIENT_ID` with your actual Client ID

**✅ Already Configured:**
```json
{
  "oauth2": {
    "client_id": "929745907750-8qnllbfapratr0e205dum139klihidkp.apps.googleusercontent.com",
    "scopes": [
      "openid",
      "email",
      "profile"
    ]
  }
}
```

### Step 5: Test the Integration

1. Reload the extension in Chrome
2. Open extension popup
3. Go to Settings
4. Click **"Sign in with Google"**
5. Authorize the app
6. You should see your profile displayed

---

## 🔒 Security Features

### 1. **Encrypted Storage**
- All API keys are encrypted before storing in Chrome storage
- Uses XOR-based encryption with random 32-byte key
- Encryption key is stored separately and never exposed

### 2. **Secure Token Management**
- OAuth tokens are encrypted
- Tokens are cached and auto-refreshed
- Tokens are cleared on logout

### 3. **No Backend Server Required**
- Direct Chrome Identity API usage
- No intermediate server = no data leakage
- All processing happens client-side

---

## 🛠️ How It Works

### Google Login Flow:

```
1. User clicks "Sign in with Google"
   ↓
2. Chrome Identity API opens OAuth popup
   ↓
3. User authorizes WritterBuddy AI
   ↓
4. Extension receives OAuth token
   ↓
5. Fetch user profile from Google
   ↓
6. Encrypt and store session data
   ↓
7. Display user profile in settings
```

### API Key Management:

```
Primary Method (Recommended):
- Google Login → Auto fetch API key (requires backend)
- Currently uses manual entry as fallback

Secondary Method (Manual):
- User enters API key manually
- Key is validated via Gemini API test request
- Key is encrypted and stored securely
```

---

## 📝 API Key Encryption Details

### Encryption Algorithm:
- **Type**: XOR Cipher + Base64 encoding
- **Key Length**: 256 bits (32 bytes)
- **Storage**: Chrome Local Storage (encrypted)

### Example:
```javascript
// Encrypt
const encrypted = authManager.encrypt("AIzaSy..."); 
// Output: "QmFzZTY0IGVuY29kZWQ..."

// Decrypt
const decrypted = authManager.decrypt(encrypted);
// Output: "AIzaSy..."
```

---

## 🚀 Usage

### For End Users:

1. **Install Extension**
2. **Click "Sign in with Google"** (Recommended)
3. **OR Enter API Key Manually** (Advanced)
4. **Start using AI features**

### For Developers:

```javascript
// Check login status
const isLoggedIn = await authManager.isLoggedIn();

// Get user session
const session = await authManager.getUserSession();

// Get API key (decrypted)
const apiData = await authManager.getApiKey();
const apiKey = apiData.key;

// Save API key (encrypted)
await authManager.saveApiKey("AIzaSy...", "manual");

// Logout
await authManager.logout();
```

---

## 🔧 Troubleshooting

### Issue: "Failed to get auth token"
**Solution**: 
- Check if OAuth Client ID is correct
- Verify Extension ID matches in Google Console
- Clear Chrome cache and try again

### Issue: "API key validation failed"
**Solution**:
- Ensure API key starts with "AIza"
- Check if Gemini API is enabled in Google Cloud
- Verify API key has not expired

### Issue: "Encryption key not found"
**Solution**:
- Extension will auto-generate on first use
- If issues persist, clear storage and restart

---

## 📚 Resources

- [Chrome Identity API](https://developer.chrome.com/docs/extensions/reference/identity/)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Gemini API](https://ai.google.dev/)

---

## 🎯 Future Enhancements

### Planned Features:
- ✅ Google Login (Current)
- ⏳ Auto API Key Fetch via Backend
- ⏳ Cross-Device Sync
- ⏳ Usage Analytics Dashboard
- ⏳ Premium Tier Management

---

## 📄 License

This OAuth implementation is part of WritterBuddy AI and follows the same license as the main project.

---

**Made with ❤️ by WritterBuddy Team**
