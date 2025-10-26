// popup.js (Context-Aware & Custom Actions Version)

document.addEventListener('DOMContentLoaded', () => {
    Logger.debug('Popup DOM loaded - Context-Aware & Custom Actions version.');

    // --- UI ELEMENT REFERENCES ---

    const themeToggle = document.getElementById('theme-toggle');
    const userInput = document.getElementById('userInput');
    const generateBtn = document.getElementById('generateBtn');
    const outputPlaceholder = document.getElementById('outputPlaceholder');
    const outputContent = document.getElementById('outputContent');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorDisplay = document.getElementById('errorDisplay');
    const copyBtn = document.getElementById('copyBtn');

    // Views
    const actionsView = document.getElementById('actions-view');
    const languageView = document.getElementById('language-view');
    const customActionsView = document.getElementById('custom-actions-view');
    const settingsView = document.getElementById('settings-view');

    // Action Containers
    const actionsGridContainer = document.getElementById('actions-grid-container');
    const toneChangerContainer = document.getElementById('tone-changer-container');
    const customActionsContainer = document.getElementById('custom-actions-container');

    // Buttons
    const backButton = document.getElementById('back-button');
    const manageActionsBtn = document.getElementById('manage-actions-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const customActionsBackButton = document.getElementById('custom-actions-back-button');
    const settingsBackButton = document.getElementById('settings-back-button');
    const saveCustomActionBtn = document.getElementById('save-custom-action-btn');
    
    // API Key Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const toggleApiKeyVisibility = document.getElementById('toggle-api-key-visibility');
    const apiKeyStatus = document.getElementById('api-key-status');
    
    // Google Auth Elements
    const googleLoginBtn = document.getElementById('google-login-btn');
    const googleLogoutBtn = document.getElementById('google-logout-btn');
    const loginSection = document.getElementById('login-section');
    const userProfileSection = document.getElementById('user-profile-section');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    const apiKeyAutoSection = document.getElementById('api-key-auto-section');
    const apiKeyManualSection = document.getElementById('api-key-manual-section');

    // Custom Action Form
    const customActionsList = document.getElementById('custom-actions-list');
    const customActionNameInput = document.getElementById('custom-action-name');
    const customActionPromptInput = document.getElementById('custom-action-prompt');

    let selectedAction = null;
    let selectedLanguage = 'Hindi';
    let customActions = [];

    // --- CUSTOM ACTIONS LOGIC ---

    async function getCustomActions() {
        const data = await chrome.storage.local.get('customActions');
        return data.customActions || [];
    }

    async function saveCustomAction(name, prompt) {
        if (!name || !prompt) {
            Logger.error("Action name and prompt are required.");
            return;
        }
        const newAction = { id: `custom-${Date.now()}`, name, prompt };
        customActions.push(newAction);
        await chrome.storage.local.set({ customActions });
        Logger.debug("Custom action saved:", newAction);
        await renderCustomActions(); // Re-render lists
    }

    async function deleteCustomAction(actionId) {
        customActions = customActions.filter(action => action.id !== actionId);
        await chrome.storage.local.set({ customActions });
        Logger.debug("Custom action deleted:", actionId);
        await renderCustomActions(); // Re-render lists
    }

    async function renderCustomActions() {
        // Render buttons on the main view
        customActionsContainer.innerHTML = '';
        if (customActions.length > 0) {
            const header = '<h3 class="card-subheader">My Actions</h3>';
            const buttons = customActions.map(action =>
                `<button class="md-button-outlined action-button custom-action-btn" data-action-id="${action.id}" data-action-prompt="${action.prompt.replace(/"/g, '&quot;')}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor">
                        <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                    </svg>
                    <span>${action.name}</span>
                </button>`
            ).join('');
            customActionsContainer.innerHTML = header + `<div class="actions-grid">${buttons}</div>`;
        }

        // Render list in the management view
        customActionsList.innerHTML = '';
        if (customActions.length > 0) {
            customActionsList.innerHTML = customActions.map(action => `
                <div class="custom-action-item" data-action-id="${action.id}">
                    <span>${action.name}</span>
                    <button class="delete-custom-action-btn" title="Delete Action">&times;</button>
                </div>
            `).join('');
        } else {
            customActionsList.innerHTML = '<p style="text-align: center; color: var(--md-sys-color-on-surface-variant);">No custom actions saved yet.</p>';
        }
    }


    // --- HELPER FUNCTIONS ---

    function renderBaseActions(context) {
        const config = CONTEXT_CONFIG[context] || CONTEXT_CONFIG['default'];

        // Filter out the 'SmartReply' action specifically for the popup
        const filteredActions = config.actions.filter(btn => btn.action !== 'SmartReply');

        // Render main actions using the filtered list
        actionsGridContainer.innerHTML = filteredActions.map(btn =>
            `<button id="${btn.id}-button" class="md-button-outlined action-button" data-action="${btn.action}">
                ${btn.icon}
                <span>${btn.label}</span>
            </button>`
        ).join('');

        // Render tones
        toneChangerContainer.innerHTML = (config.tones && config.tones.length > 0)
            ? `<h3 class="card-subheader">Change Tone</h3><div class="actions-grid-3-col">${config.tones.map(btn => 
                `<button class="md-button-outlined action-button" data-action="${btn.action}">
                    ${btn.icon || ''}
                    <span>${btn.label}</span>
                </button>`
            ).join('')}</div>`
            : '';
    }

    function showView(viewName) {
        // Hide all views immediately without waiting
        [actionsView, languageView, customActionsView, settingsView].forEach(view => {
            if (!view.classList.contains('view-hidden')) {
                view.classList.add('view-hidden');
            }
        });

        // Reset scroll position for main content container - ALWAYS reset to top
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTop = 0;
        }

        // Show the requested view after a tiny delay to prevent blinking
        setTimeout(() => {
            if (viewName === 'actions') actionsView.classList.remove('view-hidden');
            else if (viewName === 'language') languageView.classList.remove('view-hidden');
            else if (viewName === 'custom') customActionsView.classList.remove('view-hidden');
            else if (viewName === 'settings') settingsView.classList.remove('view-hidden');
        }, 10);
    }

    function setupLanguageView() {
        const languageOptionsContainer = document.getElementById('language-options-container');
        if (!languageOptionsContainer) return;

        languageOptionsContainer.innerHTML = LANGUAGES.map(lang =>
            `<div class="custom-option" data-value="${lang.code}">${lang.name}</div>`
        ).join('');

        const languageSearchInput = document.getElementById('language-search-input');
        const allCustomOptions = languageOptionsContainer.querySelectorAll('.custom-option');

        allCustomOptions.forEach(option => {
            option.addEventListener('click', () => {
                selectedLanguage = option.dataset.value;
                Logger.debug(`Language selected: ${selectedLanguage}`);
                showView('actions');
                selectedAction = { type: 'Translate' };
                document.querySelectorAll('.action-button').forEach(btn => btn.classList.remove('active'));
                const translateButton = document.getElementById('translate-button');
                if (translateButton) translateButton.classList.add('active');
                generateBtn.disabled = !userInput.value.trim();
            });
        });

        languageSearchInput.addEventListener('keyup', () => {
            const filter = languageSearchInput.value.toLowerCase();
            allCustomOptions.forEach(option => {
                option.style.display = option.textContent.toLowerCase().includes(filter) ? 'block' : 'none';
            });
        });
    }

    // --- ASYNC INITIALIZATION ---

    async function initializePopup() {
        // Setup Theme
        const themeData = await chrome.storage.local.get('theme');
        const currentTheme = themeData.theme || 'light';
        const body = document.querySelector('.writterbuddy-popup-body');
        if (body) {
            body.setAttribute('data-theme', currentTheme);
        }
        document.body.setAttribute('data-theme', currentTheme);
        document.documentElement.setAttribute('data-theme', currentTheme);
        themeToggle.checked = currentTheme === 'dark';

        // Setup AI Model Preference
        const modelPrefData = await chrome.storage.local.get('ai_model_preference');
        const currentModelPref = modelPrefData.ai_model_preference || 'hybrid';
        document.querySelector(`input[name="ai-model"][value="${currentModelPref}"]`).checked = true;

        // Get context and render base buttons
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const context = getContext(tab.url);
        renderBaseActions(context);

        // Load and render custom actions
        customActions = await getCustomActions();
        await renderCustomActions();

        // Setup other views
        setupLanguageView();
        showView('actions');
    }

    // --- MASTER EVENT LISTENER (EVENT DELEGATION) ---

    document.addEventListener('click', (event) => {
        const target = event.target;

        // Handle Action Button clicks
        const actionButton = target.closest('.action-button');
        if (actionButton) {
            const action = actionButton.dataset.action;
            const actionId = actionButton.dataset.actionId;

            document.querySelectorAll('.action-button').forEach(btn => btn.classList.remove('active'));
            actionButton.classList.add('active');

            if (actionId) { // It's a custom action
                selectedAction = {
                    type: 'Custom',
                    prompt: actionButton.dataset.actionPrompt
                };
                Logger.debug(`Custom action selected:`, selectedAction);
            } else { // It's a built-in action
                selectedAction = { type: action };
                Logger.debug(`Built-in action selected: ${action}`);
            }

            if (action === 'Translate') {
                showView('language');
                document.getElementById('language-search-input').focus();
            } else {
                // Do not switch view if we are already in the custom actions manager
                if (!customActionsView.contains(actionButton)) {
                    showView('actions');
                }
            }
            generateBtn.disabled = !userInput.value.trim();
            return; // Stop further processing
        }

        // Handle Delete Custom Action Button clicks
        const deleteButton = target.closest('.delete-custom-action-btn');
        if (deleteButton) {
            const actionId = deleteButton.parentElement.dataset.actionId;
            deleteCustomAction(actionId);
            return; // Stop further processing
        }
    });


    // --- STATIC EVENT LISTENERS ---

    settingsBtn.addEventListener('click', () => {
        showView('settings');
    });
    
    settingsBackButton.addEventListener('click', () => {
        showView('actions');
    });

    document.querySelectorAll('input[name="ai-model"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            chrome.storage.local.set({ ai_model_preference: event.target.value });
        });
    });

    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'dark' : 'light';
        const body = document.querySelector('.writterbuddy-popup-body');
        
        // Apply theme to all relevant elements
        if (body) {
            body.setAttribute('data-theme', newTheme);
        }
        document.body.setAttribute('data-theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Save theme preference
        chrome.storage.local.set({ theme: newTheme });
        
        Logger.debug(`Theme changed to: ${newTheme}`);
    });

    userInput.addEventListener('input', () => {
        generateBtn.disabled = !userInput.value.trim();
    });

    backButton.addEventListener('click', () => {
        showView('actions');
    });
    
    customActionsBackButton.addEventListener('click', () => {
        showView('actions');
    });
    
    manageActionsBtn.addEventListener('click', () => {
        showView('custom');
    });

    saveCustomActionBtn.addEventListener('click', async () => {
        const name = customActionNameInput.value.trim();
        const prompt = customActionPromptInput.value.trim();
        await saveCustomAction(name, prompt);
        customActionNameInput.value = '';
        customActionPromptInput.value = '';
    });

    const originalCopyBtnHTML = copyBtn.innerHTML;

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(outputContent.textContent).then(() => {
            copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>`;
            copyBtn.classList.add('copied');
            copyBtn.disabled = true;
            setTimeout(() => {
                copyBtn.innerHTML = originalCopyBtnHTML;
                copyBtn.classList.remove('copied');
                copyBtn.disabled = false;
            }, 2000);
        }).catch(err => Logger.error('Failed to copy text: ', err));
    });

    generateBtn.addEventListener('click', () => {
        let text = userInput.value;
        if (!text.trim() || !selectedAction) return;
        Logger.info(`Generate button clicked. Action:`, selectedAction);

        if (selectedAction.type === 'GenerateTweet') {
            let payload = null;
            try {
                const maybe = JSON.parse(text);
                if (maybe && (maybe.topic || maybe.mood)) payload = maybe;
            } catch {}
            if (!payload) {
                const topic = text.trim();
                const mood = prompt('Mood/Tone? (e.g., Witty, Motivational, Professional)') || '';
                payload = { topic, mood, date: new Date().toISOString() };
            }
            text = JSON.stringify(payload);
        }

        errorDisplay.textContent = '';
        errorDisplay.className = '';
        outputContent.textContent = '';
        outputContent.classList.add('streaming');
        outputContent.style.display = 'block';
        outputPlaceholder.style.display = 'none';
        loadingIndicator.style.display = 'flex';
        copyBtn.hidden = true;
        generateBtn.disabled = true;
        generateBtn.classList.add('loading');

        chrome.runtime.sendMessage({
            type: 'START_AI_STREAM',
            action: selectedAction.type,
            text: text,
            targetLanguage: selectedAction.type === 'Translate' ? selectedLanguage : undefined,
            customPrompt: selectedAction.type === 'Custom' ? selectedAction.prompt : undefined
        });
    });

    // --- MESSAGE HANDLING ---

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
            case 'AI_CHUNK':
                loadingIndicator.style.display = 'none';
                outputContent.textContent += message.data;
                break;
            case 'AI_STREAM_END':
                outputContent.classList.remove('streaming');
                generateBtn.disabled = false;
                generateBtn.classList.remove('loading');
                if (outputContent.textContent) copyBtn.hidden = false;
                Logger.debug('AI Stream ended.');
                break;
            case 'AI_INFO':
                errorDisplay.textContent = message.data;
                errorDisplay.className = 'info';
                break;
            case 'AI_ERROR':
                outputContent.classList.remove('streaming');
                errorDisplay.textContent = `Error: ${message.error}`;
                outputPlaceholder.style.display = 'block';
                outputContent.style.display = 'none';
                loadingIndicator.style.display = 'none';
                generateBtn.disabled = false;
                generateBtn.classList.remove('loading');
                copyBtn.hidden = true;
                break;
        }
    });

    // --- API KEY MANAGEMENT ---
    
    // Update UI based on login status
    async function updateAuthUI() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'CHECK_LOGIN_STATUS' });
            
            if (response && response.isLoggedIn) {
                const session = response.session;
                
                // Show user profile
                loginSection.style.display = 'none';
                userProfileSection.style.display = 'block';
                userAvatar.src = session.picture || 'icon.png';
                userName.textContent = session.name || 'User';
                userEmail.textContent = session.email || '';
                
                // Show auto API key section (if implemented)
                // apiKeyAutoSection.style.display = 'block';
                // apiKeyManualSection.style.display = 'none';
                
            } else {
                // Show login button
                loginSection.style.display = 'block';
                userProfileSection.style.display = 'none';
                apiKeyAutoSection.style.display = 'none';
                apiKeyManualSection.style.display = 'block';
            }
        } catch (error) {
            Logger.error('Failed to update auth UI:', error);
            loginSection.style.display = 'block';
            userProfileSection.style.display = 'none';
        }
    }
    
    // Google Login
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                googleLoginBtn.disabled = true;
                googleLoginBtn.innerHTML = '<div class="spinner-btn"></div><span>Signing in...</span>';
                
                const response = await chrome.runtime.sendMessage({ type: 'GOOGLE_LOGIN' });
                
                if (response && response.success) {
                    showApiKeyStatus('✅ Signed in successfully!', 'success');
                    await updateAuthUI();
                } else {
                    showApiKeyStatus(`❌ Sign in failed: ${response?.error || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                showApiKeyStatus(`❌ Sign in failed: ${error.message}`, 'error');
                Logger.error('Google login error:', error);
            } finally {
                googleLoginBtn.disabled = false;
                googleLoginBtn.innerHTML = '<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg><span>Sign in with Google</span>';
            }
        });
    }
    
    // Google Logout
    if (googleLogoutBtn) {
        googleLogoutBtn.addEventListener('click', async () => {
            try {
                googleLogoutBtn.disabled = true;
                googleLogoutBtn.innerHTML = '<div class="spinner-btn"></div><span>Signing out...</span>';
                
                const response = await chrome.runtime.sendMessage({ type: 'GOOGLE_LOGOUT' });
                
                if (response && response.success) {
                    showApiKeyStatus('✅ Signed out successfully', 'success');
                    await updateAuthUI();
                } else {
                    showApiKeyStatus(`❌ Sign out failed: ${response?.error || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                showApiKeyStatus(`❌ Sign out failed: ${error.message}`, 'error');
                Logger.error('Google logout error:', error);
            } finally {
                googleLogoutBtn.disabled = false;
                googleLogoutBtn.innerHTML = '🚪 Sign Out';
            }
        });
    }
    
    // Load saved API key
    async function loadApiKey() {
        try {
            const response = await chrome.runtime.sendMessage({ type: 'GET_API_KEY' });
            if (response && response.apiKey) {
                apiKeyInput.value = response.apiKey;
                const source = response.source === 'google' ? ' (via Google)' : '';
                showApiKeyStatus(`✅ API key loaded${source}`, 'success');
            }
        } catch (error) {
            Logger.error('Failed to load API key:', error);
        }
    }
    
    // Save API key with encryption
    async function saveApiKey() {
        const apiKey = apiKeyInput.value.trim();
        
        if (!apiKey) {
            showApiKeyStatus('⚠️ Please enter an API key', 'error');
            return;
        }
        
        try {
            // Validate first
            saveApiKeyBtn.disabled = true;
            saveApiKeyBtn.innerHTML = '<div class="spinner-btn"></div><span>Validating...</span>';
            
            const response = await chrome.runtime.sendMessage({ 
                type: 'SAVE_API_KEY', 
                apiKey: apiKey 
            });
            
            if (response && response.success) {
                showApiKeyStatus('✅ API key saved & encrypted successfully!', 'success');
            } else {
                showApiKeyStatus(`⚠️ ${response?.error || 'Failed to save API key'}`, 'error');
            }
            
        } catch (error) {
            showApiKeyStatus(`❌ ${error.message}`, 'error');
            Logger.error('Failed to save API key:', error);
        } finally {
            saveApiKeyBtn.disabled = false;
            saveApiKeyBtn.innerHTML = '💾 Save API Key';
        }
    }
    
    // Show API key status message
    function showApiKeyStatus(message, type) {
        apiKeyStatus.textContent = message;
        apiKeyStatus.style.display = 'block';
        apiKeyStatus.style.background = type === 'success' 
            ? 'var(--md-sys-color-primary-container)' 
            : 'var(--md-sys-color-error-container)';
        apiKeyStatus.style.color = type === 'success' 
            ? 'var(--md-sys-color-on-primary-container)' 
            : 'var(--md-sys-color-on-error-container)';
        
        // Hide after 3 seconds
        setTimeout(() => {
            apiKeyStatus.style.display = 'none';
        }, 3000);
    }
    
    // Toggle API key visibility
    if (toggleApiKeyVisibility) {
        toggleApiKeyVisibility.addEventListener('click', () => {
            const type = apiKeyInput.type === 'password' ? 'text' : 'password';
            apiKeyInput.type = type;
            
            // Update icon
            const icon = toggleApiKeyVisibility.querySelector('svg path:last-child');
            if (type === 'text') {
                // Eye with slash (hide)
                icon.setAttribute('d', 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z');
            } else {
                // Normal eye (show)
                icon.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
            }
        });
    }
    
    // Save API key button
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', saveApiKey);
    }
    
    // Load API key on settings view open
    if (settingsBtn) {
        settingsBtn.addEventListener('click', async () => {
            await loadApiKey();
            await updateAuthUI();
        });
    }

    // --- KICK OFF INITIALIZATION ---

    initializePopup();
});
