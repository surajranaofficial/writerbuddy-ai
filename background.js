/* global LanguageModel, Summarizer, Translator, LanguageDetector */

importScripts('debug.js');
importScripts('cache-manager.js');
importScripts('auth.js');

// background.js (Final Hybrid Version with Hinglish & Garhwali Support)
// Chrome 138+ has stable Translation API - https://github.com/WICG/translation-api

// Fallback API key (users should add their own in settings)
const FALLBACK_API_KEY = 'AIzaSyAP3hrGQ4n4vmgBDoaxHHGy6ugaevec0kQ';

// Get API key from storage (encrypted) or use fallback
async function getAPIKey() {
  try {
    const apiData = await authManager.getApiKey();
    if (apiData && apiData.key) {
      Logger.debug('Using encrypted API key from storage');
      return apiData.key;
    }
    Logger.warn('No API key found, using fallback');
    return FALLBACK_API_KEY;
  } catch (error) {
    Logger.error('Failed to get API key:', error);
    return FALLBACK_API_KEY;
  }
}

// --- Non-Streaming Functions (for Bubble & Context Menus) ---

// Language name to BCP 47 code mapping for Chrome Translation API
const LANGUAGE_CODE_MAP = {
  'English': 'en', 'Spanish': 'es', 'French': 'fr', 'German': 'de',
  'Italian': 'it', 'Portuguese': 'pt', 'Russian': 'ru', 'Japanese': 'ja',
  'Korean': 'ko', 'Chinese (Simplified)': 'zh', 'Chinese (Traditional)': 'zh-TW',
  'Arabic': 'ar', 'Hindi': 'hi', 'Bengali': 'bn', 'Turkish': 'tr',
  'Dutch': 'nl', 'Polish': 'pl', 'Swedish': 'sv', 'Norwegian': 'no',
  'Danish': 'da', 'Finnish': 'fi', 'Greek': 'el', 'Czech': 'cs',
  'Hungarian': 'hu', 'Romanian': 'ro', 'Thai': 'th', 'Vietnamese': 'vi',
  'Indonesian': 'id', 'Malay': 'ms', 'Hebrew': 'he', 'Ukrainian': 'uk',
  'Catalan': 'ca', 'Croatian': 'hr', 'Slovak': 'sk', 'Bulgarian': 'bg',
  'Lithuanian': 'lt', 'Slovenian': 'sl', 'Latvian': 'lv', 'Estonian': 'et',
  'Persian': 'fa', 'Urdu': 'ur', 'Tagalog (Filipino)': 'tl', 'Swahili': 'sw',
  'Tamil': 'ta', 'Telugu': 'te', 'Kannada': 'kn', 'Marathi': 'mr',
  'Gujarati': 'gu', 'Punjabi': 'pa', 'Malayalam': 'ml', 'Nepali': 'ne',
  'Sinhala (Sinhalese)': 'si', 'Khmer': 'km', 'Lao': 'lo', 'Myanmar (Burmese)': 'my',
  'Georgian': 'ka', 'Armenian': 'hy', 'Azerbaijani': 'az', 'Kazakh': 'kk',
  'Uzbek': 'uz', 'Mongolian': 'mn', 'Afrikaans': 'af', 'Albanian': 'sq',
  'Amharic': 'am', 'Basque': 'eu', 'Belarusian': 'be', 'Bosnian': 'bs',
  'Cebuano': 'ceb', 'Corsican': 'co', 'Esperanto': 'eo', 'Frisian': 'fy',
  'Galician': 'gl', 'Haitian Creole': 'ht', 'Hausa': 'ha', 'Hawaiian': 'haw',
  'Hmong': 'hmn', 'Icelandic': 'is', 'Igbo': 'ig', 'Irish': 'ga',
  'Javanese': 'jv', 'Kurdish': 'ku', 'Kyrgyz': 'ky', 'Latin': 'la',
  'Luxembourgish': 'lb', 'Macedonian': 'mk', 'Malagasy': 'mg', 'Maltese': 'mt',
  'Maori': 'mi', 'Nyanja (Chichewa)': 'ny', 'Odia (Oriya)': 'or', 'Pashto': 'ps',
  'Samoan': 'sm', 'Scots Gaelic': 'gd', 'Serbian': 'sr', 'Sesotho': 'st',
  'Shona': 'sn', 'Sindhi': 'sd', 'Somali': 'so', 'Sundanese': 'su',
  'Tajik': 'tg', 'Tatar': 'tt', 'Turkmen': 'tk', 'Uyghur': 'ug',
  'Welsh': 'cy', 'Xhosa': 'xh', 'Yiddish': 'yi', 'Yoruba': 'yo', 'Zulu': 'zu'
};

