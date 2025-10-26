// content.js (Unified Bubble Menu Version - Patched)
// Ensure immediate listeners for bubble visibility
try{document.addEventListener('pointerdown',e=>{const el=(e.target&&e.target.id==='writebuddy-language-search')?null:getClosestEditable(e.target);if(el)showBubbleAndMenu(el);},{capture:true});}catch{}

// Ensure script runs early
try{if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>{try{initWriteBuddyEarly&&initWriteBuddyEarly();}catch{}});}else{try{initWriteBuddyEarly&&initWriteBuddyEarly();}catch{}}}catch{}


let activeElement = null;
let bubbleIcon = null;
let menuContainer = null;
let languageMenuContainer = null;
let aiBrushToolbar = null;
let isAiBrushActive = false; // Default OFF, auto-enable on specific sites
let hideBubbleTimeout = null;
let isDragging = false;
let savedRange = null;
let resultsPopup = null;

// ✨ Auto-enable AI Brush on specific websites
const AI_BRUSH_AUTO_SITES = [
    // Wikipedia
    'wikipedia.org',
    
    // USA News Sites
    'cnn.com',
    'nytimes.com',
    'reuters.com',
    'apnews.com',
    'washingtonpost.com',
    'usatoday.com',
    'wsj.com',
    'nbcnews.com',
    'abcnews.go.com',
    'cbsnews.com',
    'foxnews.com',
    'bloomberg.com',
    'time.com',
    'newsweek.com',
    'thehill.com',
    'politico.com',
    'npr.org',
    'pbs.org',
    'msnbc.com',
    'cnbc.com',
    
    // UK News Sites
    'bbc.com',
    'bbc.co.uk',
    'theguardian.com',
    'telegraph.co.uk',
    'independent.co.uk',
    
    // International News
    'aljazeera.com',
    'news.google.com',
    
    // Indian News Sites
    'ndtv.com',
    'timesofindia.indiatimes.com',
    'hindustantimes.com',
    'indianexpress.com',
    'thehindu.com',
    'india.com',
    'news18.com',
    'zeenews.india.com'
];

// ✨ Google Search detection (excluding Gmail, Drive, etc.)
function isGoogleSearch() {
    const hostname = window.location.hostname.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    
    // Check if it's a Google domain
    if (!hostname.includes('google.com') && 
        !hostname.includes('google.co.in') && 
        !hostname.includes('google.co.uk') &&
        !hostname.includes('google.ca') &&
        !hostname.includes('google.com.au')) {
        return false;
    }
    
    // Exclude Gmail, Drive, Docs, etc.
    if (hostname.includes('mail.google') || 
        hostname.includes('drive.google') ||
        hostname.includes('docs.google') ||
        hostname.includes('sheets.google') ||
        hostname.includes('slides.google') ||
        hostname.includes('calendar.google') ||
        hostname.includes('meet.google') ||
        hostname.includes('chat.google')) {
        return false;
    }
    
    // Check if it's Google Search (usually has /search or is the main page)
    return pathname.includes('/search') || pathname === '/' || pathname === '';
}

// Check if current website should auto-enable AI Brush
function shouldAutoEnableAIBrush() {
    // Check if it's Google Search (not Gmail, Drive, etc.)
    if (isGoogleSearch()) {
        return true;
    }
    
    // Check other news sites
    const hostname = window.location.hostname.toLowerCase();
    return AI_BRUSH_AUTO_SITES.some(site => hostname.includes(site));
}

// Auto-enable AI Brush on specific sites
if (shouldAutoEnableAIBrush()) {
    isAiBrushActive = true;
    Logger.debug('AI Brush auto-enabled for:', window.location.hostname);
}

// Create a shadow root for CSS isolation
const writebuddyRoot = document.createElement('div');
writebuddyRoot.id = 'writebuddy-root';
let twitterGenBtn = null;

(document.documentElement || document.body || document.head).appendChild(writebuddyRoot);

const shadowRoot = writebuddyRoot.attachShadow({ mode: 'open' });

// Inject the stylesheet into the shadow DOM
const styleLink = document.createElement('link');
styleLink.rel = 'stylesheet';
function initWriteBuddyEarly(){
  // listen ASAP to focus/click to show bubble
  const handler = (e)=>{ const el = getClosestEditable(e.target); if (el) showBubbleAndMenu(el); };
  document.addEventListener('focusin', handler, {capture:true});
  document.addEventListener('click', handler, {capture:true});
}

styleLink.href = chrome.runtime.getURL('style.css');
shadowRoot.appendChild(styleLink);

// Apply theme from storage
(async () => {
    const themeData = await chrome.storage.local.get('theme');
    const currentTheme = themeData.theme || 'light';
    if (currentTheme === 'dark') {
        writebuddyRoot.classList.add('theme-dark');
    }
})();

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.theme) {
    if (changes.theme.newValue === 'dark') {
        writebuddyRoot.classList.add('theme-dark');
    } else {
        writebuddyRoot.classList.remove('theme-dark');
    }
  }
});


const magicalPencilIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path><path d="M15 5l4 4"></path></svg>`;
const sparkleIcon = '<span class="wb-sparkle">✨</span>';
const loadingIcon = '<span class="wb-sparkle">⏳</span>';
const errorIcon = '<span class="wb-sparkle">❌</span>';

Logger.debug('Content script loaded - Unified Bubble Menu Version.');


// Detect YouTube Studio reply editor context (global)
function isYouTubeReplyContext(el) {
    try {
        if (!el) return false;
        const aria = el.getAttribute ? el.getAttribute('aria-label') || '' : '';
        const ph = el.getAttribute ? el.getAttribute('placeholder') || '' : '';
        if (/add a reply/i.test(aria + ' ' + ph)) return true;
        const id = el.id || '';
        const cls = typeof el.className === 'string' ? el.className : '';
        if (/\breply\b/i.test(id) || /\breply\b/i.test(cls)) return true;
        const container = el.closest ? el.closest('*[class*="reply"], *[id*="reply"], ytcp-comment, ytcp-comment-thread, ytd-comment-renderer') : null;
        return !!container;
    } catch { return false; }
}

// --- Insertion helpers for closed Shadow DOM editors (e.g., YouTube Studio) ---
function isTextInput(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (!tag) return false;
    if (tag === 'TEXTAREA' || el.isContentEditable) return true;
    if (tag === 'INPUT') {
        const t = (el.type || '').toLowerCase();
        return ['text','search','email','url','password','tel','number'].includes(t);

    }
    return false;
}


// Global helper: remove duplicated prefix when model echoes the original text
function stripDuplicatePrefix(original, generated){
  try{
    const o=(original||'').trim();
    let g=(generated||'');
    if(!o||!g) return generated;
    const normO=o.replace(/\s+/g,' ').trim();
    const lowerG=g.toLowerCase();
    const lowerO=normO.toLowerCase();
    const idx=lowerG.indexOf(lowerO);
    if(idx===0){
      g=g.slice(normO.length).replace(/^\s*[,.:;\-\u2013\u2014]?\s*/,'');
      return g;
    }
    return generated;
  }catch{ return generated; }
}

function notifyInput(el){
// Remove duplicated prefix when model echoes the original text
function stripDuplicatePrefix(original, generated){
  try{
    const o=(original||'').trim();
    let g=(generated||'');
    if(!o||!g) return generated;
    const normO=o.replace(/\s+/g,' ').trim();
    const lowerG=g.toLowerCase();
    const lowerO=normO.toLowerCase();
    const idx=lowerG.indexOf(lowerO);
    if(idx===0){
      g=g.slice(normO.length).replace(/^\s*[,.:;\-–—]?\s*/,'');
      return g;
    }
    return generated;
  }catch{ return generated; }
}

    try { el.dispatchEvent(new InputEvent('input', { bubbles: true })); }
    catch(e){ try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch(_){} }
}

function insertTextSmart(text) {
    try {
        // Prefer savedRange if present (for AI Brush)
        if (savedRange && text) {
            const range = savedRange;
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            // move caret to end
            range.collapse(false);
            savedRange = null;
            return true;
        }
        // Determine target element and try native insertion first
        let el = activeElement || document.activeElement;
        if (isTextInput(el)) {
            try { if (el.focus) el.focus(); } catch(_){}
            if (document.execCommand) {
                try {
                    const okCmd = document.execCommand('insertText', false, text);
                    if (okCmd) { notifyInput(el); return true; }
                } catch(_){ }
            }
        }
        if (isTextInput(el)) {
            if (el.isContentEditable) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(text));
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    notifyInput(el);
                    return true;
                }
                el.appendChild(document.createTextNode(text));
                notifyInput(el);
                return true;
            } else if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
                const start = el.selectionStart ?? el.value.length;
                const end = el.selectionEnd ?? el.value.length;
                el.setRangeText(text, start, end, 'end');
                notifyInput(el);
                return true;
            }
        }
        // Fallback: execCommand works for many shadow editors
        const ok = document.execCommand && document.execCommand('insertText', false, text);
        if (ok) { if (activeElement) notifyInput(activeElement); return true; }
        // last resort: copy to clipboard so user can paste
        navigator.clipboard.writeText(text).catch(() => {});
        return false;
    } catch (e) {
        Logger.warn('insertTextSmart fallback used:', e);
        try { return document.execCommand('insertText', false, text); } catch { return false; }
    }
}

// --- Gmail Specific Logic ---

function getGmailEmailContent(composeView) {
    // New, more robust strategy: Find all visible email bodies directly.
    const emailBodies = document.querySelectorAll('div.a3s.aiL');

    if (!emailBodies || emailBodies.length === 0) {
        Logger.warn("Could not find any email bodies with selector 'div.a3s.aiL' in the document.");
        return null;
    }

    let fullThreadText = "";
    emailBodies.forEach((body, index) => {
        if (body.offsetHeight > 0) {
            fullThreadText += `--- Email ${index + 1} ---
${body.innerText}

