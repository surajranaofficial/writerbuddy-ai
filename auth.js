// auth.js - Google OAuth Authentication & API Key Management
// Handles: Google Login, Auto API Key Fetch, Manual Fallback, Encrypted Storage

class AuthManager {
    constructor() {
        this.encryptionKey = null;
        this.initEncryption();
    }

    // Initialize encryption key (simple XOR-based encryption for Chrome storage)
    async initEncryption() {
        const stored = await chrome.storage.local.get('encKey');
        if (stored.encKey) {
            this.encryptionKey = stored.encKey;
        } else {
            // Generate random encryption key
            this.encryptionKey = this.generateRandomKey();
            await chrome.storage.local.set({ encKey: this.encryptionKey });
        }
    }

    generateRandomKey() {
        return Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    // Simple encryption (XOR-based)
    encrypt(text) {
        if (!text || !this.encryptionKey) return text;
        
        let encrypted = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
            encrypted += String.fromCharCode(charCode ^ keyChar);
        }
        return btoa(encrypted); // Base64 encode
    }

    // Simple decryption (XOR-based)
    decrypt(encrypted) {
        if (!encrypted || !this.encryptionKey) return encrypted;
        
        try {
            const decoded = atob(encrypted); // Base64 decode
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i);
                const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                decrypted += String.fromCharCode(charCode ^ keyChar);
            }
            return decrypted;
        } catch (error) {
            Logger.error('Decryption failed:', error);
            return null;
        }
    }

    // Google OAuth Login
    async loginWithGoogle() {
        try {
            Logger.debug('🔐 Starting Google OAuth login...');
            
            const token = await chrome.identity.getAuthToken({ interactive: true });
            
            if (!token) {
                throw new Error('Failed to get auth token');
            }

            Logger.debug('✅ Google OAuth token received');

            // Get user info
            const userInfo = await this.getUserInfo(token);
            
            // Store user session
            await this.saveUserSession({
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                token: token.token,
                loginTime: Date.now()
            });

            Logger.debug('✅ User logged in:', userInfo.email);
            
            return { success: true, user: userInfo };
            
        } catch (error) {
            Logger.error('❌ Google login failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user info from Google
    async getUserInfo(token) {
        try {
            // Try v3 endpoint first
            const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { 
                    'Authorization': `Bearer ${token.token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                Logger.error('User info fetch failed:', response.status, errorText);
                throw new Error(`Failed to get user info: ${response.status} - ${errorText}`);
            }
            
            const userInfo = await response.json();
            Logger.debug('User info received:', userInfo);
            
            return userInfo;
        } catch (error) {
            Logger.error('getUserInfo error:', error);
            throw error;
        }
    }

    // Save user session (encrypted)
    async saveUserSession(session) {
        const encryptedSession = {
            email: session.email,
            name: session.name,
            picture: session.picture,
            token: this.encrypt(session.token),
            loginTime: session.loginTime
        };
        
        await chrome.storage.local.set({ userSession: encryptedSession });
    }

    // Get current user session
    async getUserSession() {
        const data = await chrome.storage.local.get('userSession');
        if (!data.userSession) return null;
        
        return {
            ...data.userSession,
            token: this.decrypt(data.userSession.token)
        };
    }

    // Logout
    async logout() {
        try {
            const session = await this.getUserSession();
            if (session && session.token) {
                // Revoke token
                await chrome.identity.removeCachedAuthToken({ token: session.token });
            }
            
            // Clear session
            await chrome.storage.local.remove(['userSession']);
            
            Logger.debug('✅ User logged out');
            return { success: true };
            
        } catch (error) {
            Logger.error('❌ Logout failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if user is logged in
    async isLoggedIn() {
        const session = await this.getUserSession();
        return !!session && !!session.token;
    }

    // Save Gemini API Key (encrypted)
    async saveApiKey(apiKey, source = 'manual') {
        if (!apiKey) {
            throw new Error('API key is required');
        }

        // Validate API key format
        if (!apiKey.startsWith('AIza')) {
            throw new Error('Invalid Gemini API key format');
        }

        const encrypted = this.encrypt(apiKey);
        
        await chrome.storage.local.set({ 
            geminiAPIKey: encrypted,
            apiKeySource: source, // 'google' or 'manual'
            apiKeySavedAt: Date.now()
        });

        Logger.debug('✅ API key saved (encrypted):', source);
        return { success: true };
    }

    // Get Gemini API Key (decrypted)
    async getApiKey() {
        const data = await chrome.storage.local.get(['geminiAPIKey', 'apiKeySource']);
        
        if (!data.geminiAPIKey) {
            return null;
        }

        const decrypted = this.decrypt(data.geminiAPIKey);
        
        return {
            key: decrypted,
            source: data.apiKeySource || 'unknown'
        };
    }

    // Auto-fetch API key from Google (placeholder - requires backend)
    async autoFetchApiKey() {
        try {
            const session = await this.getUserSession();
            
            if (!session || !session.token) {
                throw new Error('User not logged in');
            }

            // NOTE: This requires a backend server to:
            // 1. Exchange Google OAuth token for user verification
            // 2. Generate/retrieve Gemini API key for user
            // 3. Return encrypted API key
            
            // For now, we'll use manual entry as fallback
            Logger.warn('⚠️ Auto API key fetch requires backend server. Using manual entry.');
            
            return { success: false, requiresManual: true };
            
        } catch (error) {
            Logger.error('❌ Auto API key fetch failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Validate API key by making test request
    async validateApiKey(apiKey) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
            );
            
            if (response.ok) {
                Logger.debug('✅ API key validated successfully');
                return { valid: true };
            } else {
                const error = await response.json();
                Logger.error('❌ API key validation failed:', error);
                return { valid: false, error: error.error?.message || 'Invalid API key' };
            }
            
        } catch (error) {
            Logger.error('❌ API key validation error:', error);
            return { valid: false, error: error.message };
        }
    }

    // Clear all auth data
    async clearAll() {
        await chrome.storage.local.remove([
            'userSession',
            'geminiAPIKey',
            'apiKeySource',
            'apiKeySavedAt'
        ]);
        Logger.debug('✅ All auth data cleared');
    }
}

// Export singleton instance
const authManager = new AuthManager();

// Make available globally
if (typeof window !== 'undefined') {
    window.authManager = authManager;
}

// For background script
if (typeof self !== 'undefined' && typeof chrome !== 'undefined') {
    self.authManager = authManager;
}