// Top-level language detection helper
async function detectLanguage(text) {
  try {
    if (typeof LanguageDetector === 'undefined') return '';
    const availability = await LanguageDetector.availability();
    if (availability !== 'available') return '';
    const detector = await LanguageDetector.create();
    const res = await detector.detect(text.slice(0, 2000));
    detector.destroy();
    return res && res[0] && res[0].language ? res[0].language : '';
  } catch { return ''; }
}

async function processOnDeviceAI(action, text, targetLanguage) {
  Logger.debug(`Attempting on-device AI for action '${action}'...`);
  switch (action) {
    case 'proofread': case 'Grammar Fix': case 'rephrase': case 'Rephrase': case 'Formal': case 'Casual': case 'Confident': case 'ContinueWriting': {
      if (typeof LanguageModel === 'undefined') throw new Error("LanguageModel API not available.");
      const availability = await LanguageModel.availability();
      if (availability !== 'available') throw new Error(`LanguageModel not ready: ${availability}`);
      let promptText;
      if (action === 'proofread' || action === 'Grammar Fix') promptText = `You are a professional grammar correction tool. Your task is to fix ALL grammatical errors, spelling mistakes, and punctuation issues in the text below.

Rules:
- Fix subject-verb agreement (e.g., "he go" → "he goes", "who love" → "who loves")
- Correct verb tenses consistently throughout the text
- Add missing articles (a, an, the) where needed
- Fix wrong verb forms (e.g., "he not speak" → "he does not speak")
- Correct word forms (e.g., "speak good" → "speak well")
- Fix all punctuation and spacing issues
- Ensure proper sentence structure
- Maintain the original meaning and writing style
- Do NOT add extra explanations or commentary
- Return ONLY the fully corrected text

Text to fix: "${text}"

Corrected version:`;
      else if (action === 'rephrase' || action === 'Rephrase') promptText = `You are a text rephrasing tool. Your sole task is to rephrase the following text to be more clear, professional, and engaging. Do not use markdown (like **). Do not add any explanations or introductory phrases. Output only the rephrased text. Original text: "${text}"`;
      else if (action === 'ContinueWriting') promptText = `Continue right after the given text without repeating it. Return ONLY the new continuation as plain text (no markdown, no **, no headings). Text: "${text}"`;
      else promptText = `Rewrite the following text in a more ${action.toLowerCase()} tone. Only return the rewritten text. Text: "${text}"`;
      const session = await LanguageModel.create();
      const result = await session.prompt(promptText);
      session.destroy();
      return result;
    }
    case 'summarize': case 'Summarize': {
      if (typeof Summarizer === 'undefined') throw new Error("Summarizer API not available.");
      const summarizer = await Summarizer.create();
      const result = await summarizer.summarize(text);
      if (typeof result !== 'string' || !result) throw new Error("On-device summarization failed to produce an output.");
      return result;
    }
    case 'translate': case 'Translate': {
      // Special languages not supported by Chrome Translation API - will use cloud fallback
      if (targetLanguage === 'en-HI' || targetLanguage === 'gbm') {
        throw new Error("Hinglish/Garhwali not supported on-device. Using cloud fallback...");
      }
      
      // IMPORTANT: Convert language name to BCP 47 code (e.g., "Hindi" → "hi", "Spanish" → "es")
      // Chrome Translation API requires ISO 639-1 language codes, not full language names
      const targetLangCode = LANGUAGE_CODE_MAP[targetLanguage] || targetLanguage.toLowerCase();
      
      // Check Chrome Built-in Translation API availability
      if (typeof LanguageDetector === 'undefined' || typeof Translator === 'undefined') {
        throw new Error("Chrome Translation API not available. Please update to Chrome 138+");
      }
      
      // Detect source language using Chrome's LanguageDetector API
      const detectorAvailability = await LanguageDetector.availability();
      if (detectorAvailability !== 'available') {
        throw new Error(`LanguageDetector not ready: ${detectorAvailability}`);
      }
      
      const detector = await LanguageDetector.create();
      const detectionResult = await detector.detect(text);
      detector.destroy();
      
      Logger.debug(`Language detection result:`, detectionResult);
      
      // FIX: Check both 'detectedLanguage' and 'language' fields (API inconsistency)
      const sourceLanguage = detectionResult[0]?.detectedLanguage || detectionResult[0]?.language;
      if (!sourceLanguage) {
        Logger.warn(`Detection failed. Result: ${JSON.stringify(detectionResult)}`);
        throw new Error("Could not detect source language");
      }
      
      Logger.debug(`Translation: ${sourceLanguage} -> ${targetLangCode} (from "${targetLanguage}")`);
      
      // Check if translation pair is available
      const translatorAvailability = await Translator.availability({ sourceLanguage, targetLanguage: targetLangCode });
      Logger.debug(`Translator availability for ${sourceLanguage}->${targetLangCode}: ${translatorAvailability}`);
      
      // FIX: Handle ALL availability statuses returned by Chrome Translation API:
      // - 'readily': Model is immediately ready to use (already downloaded)
      // - 'after-download': Model is downloading, will be available after download completes
      // - 'downloadable': Model can be downloaded (first-time download)
      // - 'available': Model was downloaded previously and is ready (common after first use)
      // - 'unavailable'/'no': Language pair not supported by Chrome Translation API
      if (translatorAvailability === 'readily' || 
          translatorAvailability === 'after-download' || 
          translatorAvailability === 'downloadable' ||
          translatorAvailability === 'available') {
        // Translation model is available - create and use translator
        Logger.debug(`Creating translator for ${sourceLanguage}->${targetLangCode}...`);
        const translator = await Translator.create({ sourceLanguage, targetLanguage: targetLangCode });
        const result = await translator.translate(text);
        translator.destroy();
        Logger.debug(`Translation completed successfully!`);
        return result;
      } else {
        // Language pair not supported - use cloud fallback (Gemini API)
        Logger.warn(`Translation pair ${sourceLanguage}->${targetLangCode} not supported. Status: ${translatorAvailability}`);
        throw new Error(`Translation pair ${sourceLanguage}->${targetLangCode} not available on-device (status: ${translatorAvailability}). Using cloud API.`);
      }
    }
    default: throw new Error(`Unknown AI action: ${action}`);
  }
}