`;
        }
    });

    if (!fullThreadText) {

        Logger.warn("Found email body elements, but they were empty or hidden.");
        return null;
    }

    Logger.debug("Extracted Gmail thread content:", fullThreadText);
    return fullThreadText;
}

// --- Utilities ---

function getCumulativeFrameOffset(win) {
    let x = 0, y = 0;
    let current = win;
    while (current !== current.top) {
        const frameEl = current.frameElement;
        if (!frameEl) break;
        const r = frameEl.getBoundingClientRect();
        x += r.left;
        y += r.top;
        current = current.parent;
    }
    return { x, y };
}

function getClosestEditable(element) {
    if (!element) {
        Logger.debug('getClosestEditable: Element is null.');
        return null;
    }

    let currentElement = element;
    while (currentElement) {
        const tagName = currentElement.tagName?.toUpperCase();
        Logger.debug('getClosestEditable: Checking element', currentElement, 'Tag:', tagName);

        if (tagName === 'TEXTAREA' || currentElement.isContentEditable || currentElement.getAttribute('role') === 'textbox') {
            Logger.debug('getClosestEditable: Found editable element', currentElement);
            return currentElement;
        }
        if (tagName === 'INPUT') {
            const inputType = currentElement.type?.toLowerCase();
            const textLikeInputTypes = ['text', 'search', 'email', 'url', 'password', 'number', 'tel', 'date', 'month', 'week', 'time', 'datetime-local'];
            if (textLikeInputTypes.includes(inputType)) {
                Logger.debug('getClosestEditable: Found editable INPUT element', currentElement);
                return currentElement;
            }
        }

        currentElement = currentElement.parentElement;
    }
    Logger.debug('getClosestEditable: No editable element found in hierarchy.');
    return null;
}

// Heuristic extractor for YouTube Studio comment context near a reply editor
function getYouTubeReplyContext(editorEl) {
  try {
    let node = editorEl;
    let container = null;
    let steps = 0;
    while (node && steps < 8) {
      if ((node.className && typeof node.className === 'string' && /comment/i.test(node.className)) ||
          (node.id && /comment/i.test(node.id))) { container = node; break; }
      node = node.parentElement; steps++;
    }
    if (!container && editorEl && editorEl.closest) {
      container = editorEl.closest('*[class*="comment"], *[id*="comment"]');
    }
    let best = '';
    if (container && container.querySelectorAll) {
      const candidates = container.querySelectorAll('*[class*="content"], *[class*="text"], *[id*="content"], *[id*="text"]');
      candidates.forEach(el => {
        const visible = el.offsetParent !== null;
        const txt = el.innerText?.trim();
        if (visible && txt && txt.length > best.length) best = txt;
      });
    }
    if (!best && editorEl) {
      let prev = editorEl.previousElementSibling; let count = 0;
      while (prev && count < 5) { const tx = prev.innerText?.trim(); if (tx && tx.length > best.length) best = tx; prev = prev.previousElementSibling; count++; }
    }
    if (!best && editorEl && editorEl.closest) {
      const thread = editorEl.closest('ytd-comment-thread-renderer, ytcp-comment-thread, ytcp-comment');
      if (thread && thread.innerText) best = thread.innerText.trim();
    }
    return best ? best.slice(0, 1200) : '';
  } catch (e) { return ''; }
}


// --- UI Creation ---

function createBubbleIcon() {
    const icon = document.createElement('div');
    icon.id = 'writebuddy-bubble-icon';
    icon.style.display='flex'; icon.style.alignItems='center'; icon.style.justifyContent='center'; icon.style.textAlign='center';
    icon.innerHTML = isAiBrushActive ? magicalPencilIcon : sparkleIcon;
    icon.addEventListener('click', handleBubbleClick);
    icon.addEventListener('mousedown', onBubbleMouseDown);
    return icon;
}

function createMenuContainer() {
    const menu = document.createElement('div');
    menu.id = 'writebuddy-bubble-menu';
    menu.addEventListener('mousedown', (event) => event.stopPropagation());
    return menu;
}

function createLanguageMenu() {
    const langMenu = document.createElement('div');
    langMenu.id = 'writebuddy-language-menu';
    langMenu.innerHTML = `
        <div class="writebuddy-language-search-container">
            <input type="text" id="writebuddy-language-search" placeholder="Search language...">
        </div>
        <div id="writebuddy-language-list"></div>
    `;
    langMenu.addEventListener('mousedown', (event) => event.stopPropagation());
    shadowRoot.appendChild(langMenu);
    return langMenu;
}

function createAiBrushToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'writebuddy-ai-brush-toolbar';
    toolbar.addEventListener('mousedown', (e) => e.preventDefault());
    shadowRoot.appendChild(toolbar);
    return toolbar;
}

function createResultsPopup() {
    const popup = document.createElement('div');
    popup.id = 'writebuddy-results-popup';
    popup.innerHTML = `
        <div class="writebuddy-popup-header">
            <h3>AI Results</h3>
            <button id="writebuddy-close-popup-btn">&times;</button>
        </div>
        <div id="writebuddy-popup-content"></div>


    `;

// Determine YouTube Studio field kind for smart menu filtering
function getYouTubeFieldKind(el) {
    try {
        if (!el) return null;
        if (isYouTubeReplyContext(el)) return 'reply';
        const parts = [];
        const grab = (k) => { try { const v = el.getAttribute && el.getAttribute(k); if (v) parts.push(v); } catch {}
        };
        grab('aria-label'); grab('placeholder'); grab('name');
        const id = el.id || ''; const cls = typeof el.className === 'string' ? el.className : '';
        const text = (parts.join(' ') + ' ' + id + ' ' + cls).toLowerCase();
        if (/\btitle\b/.test(text)) return 'title';
        if (/(description|desc)/.test(text)) return 'description';
        if (/\btag(s)?\b/.test(text)) return 'tags';
        return null;
    } catch { return null; }
}

    shadowRoot.appendChild(popup);
    popup.querySelector('#writebuddy-close-popup-btn').addEventListener('click', () => {
        popup.style.display = 'none';
    });
    return popup;
}

// --- UI Population & Display ---

function populateMenu(menu, intentions = null) {
    const context = getContext(window.location.href);
    let config = CONTEXT_CONFIG[context] || CONTEXT_CONFIG['default'];
    menu.innerHTML = '';

    // If the context is gmail, check if we are in a reply context.
    if (context === 'gmail') {
        const emailContent = getGmailEmailContent(activeElement);
        // If there's no email content, it's a new compose, so hide Smart Reply.
        if (!emailContent) {
            // Create a deep copy of the config to avoid modifying the original
            const newConfig = JSON.parse(JSON.stringify(config));


            // Filter out the SmartReply action
            newConfig.actions = newConfig.actions.filter(action => action.action !== 'SmartReply');
            config = newConfig;
        }
    }

    // If we have intentions, show them instead of the main menu
    if (intentions) {
        const header = document.createElement('div');
        header.className = 'writebuddy-menu-header';
        header.innerText = 'Choose an intention:';
        menu.appendChild(header);

        intentions.forEach(intention => {
            const menuItem = document.createElement('div');
            menuItem.className = 'writebuddy-menu-item';
            menuItem.innerHTML = `<span class="writebuddy-menu-item-text">${intention}</span>`;
            menuItem.dataset.action = 'GenerateSmartReply';


            menuItem.dataset.intention = intention;
            menuItem.addEventListener('click', handleMenuItemClick);
            menu.appendChild(menuItem);
        });
        return;
    }

    const aiBrushButton = document.createElement('div');
    aiBrushButton.className = 'writebuddy-menu-item';
    if (isAiBrushActive) aiBrushButton.classList.add('active');
    aiBrushButton.innerHTML = `${magicalPencilIcon} <span class="writebuddy-menu-item-text">AI Brush</span> <span class="writebuddy-status">${isAiBrushActive ? 'ON' : 'OFF'}</span>`;
    aiBrushButton.dataset.action = 'toggle-ai-brush';
    aiBrushButton.addEventListener('click', handleMenuItemClick);
    menu.appendChild(aiBrushButton);

    let allActions = [...config.actions, ...config.tones];
    // Smart filter for YouTube editors (reply/title/description/tags)
    if (context === 'youtube') {
        try {
            const kind = getYouTubeFieldKind(activeElement);
            let allowed = null;
            if (kind === 'reply') {
                allowed = new Set(['CommentReplies','Translate','Grammar Fix','Rephrase','Casual','Formal','Confident']);
            } else if (kind === 'title') {
                allowed = new Set(['Generate Titles','Rephrase','Casual','Formal','Confident','Translate','ThumbnailText']);
            } else if (kind === 'description') {
                allowed = new Set(['OptimizeDescription','GenerateDescription','GenerateChapters','PolicyCheck','Rephrase','Casual','Formal','Confident','Translate','Generate Hashtags']);
            } else if (kind === 'tags') {
                allowed = new Set(['Generate Tags','Generate Hashtags','Translate']);
            }
            if (allowed) {
                const filtered = allActions.filter(a => allowed.has(a.action));
                allActions = filtered.length ? filtered : [...config.actions, ...config.tones];
            }
        } catch (e) {
            Logger.warn('YT smart filter error, showing full menu:', e);
        }
    }
    allActions.forEach(item => {
        if (item.action === 'GenerateTweet') return; // remove Tweet Generator
        const menuItem = document.createElement('div');
        menuItem.className = 'writebuddy-menu-item';
        menuItem.innerHTML = `${item.icon || ''}<span class="writebuddy-menu-item-text">${item.label}</span>`;
        menuItem.dataset.action = item.action;
        menuItem.addEventListener('click', handleMenuItemClick);
        menu.appendChild(menuItem);
    });
}

function populateLanguageMenu() {
    if (!languageMenuContainer) return;
    const langList = languageMenuContainer.querySelector('#writebuddy-language-list');
    if (!langList) return;
    
    // Get text from selection - ALWAYS use savedRange or current selection
    let textToTranslate = '';
    
    // Priority 1: Use savedRange if available
    if (savedRange) {
        textToTranslate = savedRange.toString().trim();
        Logger.debug(`Using savedRange for translation: "${textToTranslate.substring(0, 50)}..."`);
    }
    
    // Priority 2: Use current selection if savedRange is empty
    if (!textToTranslate) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (selectedText) {
            textToTranslate = selectedText;
            Logger.debug(`Using current selection for translation: "${textToTranslate.substring(0, 50)}..."`);
        }
    }
    
    // Priority 3: Only if NO selection, use activeElement (for Gmail bubble icon)
    if (!textToTranslate && activeElement) {
        let targetElement = activeElement;
        
        if (activeElement.isContentEditable) {
            // Gmail mein nested divs hote hain, find the root compose box
            if (window.location.hostname.includes('mail.google.com')) {
                // Walk up the DOM tree to find the main compose box
                let parent = activeElement;
                while (parent && parent.parentElement) {
                    if (parent.getAttribute('role') === 'textbox' || 
                        parent.classList.contains('Am') || 
                        (parent.contentEditable === 'true' && parent.parentElement?.contentEditable !== 'true')) {
                        targetElement = parent;
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
            textToTranslate = targetElement.textContent || targetElement.innerText;
        } else {
            textToTranslate = activeElement.value;
        }
        Logger.debug(`Using activeElement for translation: "${textToTranslate.substring(0, 50)}..."`);
    }
    
    Logger.debug(`Populate language menu - Text to translate length: ${textToTranslate.length}, First 100 chars: ${textToTranslate.substring(0, 100)}`);
    
    langList.innerHTML = LANGUAGES.map(lang =>
        `<div class="writebuddy-language-item" data-lang-code="${lang.code}">${lang.name}</div>`
    ).join('');
    langList.querySelectorAll('.writebuddy-language-item').forEach(item => {
        item.addEventListener('click', (event) => {
            const targetLanguage = event.currentTarget.dataset.langCode;
            triggerTranslation(targetLanguage, textToTranslate);
            languageMenuContainer.style.visibility = 'hidden';
        });
    });
    const searchInput = languageMenuContainer.querySelector('#writebuddy-language-search');
    searchInput.addEventListener('keyup', () => {

// Remove old twitter generator helpers
function ensureTwitterButton(){}
function hideTwitterButton(){}
async function startGenerateTweetFlow(){}
        const filter = searchInput.value.toLowerCase();
        langList.querySelectorAll('.writebuddy-language-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(filter) ? '' : 'none';
        });
    });
}

function populateToolbar(toolbar, context) {
    Logger.debug(`Populating AI Brush Toolbar for context: ${context}`);
    
    // ✨ AI Brush actions - always show these core features for text selection
    const aiBrushActions = [
        { action: 'Translate', label: 'Translate', icon: '🌐' },
        { action: 'Summarize', label: 'Summarize', icon: '📝' },
        { action: 'Grammar Fix', label: 'Fix Grammar', icon: '✅' },
        { action: 'Rephrase', label: 'Rephrase', icon: '🔄' },
        { action: 'Simplify', label: 'Simplify', icon: '💡' },
        { action: 'Expand', label: 'Expand', icon: '📖' }
    ];
    
    Logger.debug('AI Brush Actions for toolbar:', aiBrushActions);
    toolbar.innerHTML = aiBrushActions.map(action =>
        `<button class="writebuddy-brush-button" data-action="${action.action}">
            ${action.icon || ''}
            <span class="writebuddy-brush-button-text">${action.label}</span>
        </button>`
    ).join('');
    toolbar.querySelectorAll('.writebuddy-brush-button').forEach(button => {
        button.addEventListener('mousedown', handleToolbarButtonClick);
    });
    Logger.debug('AI Brush Toolbar populated with', aiBrushActions.length, 'actions.');
}

function showResultsPopup(content) {
    if (!resultsPopup) {
        resultsPopup = createResultsPopup();
    }
    const popupContent = resultsPopup.querySelector('#writebuddy-popup-content');
    popupContent.innerHTML = content;
    resultsPopup.style.display = 'flex';
}

function closeResultsPopup() {
    if (resultsPopup) {
        resultsPopup.style.display = 'none';
    }
}

// --- UI Visibility & Positioning ---

function showBubbleAndMenu(element) {
    activeElement = element;
    if (!bubbleIcon) {
        bubbleIcon = createBubbleIcon();
        shadowRoot.appendChild(bubbleIcon);
    }
    if (!menuContainer) {
        menuContainer = createMenuContainer();
        shadowRoot.appendChild(menuContainer);
    }
    if (!languageMenuContainer) {
        languageMenuContainer = createLanguageMenu();
    }
    const rect = element.getBoundingClientRect();
    const top = Math.max(10, rect.top + (rect.height / 2) - 28);
    const left = Math.max(10, rect.left - 62);
    bubbleIcon.style.position = 'fixed';
    bubbleIcon.style.top = `${top}px`;
    bubbleIcon.style.left = `${left}px`;
    bubbleIcon.style.zIndex = '2147483647';
    bubbleIcon.style.visibility = 'visible';
    bubbleIcon.style.display = 'block';
    bubbleIcon.style.opacity = '1';
    bubbleIcon.style.pointerEvents = 'auto';
    menuContainer.style.position = 'fixed';
    menuContainer.style.visibility = 'hidden';
    languageMenuContainer.style.position = 'fixed';
    languageMenuContainer.style.visibility = 'hidden';
    clearTimeout(hideBubbleTimeout);
}

function hideBubble() {
    if (bubbleIcon) {
        bubbleIcon.style.visibility = 'hidden';
        bubbleIcon.style.opacity = '0';
        bubbleIcon.style.pointerEvents = 'none';
    }
    if (menuContainer) {
        menuContainer.style.visibility = 'hidden';
    }
    if (languageMenuContainer) {
        languageMenuContainer.style.visibility = 'hidden';
    }
    activeElement = null;
}

function scheduleHideBubble() {
    clearTimeout(hideBubbleTimeout);
    hideBubbleTimeout = setTimeout(() => {
        if ((menuContainer && menuContainer.matches(':hover')) || (languageMenuContainer && languageMenuContainer.matches(':hover'))) {
            return;
        }
        hideBubble();
    }, 300);
}

function showAiBrushToolbar(selection) {
    if (!aiBrushToolbar) {
        aiBrushToolbar = createAiBrushToolbar();
        Logger.debug('AI Brush Toolbar created.');
    }
    
    // Create language menu if it doesn't exist
    if (!languageMenuContainer) {
        languageMenuContainer = createLanguageMenu();
        Logger.debug('Language menu created for AI Brush.');
    }
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const frameOffset = getCumulativeFrameOffset(window);
    const top = frameOffset.y + rect.bottom + 5;
    const left = frameOffset.x + rect.left + (rect.width / 2) - (aiBrushToolbar.offsetWidth / 2);
    aiBrushToolbar.style.top = `${top}px`;
    aiBrushToolbar.style.left = `${left}px`;
    aiBrushToolbar.style.visibility = 'visible';
    aiBrushToolbar.style.opacity = '1';
    Logger.debug(`AI Brush Toolbar shown at top: ${top}, left: ${left}. Visibility: ${aiBrushToolbar.style.visibility}, Opacity: ${aiBrushToolbar.style.opacity}`);
    const context = getContext(window.location.href);
    populateToolbar(aiBrushToolbar, context);

    if (selection.rangeCount > 0) { // Ensure there's a range to save
        savedRange = selection.getRangeAt(0).cloneRange(); // Save a clone of the range
        Logger.debug('AI Brush: Saved selection range.', savedRange);
    } else {
        savedRange = null;
        Logger.warn('AI Brush: No valid range to save when showing toolbar.');
    }
}

function hideAiBrushToolbar(preserveRange = false) {
    if (aiBrushToolbar) {
        aiBrushToolbar.style.visibility = 'hidden';
        aiBrushToolbar.style.opacity = '0';
        Logger.debug('AI Brush Toolbar hidden.');
        if (!preserveRange) {
            savedRange = null;
        }
    }
}

// --- Event Handlers ---

function handleBubbleClick(event) {
    if (isDragging) {
        isDragging = false;
        return;
    }
    event.stopPropagation();
    // Always reset icon to sparkle/hourglass centered element
    bubbleIcon.innerHTML = isAiBrushActive ? magicalPencilIcon : sparkleIcon;
    if (menuContainer) {
        const isDisplayed = menuContainer.style.visibility === 'visible';
        if (!isDisplayed) {
            populateMenu(menuContainer);
            // If filtering removed all items, provide minimal fallback
            if (!menuContainer.querySelector('.writebuddy-menu-item')) {
                const fallback = document.createElement('div');
                fallback.className = 'writebuddy-menu-item';
                fallback.dataset.action = 'CommentReplies';
                fallback.innerHTML = `<span class="writebuddy-menu-item-text">💬 Comment Replies</span>`;
                fallback.addEventListener('click', handleMenuItemClick);
                menuContainer.appendChild(fallback);
            }

            const bubbleRect = bubbleIcon.getBoundingClientRect();
            menuContainer.style.top = bubbleRect.top + 'px';
            menuContainer.style.left = (bubbleRect.left + bubbleRect.width + 5) + 'px';
        }
        menuContainer.style.visibility = isDisplayed ? 'hidden' : 'visible';
        if (languageMenuContainer) {
            languageMenuContainer.style.visibility = 'hidden';
        }
    }
}

async function handleMenuItemClick(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const action = button.dataset.action;

    if (action === 'SmartReply') {
        const emailContent = getGmailEmailContent(activeElement);
        if (!emailContent) {
            alert("Could not read the email content to generate a reply.");
            return;
        }
        bubbleIcon.innerHTML = loadingIcon;
        menuContainer.style.visibility = 'hidden';
        chrome.runtime.sendMessage({ type: 'GET_REPLY_INTENTIONS', text: emailContent }, (response) => {
            bubbleIcon.innerHTML = sparkleIcon;
            if (response.error) {
                alert(`Could not get AI suggestions: ${response.error}`);
                return;
            }
            populateMenu(menuContainer, response.data);
            menuContainer.style.visibility = 'visible';
        });
        return;
    }

    if (action === 'GenerateSmartReply') {
        const intention = button.dataset.intention;
        const emailContent = getGmailEmailContent(activeElement);
        if (!emailContent || !activeElement) return;

        menuContainer.style.visibility = 'hidden';
        bubbleIcon.innerHTML = loadingIcon;
        activeElement.innerHTML = '';
        activeElement.focus();

        chrome.runtime.sendMessage({
            type: 'START_AI_STREAM',
            action: 'Generate Smart Reply',
            text: emailContent,
            intention: intention
        });
        return;
    }

    if (action === 'toggle-ai-brush') {
        isAiBrushActive = !isAiBrushActive;
        Logger.debug(`AI Brush toggled: ${isAiBrushActive}`);
        if (bubbleIcon) bubbleIcon.innerHTML = isAiBrushActive ? magicalPencilIcon : sparkleIcon;
        if (!isAiBrushActive) hideAiBrushToolbar();
        menuContainer.style.visibility = 'hidden';
        return;
    }

    if (action === 'Translate') {
        if (menuContainer && languageMenuContainer) {
            const menuRect = menuContainer.getBoundingClientRect();
            languageMenuContainer.style.top = menuRect.top + 'px';
            languageMenuContainer.style.left = (menuRect.right + 5) + 'px';
            populateLanguageMenu();
            languageMenuContainer.style.visibility = 'visible';
            languageMenuContainer.querySelector('#writebuddy-language-search').focus();
        }
        return;
    }



    // YouTube Studio: stream a single smart reply directly into the reply box
    if (action === 'CommentReplies' && getContext(window.location.href) === 'youtube') {
        const ctx = getYouTubeReplyContext(activeElement) || (window.getSelection()?.toString().trim()) || '';
        if (!ctx) return;
        menuContainer.style.visibility = 'hidden';
        bubbleIcon.innerHTML = loadingIcon;
        if (activeElement && activeElement.focus) activeElement.focus();
        chrome.runtime.sendMessage({ type: 'START_AI_STREAM', action: 'CommentReplies', text: ctx });
        return;
    }

    if (!activeElement) return;
    // Get full text properly - especially for Gmail compose
    let text;
    let targetElement = activeElement;
    
    if (activeElement.isContentEditable) {
        // Gmail mein nested divs hote hain, find the root compose box
        if (window.location.hostname.includes('mail.google.com')) {
            let parent = activeElement;
            while (parent && parent.parentElement) {
                if (parent.getAttribute('role') === 'textbox' || 
                    parent.classList.contains('Am') || 
                    (parent.contentEditable === 'true' && parent.parentElement?.contentEditable !== 'true')) {
                    targetElement = parent;
                    break;
                }
                parent = parent.parentElement;
            }
        }
        text = targetElement.textContent || targetElement.innerText;
    } else {
        text = activeElement.value;
    }
    // If editor empty, try selected comment text (for Studio community replies)
    if ((!text || !text.trim())) {
        const sel = window.getSelection();
        const selText = sel ? sel.toString().trim() : '';
        if (selText) text = selText;
    }
    if (!text || !text.trim()) return;

    menuContainer.style.visibility = 'hidden';
    bubbleIcon.innerHTML = loadingIcon;

    try {
        const response = await chrome.runtime.sendMessage({ type: action, text: text });
        if (response.error) throw new Error(response.error);
        if (response.data) {
            if (['Generate Titles','Generate Hashtags','Generate Tags','GenerateChapters','CommentReplies','PolicyCheck','ExtractActionItems','ThumbnailText'].includes(action)) {
                handleListResponse(response.data);
            } else {
                // Get original text properly - use textContent for Gmail
                let originalText;
                if (activeElement?.isContentEditable) {
                    originalText = activeElement.textContent || activeElement.innerText;
                } else {
                    originalText = activeElement?.value;
                }
                const out = stripDuplicatePrefix(originalText||'', response.data);
                if (action === 'proofread' || action === 'Grammar Fix') {
                    if (activeElement.isContentEditable) {
                        // Gmail compose box specific handling
                        if (window.location.hostname.includes('mail.google.com')) {
                            // Find the root compose box element
                            let targetElement = activeElement;
                            let parent = activeElement;
                            while (parent && parent.parentElement) {
                                if (parent.getAttribute('role') === 'textbox' || 
                                    parent.classList.contains('Am') || 
                                    (parent.contentEditable === 'true' && parent.parentElement?.contentEditable !== 'true')) {
                                    targetElement = parent;
                                    break;
                                }
                                parent = parent.parentElement;
                            }
                            
                            // Clear ROOT element and insert corrected text
                            targetElement.innerHTML = '';
                            const lines = out.split('\n');
                            lines.forEach((line, index) => {
                                if (index > 0) targetElement.appendChild(document.createElement('br'));
                                targetElement.appendChild(document.createTextNode(line));
                            });
                            notifyInput(targetElement);
                        } else {
                            activeElement.innerText = out;
                            notifyInput(activeElement);
                        }
                    } else {
                        activeElement.value = out;
                        notifyInput(activeElement);
                    }
                } else {
                    const ok = insertTextSmart(out);
                    if (!ok && activeElement) {
                        if (activeElement.isContentEditable) {
                            // Gmail compose box specific handling
                            if (window.location.hostname.includes('mail.google.com')) {
                                // Find the root compose box element
                                let targetElement = activeElement;
                                let parent = activeElement;
                                while (parent && parent.parentElement) {
                                    if (parent.getAttribute('role') === 'textbox' || 
                                        parent.classList.contains('Am') || 
                                        (parent.contentEditable === 'true' && parent.parentElement?.contentEditable !== 'true')) {
                                        targetElement = parent;
                                        break;
                                    }
                                    parent = parent.parentElement;
                                }
                                
                                // Clear ROOT element and insert text
                                targetElement.innerHTML = '';
                                const lines = out.split('\n');
                                lines.forEach((line, index) => {
                                    if (index > 0) targetElement.appendChild(document.createElement('br'));
                                    targetElement.appendChild(document.createTextNode(line));
                                });
                                notifyInput(targetElement);
                            } else {
                                activeElement.innerText = out;
                                notifyInput(activeElement);
                            }
                        } else {
                            activeElement.value = out;
                            notifyInput(activeElement);
                        }
                    }
                }
            }
        }
    } catch (error) {
        Logger.error("Error during AI processing:", error);
        bubbleIcon.innerHTML = errorIcon;
    } finally {
        setTimeout(() => { bubbleIcon.innerHTML = isAiBrushActive ? magicalPencilIcon : sparkleIcon; }, 2000);
    }
}

async function triggerTranslation(targetLanguage, text) {
    const isReadOnly = !activeElement; // ✨ Check if text is from non-editable source
    
    if (!text || !text.trim()) {
        const selection = window.getSelection();
        text = selection.toString().trim();
        if (!text) {
            if (activeElement) {
                // Gmail compose box specific - get full text properly
                let targetElement = activeElement;
                
                if (activeElement.isContentEditable) {
                    // Gmail mein nested divs hote hain, find the root compose box
                    if (window.location.hostname.includes('mail.google.com')) {
                        let parent = activeElement;
                        while (parent && parent.parentElement) {
                            if (parent.getAttribute('role') === 'textbox' || 
                                parent.classList.contains('Am') || 
                                (parent.contentEditable === 'true' && parent.parentElement?.contentEditable !== 'true')) {
                                targetElement = parent;
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    }
                    // Try textContent first (preserves all text including hidden)
                    text = targetElement.textContent || targetElement.innerText;
                } else {
                    text = activeElement.value;
                }
            }
            if (!text || !text.trim()) return;
        }
    }
    
    Logger.debug(`Translation request - Text length: ${text.length}, First 100 chars: ${text.substring(0, 100)}`);
    
    if (menuContainer) menuContainer.style.visibility = 'hidden';
    if (languageMenuContainer) languageMenuContainer.style.visibility = 'hidden';
    if (aiBrushToolbar) hideAiBrushToolbar(true);
    if (bubbleIcon) bubbleIcon.innerHTML = loadingIcon;
    
    try {
        const response = await chrome.runtime.sendMessage({ type: 'Translate', text: text, targetLanguage: targetLanguage });
        if (response.error) throw new Error(response.error);
        
        Logger.debug(`Translation response - Length: ${response.data?.length}, First 100 chars: ${response.data?.substring(0, 100)}`);
        
        if (response.data) {
            // ✨ Check if we have an editable field OR read-only text selection
            const hasEditableField = activeElement && (activeElement.isContentEditable || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT');
            const selection = window.getSelection();
            const hasTextSelection = selection && !selection.isCollapsed && selection.toString().trim();
            
            Logger.debug(`Translation context - isReadOnly: ${isReadOnly}, hasEditableField: ${hasEditableField}, hasTextSelection: ${hasTextSelection}`);
            
            // Show popup with "Insert Translation" button for editable fields OR "Copy" for read-only
            if (isReadOnly || (hasEditableField && hasTextSelection)) {
                const showInsertButton = hasEditableField && hasTextSelection && !isReadOnly;
                Logger.debug(`Showing popup - Insert button: ${showInsertButton}`);
                
                const popupHTML = `
                    <div class="writebuddy-translation-result">
                        <div class="writebuddy-result-label">
                            <strong>Translation (${targetLanguage}):</strong>
                        </div>
                        <div class="writebuddy-result-content">
                            ${response.data.replace(/\n/g, '<br>')}
                        </div>
                        <div style="display: flex; gap: 8px; margin-top: 10px;">
                            ${showInsertButton ? 
                                '<button id="writebuddy-insert-result-btn" class="writebuddy-insert-btn">✨ Insert Translation</button>' : 
                                ''}
                            <button id="writebuddy-copy-result-btn" class="writebuddy-copy-btn">📋 Copy</button>
                        </div>
                    </div>
                `;
                showResultsPopup(popupHTML);
                
                // Add button functionality
                setTimeout(() => {
                    // Insert button (for editable fields)
                    const insertBtn = shadowRoot.querySelector('#writebuddy-insert-result-btn');
                    if (insertBtn) {
                        Logger.debug('Insert button found, attaching event listener');
                        insertBtn.addEventListener('click', () => {
                            insertTranslationIntoField(response.data);
                            closeResultsPopup();
                        });
                    } else {
                        Logger.debug('Insert button NOT found in DOM');
                    }
                    
                    // Copy button (always available)
                    const copyBtn = shadowRoot.querySelector('#writebuddy-copy-result-btn');
                    if (copyBtn) {
                        copyBtn.addEventListener('click', () => {
                            navigator.clipboard.writeText(response.data).then(() => {
                                copyBtn.textContent = '✅ Copied!';
                                setTimeout(() => copyBtn.textContent = '📋 Copy', 2000);
                            });
                        });
                    }
                }, 100);
                return;
            }
            
            // Otherwise, replace text in editable field
            if (savedRange) {
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(savedRange);
                savedRange.deleteContents();
                savedRange.insertNode(document.createTextNode(response.data));
                savedRange = null;
            } else {
                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(response.data));
                } else if (activeElement) {
                    if (activeElement.isContentEditable) {
                        // Gmail compose box specific handling
                        if (window.location.hostname.includes('mail.google.com')) {
                            // Find the root compose box element
                            let targetElement = activeElement;
                            let parent = activeElement;
                            while (parent && parent.parentElement) {
                                if (parent.getAttribute('role') === 'textbox' || 
                                    parent.classList.contains('Am') || 
                                    (parent.contentEditable === 'true' && parent.parentElement?.contentEditable !== 'true')) {
                                    targetElement = parent;
                                    break;
                                }
                                parent = parent.parentElement;
                            }
                            
                            // Clear all content of ROOT element
                            targetElement.innerHTML = '';
                            // Insert new content as HTML to preserve line breaks
                            const lines = response.data.split('\n');
                            lines.forEach((line, index) => {
                                if (index > 0) targetElement.appendChild(document.createElement('br'));
                                targetElement.appendChild(document.createTextNode(line));
                            });
                            // Trigger input event on root element
                            notifyInput(targetElement);
                        } else {
                            activeElement.innerText = response.data;
                            notifyInput(activeElement);
                        }
                    } else {
                        activeElement.value = response.data;
                        notifyInput(activeElement);
                    }
                }
            }
        }
    } catch (error) {
        Logger.error("Error during AI translation:", error);
        if (bubbleIcon) bubbleIcon.innerHTML = errorIcon;
    } finally {
        if (bubbleIcon) {
            setTimeout(() => { bubbleIcon.innerHTML = isAiBrushActive ? magicalPencilIcon : sparkleIcon; }, 2000);
        }
    }
}

// ✨ Insert translation into editable field (replaces selected text)
function insertTranslationIntoField(translatedText) {
    Logger.debug(`insertTranslationIntoField called - translatedText length: ${translatedText?.length}`);
    Logger.debug(`savedRange exists: ${!!savedRange}`);
    insertTextSmart(translatedText);
}

function handleListResponse(data) {
    let items = data.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    if (items.length === 1 && items[0].includes('#')) {
        const hashtagItems = items[0].split(' ').filter(h => h.startsWith('#'));
        if (hashtagItems.length > 1) items = hashtagItems;
    }
    let contentHTML = '';
    if (items.length > 0) {
        contentHTML += items.map(item => {

// Ensure bubble appears on focus as well (helps on X.com composer)
document.addEventListener('focusin', (event) => {
    if (event.target && event.target.id === 'writebuddy-language-search') return;
    const editableElement = getClosestEditable(event.target);
    if (editableElement) {
        Logger.debug('Focusin: Editable element found.', editableElement);
        showBubbleAndMenu(editableElement);
    }
});

// Ensure bubble appears on click/focus from cold start without popup
window.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('focusin', (e) => {
        const el = getClosestEditable(e.target);
        if (el) showBubbleAndMenu(el);
    }, { capture: true });
    document.addEventListener('click', (e) => {
        const el = getClosestEditable(e.target);
        if (el) showBubbleAndMenu(el);
    }, { capture: true });
});

            const cleanedItem = item.replace(/^\d+\.\s*/, '').trim();
            const escapedItem = cleanedItem.replace(/"/g, '&quot;');
            return `
                <div class="writebuddy-result-item">
                    <p>${cleanedItem}</p>
                    <button class="writebuddy-copy-btn" data-text="${escapedItem}">Copy</button>
                </div>
            `;
        }).join('');
    } else {
        contentHTML += `<p>No suggestions were generated. Try rephrasing your input.</p>`;
    }
    showResultsPopup(contentHTML);
    if (resultsPopup) {
        resultsPopup.querySelectorAll('.writebuddy-copy-btn').forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', (e) => {
                const textToCopy = e.currentTarget.dataset.text;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalText = newButton.textContent;
                    newButton.textContent = 'Copied!';
                    newButton.disabled = true;
                    setTimeout(() => {
                        newButton.textContent = originalText;
                        newButton.disabled = false;
                    }, 2000);
                }).catch(err => {
                    Logger.error('Failed to copy: ', err);
                });
            });
        });
    }
}

async function handleToolbarButtonClick(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const action = button.dataset.action;
    const isReadOnly = !activeElement; // ✨ Check if text is from non-editable source
    
    if (action === 'Translate') {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            savedRange = selection.getRangeAt(0).cloneRange();
        } else {
            savedRange = null;
        }
        if (languageMenuContainer) {
            const buttonRect = event.currentTarget.getBoundingClientRect();
            const frameOffset = getCumulativeFrameOffset(window);
            const top = frameOffset.y + buttonRect.bottom + 5;
            const left = frameOffset.x + buttonRect.left;
            
            // Set position styles
            languageMenuContainer.style.position = 'fixed';
            languageMenuContainer.style.top = `${top}px`;
            languageMenuContainer.style.left = `${left}px`;
            languageMenuContainer.style.zIndex = '2147483647';
            
            populateLanguageMenu();
            languageMenuContainer.style.visibility = 'visible';
            
            // Focus search input after a small delay to ensure menu is rendered
            setTimeout(() => {
                const searchInput = languageMenuContainer.querySelector('#writebuddy-language-search');
                if (searchInput) searchInput.focus();
            }, 50);
        }
        return;
    }

    // Use the globally savedRange
    const rangeToUse = savedRange;

    if (!rangeToUse || rangeToUse.collapsed || rangeToUse.toString().trim().length === 0) {
        Logger.warn("No valid saved range or saved range is empty when AI Brush button clicked.");
        return;
    }

    const selectedText = rangeToUse.toString().trim(); // Get text from saved range
    
    // Hide toolbar while processing
    if (aiBrushToolbar) hideAiBrushToolbar();

    try {
        const response = await chrome.runtime.sendMessage({ type: action, text: selectedText });
        if (response.error) throw new Error(response.error);
        if (response.data) {
            if (['Generate Titles','Generate Hashtags','Generate Tags','GenerateChapters','CommentReplies','PolicyCheck','ExtractActionItems','ThumbnailText'].includes(action)) {
                handleListResponse(response.data);
            } else {
                // ✨ If text is from non-editable source (article, webpage), show in popup
                if (isReadOnly) {
                    const actionLabel = button.querySelector('.writebuddy-brush-button-text')?.textContent || action;
                    const popupHTML = `
                        <div class="writebuddy-ai-result">
                            <div class="writebuddy-result-label">
                                <strong>${actionLabel} Result:</strong>
                            </div>
                            <div class="writebuddy-result-original">
                                <em>Original:</em><br>
                                ${selectedText.substring(0, 200)}${selectedText.length > 200 ? '...' : ''}
                            </div>
                            <div class="writebuddy-result-content">
                                ${response.data.replace(/\n/g, '<br>')}
                            </div>
                            <button id="writebuddy-copy-result-btn" class="writebuddy-copy-btn">📋 Copy Result</button>
                        </div>
                    `;
                    showResultsPopup(popupHTML);
                    
                    // Add copy functionality
                    setTimeout(() => {
                        const copyBtn = shadowRoot.querySelector('#writebuddy-copy-result-btn');
                        if (copyBtn) {
                            copyBtn.addEventListener('click', () => {
                                navigator.clipboard.writeText(response.data).then(() => {
                                    copyBtn.textContent = '✅ Copied!';
                                    setTimeout(() => copyBtn.textContent = '📋 Copy Result', 2000);
                                });
                            });
                        }
                    }, 100);
                } else {
                    // Replace content using the saved range for editable text
                    rangeToUse.deleteContents();
                    rangeToUse.insertNode(document.createTextNode(response.data));
                }
            }
        }
    } catch (error) {
        Logger.error("Error during AI Brush processing:", error);
    } finally {
        savedRange = null; // Clear the saved range after use
    }
}

// --- Event Listeners ---

document.addEventListener('mousedown', (event) => {
    if (event.target.id === 'writebuddy-language-search') return;
    const editableElement = getClosestEditable(event.target);
    if (editableElement) {
        Logger.debug('Mousedown: Editable element found.', editableElement);
        showBubbleAndMenu(editableElement);
    } else {
        Logger.debug('Mousedown: No editable element found.');
        if (bubbleIcon && !bubbleIcon.contains(event.target) && menuContainer && !menuContainer.contains(event.target) && languageMenuContainer && !languageMenuContainer.contains(event.target)) {
            scheduleHideBubble();
        }
    }
    if (aiBrushToolbar && !aiBrushToolbar.contains(event.target) && languageMenuContainer && !languageMenuContainer.contains(event.target)) {
        hideAiBrushToolbar();
    }
    const inResultsPopup = resultsPopup && (typeof event.composedPath === 'function') && event.composedPath().includes(resultsPopup);
    if (resultsPopup && !inResultsPopup) {
        resultsPopup.style.display = 'none';
    }
});

document.addEventListener('input', (event) => {
    if (event.target.id === 'writebuddy-language-search') return;
    const editableElement = getClosestEditable(event.target);
    if (editableElement) {
        Logger.debug('Input: Editable element found.', editableElement);
        showBubbleAndMenu(editableElement);
    } else {
        Logger.debug('Input: No editable element found.');
    }
});

window.addEventListener('resize', () => {
    if (activeElement) {
        showBubbleAndMenu(activeElement);
    }
});

document.addEventListener('selectionchange', () => {
    if (isAiBrushActive) {
        const selection = window.getSelection();
        Logger.debug('Selection changed event fired.');
        Logger.debug('Selection object:', selection);
        Logger.debug('selection.isCollapsed:', selection.isCollapsed);
        Logger.debug('selection.toString():', selection.toString());

        if (selection && !selection.isCollapsed && selection.toString().trim().length > 0) {
            const editableElement = getClosestEditable(selection.anchorNode.parentElement);
            Logger.debug('Selected text is not collapsed and has content.');
            Logger.debug('Editable element found by getClosestEditable:', editableElement);
            
            // ✨ UPDATED: Show AI Brush for both editable AND non-editable text
            if (editableElement) {
                Logger.debug('Selection changed, editable element found. Showing AI brush toolbar.', editableElement);
                activeElement = editableElement;
            } else {
                Logger.debug('Selection changed, non-editable text selected. Showing AI brush toolbar for read-only content.');
                activeElement = null; // No active element for non-editable text
            }
            showAiBrushToolbar(selection);
        } else {
            Logger.debug('Selection changed, no text selected or selection collapsed. Hiding AI brush toolbar.');
            if (languageMenuContainer && languageMenuContainer.style.visibility === 'visible') {
                return;
            }
            hideAiBrushToolbar();
        }
    }
});

// --- Dragging Logic ---

function onBubbleMouseDown(e) {
    e.preventDefault();
    e.stopPropagation();
    isDragging = false;
    const bubble = e.currentTarget;
    const initialMouseX = e.clientX;
    const initialMouseY = e.clientY;

    function onBubbleMouseMove(e) {
        isDragging = true;
        const offsetX = e.clientX - initialMouseX;
        const offsetY = e.clientY - initialMouseY;
        bubble.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    function onBubbleMouseUp(e) {
        window.removeEventListener('mousemove', onBubbleMouseMove);
        window.removeEventListener('mouseup', onBubbleMouseUp);
        if (isDragging) {
            const finalOffsetX = e.clientX - initialMouseX;
            const finalOffsetY = e.clientY - initialMouseY;
            const currentLeft = parseInt(bubble.style.left, 10) || 0;
            const currentTop = parseInt(bubble.style.top, 10) || 0;
            bubble.style.left = (currentLeft + finalOffsetX) + 'px';
            bubble.style.top = (currentTop + finalOffsetY) + 'px';
        }
        bubble.style.transform = 'none';
    }

    window.addEventListener('mousemove', onBubbleMouseMove);
    window.addEventListener('mouseup', onBubbleMouseUp);
}

// --- Global Message Listener for Streaming ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AI_CHUNK') {
        // Get current text properly
        let base;
        if (activeElement?.isContentEditable) {
            base = activeElement.textContent || activeElement.innerText || '';
        } else {
            base = activeElement?.value || '';
        }
        const cleaned = stripDuplicatePrefix(base, message.data);
        const ok = insertTextSmart(cleaned);
        if (!ok && activeElement && document.body.contains(activeElement)) {
            if (activeElement.isContentEditable) {
                // Gmail compose box specific handling
                if (window.location.hostname.includes('mail.google.com')) {
                    // Append text properly with line breaks
                    const lines = message.data.split('\n');
                    lines.forEach((line, index) => {
                        if (index > 0 || base.length > 0) activeElement.appendChild(document.createElement('br'));
                        activeElement.appendChild(document.createTextNode(line));
                    });
                } else {
                    activeElement.innerText += message.data;
                }
                notifyInput(activeElement);
            } else if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
                activeElement.value += message.data;
                notifyInput(activeElement);
            }
        }
    } else if (message.type === 'AI_STREAM_END') {
        if(bubbleIcon) bubbleIcon.innerHTML = sparkleIcon;
        activeElement = null;
    } else if (message.type === 'AI_ERROR') {
        if(bubbleIcon) bubbleIcon.innerHTML = errorIcon;
        activeElement = null;
    }
});