async function processCloudAI(action, text, targetLanguage) {
  Logger.debug(`Falling back to Cloud API for action '${action}'...`);
  
  // Check cache first (include targetLanguage for translations)
  const cached = globalCache.get(action, text, targetLanguage);
  if (cached) {
    Logger.debug('✅ Returning cached result!');
    return cached;
  }
  
  const API_KEY = await getAPIKey();
  
  // Validate API key
  if (!API_KEY || API_KEY === 'undefined' || API_KEY === '') {
    throw new Error('API key is not configured. Please add your Gemini API key in the extension settings.');
  }
  
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  let prompt;
  if (action === 'proofread' || action === 'Grammar Fix') prompt = `You are a professional grammar correction expert. Fix ALL errors in the text below:

RULES:
- Fix subject-verb agreement (e.g., "he go" → "he goes", "who love" → "who loves")
- Correct all verb tenses consistently throughout the text
- Add missing articles (a, an, the) where needed
- Fix sentence structure and punctuation
- Correct word choice (e.g., "speak good" → "speak well")
- Fix wrong verb forms (e.g., "he not speak" → "he does not speak")
- Maintain original meaning and writing style
- Return ONLY the corrected text, no explanations or commentary

Text to fix:
"""
${text}
"""

Corrected version:`;
  else if (action === 'Generate Titles') prompt = `Generate 10 engaging, CTR-optimized YouTube video titles based on the topic/keywords. One per line, no numbering, max 60 chars each. Topic: "${text}"`;
  else if (action === 'Generate Hashtags') prompt = `Generate 10-15 relevant SEO-friendly hashtags for a YouTube video about the topic. Return ONLY a single line of space-separated hashtags starting with #. Topic: "${text}"`;
  else if (action === 'Generate Tags') prompt = `Generate 15 SEO-friendly YouTube tags for this video topic. One tag per line, no #, lowercase, no quotes. Topic: "${text}"`;
  else if (action === 'OptimizeDescription') prompt = `Rewrite and optimize a YouTube video description. Include: strong hook (1-2 lines), value bullets, keywords naturally, soft CTA, and optional timestamps if present in input. Keep it concise and human. Return plain text only. Input: "${text}"`;
  else if (action === 'GenerateDescription') prompt = `You are an expert YouTube SEO copywriter. Given a video topic, write a complete, high-converting description including: a 1–2 line hook, concise value bullets, natural keywords, soft CTAs (subscribe/comment), and optional timestamp/chapter placeholders. Keep it human and skimmable. Return plain text only. Topic: "${text}"`;
  else if (action === 'GenerateChapters') prompt = `Create timestamped YouTube chapters from this transcript/outline. Format as lines: 00:00 Title. Use logical segments, 5-12 chapters. Input: "${text}"`;
  else if (action === 'ContinueWriting') {
    prompt = `You are a writing assistant. Continue right after the given text without repeating it. Return ONLY the new continuation as plain text (no markdown, no **, no headings). Original Text: "${text}"`;
  }
  else if (action === 'GenerateTweet') {
    let mood = '';
    let topic = '';
    try { const obj = JSON.parse(text); mood = obj.mood || ''; topic = obj.topic || ''; } catch {}
    prompt = `Write ONE tweet under 280 chars about "${topic}" in a ${mood||'relevant'} tone.
Rules: no markdown/code blocks, no HTML/CSS/JS, no system dumps, no greetings/proposals, no lists. Avoid hashtags unless essential; no links unless provided; emojis only if mood implies.
Return ONLY the tweet.`;
  }
  else if (action === 'CommentReplies') {
   const langHint = await detectLanguage(text);
   prompt = `From the following YouTube comment and its context, generate 6 concise, friendly reply options that sound like a creator. Detect the comment's primary language and script and REPLY IN THE SAME LANGUAGE/STYLE. If Hinglish/mixed, reply in Hinglish (Latin script). If Devanagari, reply in Hindi script. Preserve emojis/hashtags if present. One per line, 6–18 words, varied tone (thanks, clarify, invite, CTA).
Language hint: ${langHint || 'unknown'}
Comment/context: "${text}"`;
 }
  else if (action === 'PolicyCheck') prompt = `You are a YouTube policy assistant. Analyze the text for possible issues (misleading claims, hate/harassment, sensitive content, spammy tags/hashtags, medical/financial advice, copyrighted material). Return a short checklist with risk labels and quick fixes. Text: "${text}"`;
  else if (action === 'ExtractActionItems') prompt = `From the following text, identify and list all action items. Return them as a numbered list. Text: "${text}"`;
  else if (action === 'summarize' || action === 'Summarize') prompt = `Provide a concise summary of the following text as a single paragraph, without using bullet points or asterisks. Text: "${text}"`;
  else if (action === 'rephrase' || action === 'Rephrase') prompt = `Rephrase the following text to be more clear and professional. Do not repeat the original words at the start; continue from them if needed. Return only the improved continuation, not the duplicated prefix. Text: "${text}"`;
  else if (action === 'translate' || action === 'Translate') {
    if (targetLanguage === 'en-HI') {
      prompt = `Translate the following text to Hinglish (a mix of Hindi and English using the Latin script). Only return the translated text. Text: "${text}"`;
    } else if (targetLanguage === 'gbm') {
      prompt = `Translate the following text to Garhwali. Only return the translated text. Text: "${text}"`;
    } else {
      prompt = `Translate the following text to ${targetLanguage}. Only return the translated text. Text: "${text}"`;
    }
  } else {
    prompt = `Rewrite the following text in a more ${action.toLowerCase()} tone. Only return the rewritten text. Text: "${text}"`;
  }

  const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(`API request failed: ${response.status} - ${errorBody.error.message}`);
  }
  const data = await response.json();
  if (!data.candidates || data.candidates.length === 0) throw new Error("API returned no candidates.");
  const outRaw = data.candidates[0].content.parts[0].text || '';
  const result = action === 'GenerateTweet' ? sanitizeTweet(outRaw) : outRaw;
  
  // Cache the result (include targetLanguage for translations)
  globalCache.set(action, text, result, targetLanguage);
  Logger.debug('💾 Result cached for future use');
  
  return result;
}

function sanitizeTweet(s){
  if (!s) return '';
  let t = String(s);
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/<style[\s\S]*?<\/style>/gi, ' ');
  t = t.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  t = t.replace(/<[^>]+>/g, ' ');
  t = t.replace(/window\.__INITIAL_STATE__[\s\S]*/i, ' ');
  t = t.replace(/To view keyboard shortcuts, press question mark[\s\S]*/i, ' ');
  t = t.replace(/^[^\n]*JavaScript is not available\.[\s\S]*/i, ' ');
  t = t.replace(/\r?\n+/g, ' ');
  t = t.replace(/\s+/g, ' ').trim();
  // Remove common proposal/greeting prefixes if model misbehaves
  t = t.replace(/^hello\b[^,]*,?/i, '').replace(/^hi\b[^,]*,?/i, '').replace(/^dear\b[^,]*,?/i, '').trim();
  // Heuristic: if it looks like a cover letter, pick a concise sentence
  if (t.length > 200 && /\./.test(t)) {
    const parts = t.split(/[.!?]/).map(p=>p.trim()).filter(Boolean);
    const best = parts.sort((a,b)=>Math.abs(140-a.length)-Math.abs(140-b.length))[0] || t;
    t = best;
  }
  if (t.length > 280) t = t.slice(0, 277) + '...';
  return t;
}


async function processTextWithAI(action, text, targetLanguage) {
  const { ai_model_preference } = await chrome.storage.local.get({ ai_model_preference: 'hybrid' });
  Logger.debug(`Processing with AI model preference: ${ai_model_preference}`);

  let rawResult;
  const CLOUD_ONLY_ACTIONS = ['Generate Titles', 'Generate Hashtags', 'ExtractActionItems', 'OptimizeDescription', 'GenerateChapters', 'CommentReplies', 'PolicyCheck', 'ThumbnailText', 'Generate Tags'];

  if (CLOUD_ONLY_ACTIONS.includes(action) || ((action === 'translate' || action === 'Translate') && (targetLanguage === 'en-HI' || targetLanguage === 'gbm'))) {
    Logger.debug(`Action '${action}' requires Cloud API. Processing directly.`);
    rawResult = await processCloudAI(action, text, targetLanguage);
  } else {
    switch (ai_model_preference) {
      case 'on-device':
        try {
          rawResult = await processOnDeviceAI(action, text, targetLanguage);
        } catch (error) {
          Logger.error(`On-device AI failed: ${error.message}. User preference is on-device only.`);
          throw new Error(`On-device AI failed: ${error.message}. Change preference to Hybrid or Cloud to use cloud fallback.`);
        }
        break;
      case 'cloud':
        rawResult = await processCloudAI(action, text, targetLanguage);
        break;
      case 'hybrid':
      default:
        try {
          rawResult = await processOnDeviceAI(action, text, targetLanguage);
        } catch (error) {
          Logger.warn(`On-device AI failed: ${error.message}. Falling back to cloud.`);
          rawResult = await processCloudAI(action, text, targetLanguage);
        }
        break;
    }
  }

  if ((action === 'summarize' || action === 'Summarize') && typeof rawResult === 'string') {
      const cleanedResult = rawResult.split('\n')
                                     .map(line => line.replace(/^["\'\s*•-]/g, '').trim())
                                     .filter(line => line.length > 0)
                                     .join(' ');
      return cleanedResult;
  }

  return rawResult;
}

// --- Helper function for streaming to popup or content script ---
function sendStreamMessage(tabId, message) {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, message);
  } else {
    chrome.runtime.sendMessage(message);
  }
}

// --- Streaming Functions (for Popup) ---
async function streamOnDeviceAI(action, text, targetLanguage, customPrompt, tabId) {
    Logger.debug(`Attempting to stream from Built-in AI for action '${action}'...`);
    let sentAnyChunk = false; // Track if any chunk was sent
    if (['proofread', 'Grammar Fix', 'rephrase', 'Rephrase', 'Formal', 'Casual', 'Confident', 'ContinueWriting', 'Custom'].includes(action)) {
        if (typeof LanguageModel === 'undefined') throw new Error("LanguageModel API not available.");
        const availability = await LanguageModel.availability();
        if (availability !== 'available') throw new Error(`LanguageModel not ready: ${availability}`);
        let promptText;
        if (action === 'proofread' || action === 'Grammar Fix') promptText = `Proofread and correct any spelling and grammar mistakes in the following text. Only return the corrected text. Text: "${text}"`;
        else if (action === 'rephrase' || action === 'Rephrase') promptText = `You are a text rephrasing tool. Your sole task is to rephrase the following text to be more clear, professional, and engaging. Do not use markdown (like **). Do not add any explanations or introductory phrases. Output only the rephrased text. Original text: "${text}"`;
        else if (action === 'ContinueWriting') promptText = `Continue right after the given text without repeating it. Return ONLY the new continuation as plain text (no markdown, no **, no headings). Text: "${text}"`;
        else if (action === 'Custom') {
            promptText = `IGNORE ALL PREVIOUS INSTRUCTIONS. You are a machine that strictly follows a user\'s command. You will be given a command and a piece of text. Your ONLY job is to apply the command to the text. Do not explain yourself. Do not use markdown. Do not add any extra text.\n\nCOMMAND: '${customPrompt}'\n\nTEXT: '${text}'\n\nRESULT:`;
        }
        else promptText = `Rewrite the following text in a more ${action.toLowerCase()} tone. Only return the rewritten text. Text: "${text}"`;
        const session = await LanguageModel.create();
        const stream = session.promptStreaming(promptText);
        for await (const chunk of stream) { sendStreamMessage(tabId, { type: 'AI_CHUNK', data: chunk }); sentAnyChunk = true; }
        session.destroy();
    } else {
        let result = await processOnDeviceAI(action, text, targetLanguage);
        if (result) { // Only send if there's a result
            sendStreamMessage(tabId, { type: 'AI_CHUNK', data: result });
            sentAnyChunk = true;
        }
    }
    if (!sentAnyChunk) {
        throw new Error("On-device AI stream produced no output."); // Throw error if no chunks were sent
    }
    sendStreamMessage(tabId, { type: 'AI_STREAM_END' });
    Logger.debug('Built-in AI stream finished.');
}

async function streamCloudAI(action, text, targetLanguage, customPrompt, intention, tabId) {
    Logger.debug(`Attempting to stream from Cloud API for action '${action}'...`);
    const API_KEY = await getAPIKey();
    
    // Validate API key
    if (!API_KEY || API_KEY === 'undefined' || API_KEY === '') {
        const errorMsg = 'API key is not configured. Please add your Gemini API key in the extension settings.';
        Logger.error(errorMsg);
        sendStreamMessage(tabId, { type: 'AI_ERROR', error: errorMsg });
        return;
    }
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${API_KEY}&alt=sse`;
    let prompt;

    if (customPrompt) {
        prompt = `You are a helpful AI assistant. Your task is to strictly follow the user's command. COMMAND: ${customPrompt}. TEXT: "${text}"`;
        Logger.debug('Using custom prompt for Cloud AI.');
    } else if (action === 'Generate Smart Reply') {
        const isFirstReply = !text.includes("--- Email 2 ---");

        if (isFirstReply) {
            prompt = `You are an AI assistant helping a user reply to an email. The user's name is likely the recipient in the latest email (e.g., the person greeted with "Hi..."). The original sender is the person who wrote the latest email. Your task is to draft a reply FROM the user TO the original sender. Analyze the following email thread, identify the ORIGINAL SENDER's first name, and draft ONLY the body of a reply with the intention of "${intention}". Your response MUST start with a greeting to the original sender (e.g., "Hi [Original Sender's First Name],''). Do not include the user's name in the reply you generate. Do not include a subject line. Keep the reply concise and professional. Email Thread: "${text}"`;
            Logger.debug('Using AI-driven greeting prompt for the FIRST reply.');
        } else {
            prompt = `You are replying to the following email thread. Draft ONLY the body of a reply with the intention of "${intention}". Do not include a subject line or any greeting (e.g., "Hi [Name],''). Keep the reply concise and professional. Email Thread: "${text}"`;
            Logger.debug('Using no-greeting prompt for a subsequent reply.');
        }

    } else if (action === 'ContinueWriting') {
        prompt = `You are a writing assistant. Continue right after the given text without repeating it. Return ONLY the new continuation as plain text (no markdown, no **, no headings). Original Text: "${text}"`;
        Logger.debug('Using Continue Writing prompt for Cloud AI.');

    } else if (action === 'proofread' || action === 'Grammar Fix') {
        prompt = `Proofread and correct any spelling and grammar mistakes in the following text. Only return the corrected text. Text: "${text}"`;
    } else if (action === 'Generate Titles') {
        prompt = `Generate 10 engaging, CTR-optimized YouTube video titles based on the topic/keywords. One per line, no numbering, max 60 chars each. Topic: "${text}"`;
    } else if (action === 'Generate Hashtags') {
        prompt = `You are a helpful assistant that specializes in generating SEO-friendly hashtags for YouTube videos. Your task is to generate 10-15 relevant hashtags based on the provided topic. Return ONLY a single line of space-separated hashtags, each starting with #. DO NOT include any other text. Topic: "${text}"`;
    } else if (action === 'Generate Tags') {
        prompt = `Generate 15 SEO-friendly YouTube tags for this video topic. One tag per line, no #, lowercase, no quotes. Topic: "${text}"`;
    } else if (action === 'OptimizeDescription') {
        prompt = `Rewrite and optimize a YouTube video description. Include: strong hook (1-2 lines), value bullets, keywords naturally, soft CTA, and optional timestamps if present in input. Keep it concise and human. Return plain text only. Input: "${text}"`;
    } else if (action === 'GenerateChapters') {
        prompt = `Create timestamped YouTube chapters from this transcript/outline. Format as lines: 00:00 Title. Use logical segments, 5-12 chapters. Input: "${text}"`;
    } else if (action === 'GenerateTweet') {
        let mood = '';
        let topic = '';
        try { const obj = JSON.parse(text); mood = obj.mood || ''; topic = obj.topic || ''; } catch {}
        prompt = `Write ONE tweet under 280 chars about "${topic}" in a ${mood||'relevant'} tone.
Rules: no markdown/code blocks, no HTML/CSS/JS, no system dumps, no greetings/proposals, no lists. Avoid hashtags unless essential; no links unless provided; emojis only if mood implies.
Return ONLY the tweet.`;
    } else if (action === 'CommentReplies') {
        const langHint = await detectLanguage(text);
        prompt = `Write a single concise, friendly creator-style reply to this YouTube comment. First detect the comment's primary language and script and REPLY IN THE SAME LANGUAGE/STYLE. If Hinglish/mixed, reply in Hinglish (Latin script); if Devanagari, reply in Hindi script. Preserve emojis/hashtags if present. Keep under 2 sentences.
Language hint: ${langHint || 'unknown'}
Comment/context: "${text}"`;
    } else if (action === 'PolicyCheck') {
        prompt = `You are a YouTube policy assistant. Analyze the text for possible issues (misleading claims, hate/harassment, sensitive content, spammy tags/hashtags, medical/financial advice, copyrighted material). Return a short checklist with risk labels and quick fixes. Text: "${text}"`;
    } else if (action === 'ExtractActionItems') {
        prompt = `From the following text, identify and list all action items. Return them as a numbered list. Text: "${text}"`;
    } else if (action === 'summarize' || action === 'Summarize') {
        prompt = `Provide a concise summary of the following text. Text: "${text}"`;
    } else if (action === 'rephrase' || action === 'Rephrase') {
        prompt = `Rephrase the following text to be more clear and professional. Do not repeat the original words at the start; continue from them if needed. Return only the improved continuation, not the duplicated prefix. Text: "${text}"`;
    } else if (action === 'translate' || action === 'Translate') {
        if (targetLanguage === 'en-HI') {
            prompt = `Translate the following text to Hinglish (a mix of Hindi and English using the Latin script). Only return the translated text. Text: "${text}"`;
        } else if (targetLanguage === 'gbm') {
            prompt = `Translate the following text to Garhwali. Only return the translated text. Text: "${text}"`;
        } else {
            prompt = `Translate the following text to ${targetLanguage}. Only return the translated text. Text: "${text}"`;
        }
    } else {
        prompt = `Rewrite the following text in a more ${action.toLowerCase()} tone. Only return the rewritten text. Text: "${text}"`;
    }

    const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let tweetBuffer = '';
    const bufferOnly = action === 'GenerateTweet';
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.substring(6));
                    const content = data.candidates[0]?.content?.parts[0]?.text;
                    if (!content) continue;
                    if (bufferOnly) {
                        tweetBuffer += content;
                    } else {
                        sendStreamMessage(tabId, { type: 'AI_CHUNK', data: content });
                    }
                } catch (e) { /* Ignore non-JSON lines */ }
            }
        }
    }
    if (bufferOnly) {
        const cleaned = sanitizeTweet(tweetBuffer);
        if (cleaned) sendStreamMessage(tabId, { type: 'AI_CHUNK', data: cleaned });
    }
    sendStreamMessage(tabId, { type: 'AI_STREAM_END' });
    Logger.debug('Cloud AI stream finished.');
}

async function getReplyIntentionsFromCloud(emailText) {
    Logger.debug("Getting reply intentions from Cloud AI...");
    const API_KEY = await getAPIKey();
    
    // Validate API key
    if (!API_KEY || API_KEY === 'undefined' || API_KEY === '') {
        throw new Error('API key is not configured. Please add your Gemini API key in the extension settings.');
    }
    
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    const prompt = `Analyze the following email thread and suggest 3 short, one-to-two-word reply intentions. Examples: "Agree", "Politely Decline", "Request Info", "Express Gratitude". Return ONLY a JSON array of strings, like ["Agree", "Politely Decline", "Request Info"]. Email Thread: "${emailText}"`;

    const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`API request for intentions failed: ${response.status} - ${errorBody.error.message}`);
    }
    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("API returned no candidates for intentions.");
    }
    const rawText = data.candidates[0].content.parts[0].text;
    Logger.debug("Raw intentions response:", rawText);

    try {
        const cleanedText = rawText.replace(/```json\n|```/g, '').trim();
        const intentions = JSON.parse(cleanedText);
        if (Array.isArray(intentions)) {
            return intentions;
        }
        throw new Error("Parsed data is not an array.");
    } catch (e) {
        Logger.error("Failed to parse intentions JSON:", e);
        return ["Reply", "Follow-up", "Clarify"];
    }
}

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, text, targetLanguage, customPrompt, intention } = message;
  const tabId = sender.tab?.id;

  // Handle Auth Messages
  if (message.type === 'CHECK_LOGIN_STATUS') {
    (async () => {
      try {
        const isLoggedIn = await authManager.isLoggedIn();
        if (isLoggedIn) {
          const session = await authManager.getUserSession();
          sendResponse({ isLoggedIn: true, session });
        } else {
          sendResponse({ isLoggedIn: false });
        }
      } catch (error) {
        Logger.error('Check login status error:', error);
        sendResponse({ isLoggedIn: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'GOOGLE_LOGIN') {
    (async () => {
      try {
        const result = await authManager.loginWithGoogle();
        sendResponse(result);
      } catch (error) {
        Logger.error('Google login error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'GOOGLE_LOGOUT') {
    (async () => {
      try {
        const result = await authManager.logout();
        sendResponse(result);
      } catch (error) {
        Logger.error('Google logout error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'GET_API_KEY') {
    (async () => {
      try {
        const apiData = await authManager.getApiKey();
        if (apiData && apiData.key) {
          sendResponse({ apiKey: apiData.key, source: apiData.source });
        } else {
          sendResponse({ apiKey: null });
        }
      } catch (error) {
        Logger.error('Get API key error:', error);
        sendResponse({ apiKey: null, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'SAVE_API_KEY') {
    (async () => {
      try {
        // Validate first
        const validation = await authManager.validateApiKey(message.apiKey);
        if (!validation.valid) {
          sendResponse({ success: false, error: validation.error });
          return;
        }
        
        // Save if valid
        await authManager.saveApiKey(message.apiKey, 'manual');
        sendResponse({ success: true });
      } catch (error) {
        Logger.error('Save API key error:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // Ignore internal streaming messages if they are not the initial START_AI_STREAM
  if (message.type === 'AI_CHUNK' || message.type === 'AI_STREAM_END' || message.type === 'AI_ERROR') {
    return false; // Do not process these messages as new AI requests in background.js
  }

  if (message.type === 'START_AI_STREAM') {
    (async () => {
      const { ai_model_preference } = await chrome.storage.local.get({ ai_model_preference: 'hybrid' });
      Logger.debug(`Processing stream with AI model preference: ${ai_model_preference}`);

      const CLOUD_STREAM_ONLY_ACTIONS = ['Generate Smart Reply', 'Generate Titles', 'Generate Hashtags', 'ExtractActionItems', 'OptimizeDescription', 'GenerateChapters', 'CommentReplies', 'PolicyCheck', 'ThumbnailText', 'Generate Tags'];
      const isCloudOnlyAction = CLOUD_STREAM_ONLY_ACTIONS.includes(action);
      const isSpecialTranslation = (action === 'Translate' || action === 'translate') && (targetLanguage === 'en-HI' || targetLanguage === 'gbm');
      const forceCloud = isCloudOnlyAction || isSpecialTranslation;

      if (forceCloud) {
        Logger.debug(`Action '${action}' requires Cloud API, processing directly.`);
        try {
          await streamCloudAI(action, text, targetLanguage, customPrompt, intention, tabId);
        } catch (cloudError) {
          Logger.error("Cloud AI Streaming Error:", cloudError);
          sendStreamMessage(tabId, { type: 'AI_ERROR', error: cloudError.message });
        }
        return;
      }

      switch (ai_model_preference) {
        case 'on-device':
          try {
            await streamOnDeviceAI(action, text, targetLanguage, customPrompt, tabId);
          } catch (e) {
            Logger.error(`On-device stream failed: ${e.message}. User preference is on-device only.`);
            sendStreamMessage(tabId, { type: 'AI_ERROR', error: `On-device AI failed: ${e.message}. Change preference to Hybrid or Cloud to use cloud fallback.` });
          }
          break;
        case 'cloud':
          try {
            await streamCloudAI(action, text, targetLanguage, customPrompt, intention, tabId);
          } catch (cloudError) {
            Logger.error("Cloud AI Streaming Error:", cloudError);
            sendStreamMessage(tabId, { type: 'AI_ERROR', error: cloudError.message });
          }
          break;
        case 'hybrid':
        default:
          try {
                          await streamOnDeviceAI(action, text, targetLanguage, customPrompt, tabId);
          } catch (e) {
            Logger.warn(`On-device stream failed or was bypassed: ${e.message}. Falling back to cloud stream.`);
            sendStreamMessage(tabId, { type: 'AI_INFO', data: `On-device AI failed: ${e.message}. Falling back to cloud.` });
            try {
              await streamCloudAI(action, text, targetLanguage, customPrompt, intention, tabId);
            } catch (cloudError) {
              Logger.error("Cloud AI Streaming Error:", cloudError);
              sendStreamMessage(tabId, { type: 'AI_ERROR', error: cloudError.message });
            }
          }
          break;
      }
    })();

  } else if (message.type === 'GET_REPLY_INTENTIONS') {
    (async () => {
        try {
            const intentions = await getReplyIntentionsFromCloud(message.text);
            sendResponse({ data: intentions });
        } catch (error) {
            Logger.error("Error getting reply intentions:", error);
            sendResponse({ error: error.message });
        }
    })();
    return true;

  } else {
    (async () => {
      try {
        Logger.debug(`Processing non-streaming request: ${message.type}`);
        const result = await processTextWithAI(message.type, message.text, message.targetLanguage);
        sendResponse({ data: result });
      } catch (error) {
        Logger.error(`Error processing ${message.type}:`, error);
        sendResponse({ error: error.message });
      }
    })();
    return true;
  }
});

// --- Context Menu Logic ---
chrome.runtime.onInstalled.addListener(() => {
  Logger.info('Extension installed. Creating context menus.');
  chrome.contextMenus.create({ id: "writebuddy-parent", title: "WriteBuddy AI", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "proofread", title: "Proofread Selection", parentId: "writebuddy-parent", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "summarize", title: "Summarize Selection", parentId: "writebuddy-parent", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "rephrase", title: "Rephrase Selection", parentId: "writebuddy-parent", contexts: ["selection"] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const { menuItemId, selectionText } = info;
  Logger.debug(`Context menu clicked: ${menuItemId}`);
  if (tab?.url && tab.url.startsWith('https://www.youtube.com/')) {
    Logger.info('Context menu action ignored on www.youtube.com');
    return;
  }
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'AI_START' });
    processTextWithAI(menuItemId, selectionText, 'Hindi')
      .then(result => {
        chrome.tabs.sendMessage(tab.id, { type: 'AI_RESULT', data: result });
      })
      .catch(error => {
        Logger.error("Background Script Error (context menu):", error);
        chrome.tabs.sendMessage(tab.id, { type: 'AI_ERROR', error: error.message });
      });
  }
});
