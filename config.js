const ICONS = {
    summarize: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M4 6h16v2H4zm0 4h16v2H4zm0 4h12v2H4z"/></svg>`,
    rephrase: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/></svg>`,
    grammar: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
    translate: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
    draftReply: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M14.06 9.02l.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z"/></svg>`,
    improve: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M12 6l1.9 3.8L18 12l-4.1 2.2L12 18l-1.9-3.8L6 12l4.1-2.2z"/></svg>`,
    shorten: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M4 9h16v2H4zm12 4H8v2h8z"/></svg>`,
    briefcase: `<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`,
    smile: `<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.47 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5-6c.78 2.34 2.72 4 5 4s4.22-1.66 5-4H7z"/></svg>`,
    coffee: `<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.9 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>`,
    zap: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`,
    hash: `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 0 24 24" width="20px" fill="currentColor"><path d="M10 9h4V6h-4v3zm-6 6h4v-3H4v3zm0-8h4V4H4v3zm0 12h4v-3H4v3zm6 0h4v-3h-4v3zm0-8h4v-3h-4v3zm6-8v3h4V4h-4zm0 8h4v-3h-4v3zm0 8h4v-3h-4v3z"/></svg>`
};

const CONTEXT_CONFIG = {
    'default': {
        actions: [
            { id: 'continue-writing', label: 'Continue Writing', icon: ICONS.draftReply, action: 'ContinueWriting' },
            { id: 'summarize', label: 'Summarize', icon: ICONS.summarize, action: 'Summarize' },
            { id: 'rephrase', label: 'Rephrase', icon: ICONS.rephrase, action: 'Rephrase' },
            { id: 'grammar', label: 'Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'translate', label: 'Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: 'Formal', action: 'Formal', icon: ICONS.briefcase },
            { label: 'Casual', action: 'Casual', icon: ICONS.coffee },
            { label: 'Confident', action: 'Confident', icon: ICONS.shield }
        ]
    },
    'gmail': {
        actions: [
            { id: 'continue-writing', label: 'Continue Writing', icon: ICONS.draftReply, action: 'ContinueWriting' },
            { id: 'summarize', label: 'Summarize Email', icon: ICONS.summarize, action: 'Summarize' },
            { id: 'smart-reply', label: 'Smart Reply', icon: ICONS.zap, action: 'SmartReply' },
            { id: 'grammar', label: 'Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'translate', label: 'Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: 'Professional', action: 'Formal', icon: ICONS.briefcase },
            { label: 'Polite', action: 'Casual', icon: ICONS.smile },
            { label: 'Concise', action: 'Confident', icon: ICONS.shorten }
        ]
    },
    'youtube': {
        actions: [
            { id: 'titles', label: '🧠 Title Ideas', icon: ICONS.summarize, action: 'Generate Titles' },
            { id: 'desc', label: '✍️ Optimize Description', icon: ICONS.improve, action: 'OptimizeDescription' },
            { id: 'gen-desc', label: '🪄 Generate Description', icon: ICONS.summarize, action: 'GenerateDescription' },
            { id: 'chapters', label: '⏱️ Chapters from Transcript', icon: ICONS.summarize, action: 'GenerateChapters' },
            { id: 'replies', label: '💬 Comment Replies', icon: ICONS.zap, action: 'CommentReplies' },
            { id: 'tags', label: '🏷️ Tags', icon: ICONS.hash, action: 'Generate Tags' },
            { id: 'hashtags', label: '#️⃣ Hashtags', icon: ICONS.hash, action: 'Generate Hashtags' },
            { id: 'policy', label: '🛡️ Policy Check', icon: ICONS.shield, action: 'PolicyCheck' },
            { id: 'thumbtext', label: '🖼️ Thumbnail Text', icon: ICONS.rephrase, action: 'ThumbnailText' },
            { id: 'translate', label: '🌐 Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: '🔥 Engaging', action: 'Casual', icon: ICONS.coffee },
            { label: '💼 Professional', action: 'Formal', icon: ICONS.briefcase },
            { label: '💪 Confident', action: 'Confident', icon: ICONS.shield }
        ]
    },
    'linkedin': {
        actions: [
            { id: 'continue-writing', label: '🚀 Continue Writing', icon: ICONS.draftReply, action: 'ContinueWriting' },
            { id: 'improve', label: '✨ Improve Text', icon: ICONS.improve, action: 'Rephrase' },
            { id: 'summarize', label: '📝 Summarize Post', icon: ICONS.summarize, action: 'Summarize' },
            { id: 'grammar', label: '✅ Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'translate', label: '🌐 Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: '💼 Professional', action: 'Formal', icon: ICONS.briefcase },
            { label: '🎯 Action-Oriented', action: 'Confident', icon: ICONS.shield },
            { label: '🔥 Engaging', action: 'Casual', icon: ICONS.coffee }
        ]
    },
    'twitter': {
        actions: [
            { id: 'tweet-improve', label: '✨ Improve Tweet', icon: ICONS.rephrase, action: 'Rephrase' },
            { id: 'shorten', label: '📱 Shorten Post', icon: ICONS.shorten, action: 'Summarize' },
            { id: 'grammar', label: '✅ Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'translate', label: '🌐 Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: '😄 Witty', action: 'Casual', icon: ICONS.smile },
            { label: '✨ Inspirational', action: 'Confident', icon: ICONS.shield },
            { label: '💼 Professional', action: 'Formal', icon: ICONS.briefcase }
        ]
    },
    'facebook': {
        actions: [
            { id: 'continue-writing', label: '🚀 Continue Writing', icon: ICONS.draftReply, action: 'ContinueWriting' },
            { id: 'improve', label: '✨ Improve Post', icon: ICONS.improve, action: 'Rephrase' },
            { id: 'summarize', label: '📝 Summarize', icon: ICONS.summarize, action: 'Summarize' },
            { id: 'grammar', label: '✅ Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'translate', label: '🌐 Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: '😊 Friendly', action: 'Casual', icon: ICONS.smile },
            { label: '💼 Professional', action: 'Formal', icon: ICONS.briefcase },
            { label: '🔥 Engaging', action: 'Confident', icon: ICONS.coffee }
        ]
    },
    'reddit': {
        actions: [
            { id: 'continue-writing', label: '🚀 Continue Writing', icon: ICONS.draftReply, action: 'ContinueWriting' },
            { id: 'improve', label: '✨ Improve Comment', icon: ICONS.improve, action: 'Rephrase' },
            { id: 'summarize', label: '📝 Summarize Post', icon: ICONS.summarize, action: 'Summarize' },
            { id: 'grammar', label: '✅ Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'translate', label: '🌐 Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: '📚 Informative', action: 'Formal', icon: ICONS.briefcase },
            { label: '😄 Humorous', action: 'Casual', icon: ICONS.smile },
            { label: '💬 Debate', action: 'Confident', icon: ICONS.shield }
        ]
    },
    'instagram': {
        actions: [
            { id: 'continue-writing', label: '🚀 Continue Writing', icon: ICONS.draftReply, action: 'ContinueWriting' },
            { id: 'rephrase', label: '📸 Write Caption', icon: ICONS.rephrase, action: 'Rephrase' },
            { id: 'hashtags', label: '#️⃣ Generate Hashtags', icon: ICONS.hash, action: 'Generate Hashtags' },
            { id: 'grammar', label: '✅ Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'translate', label: '🌐 Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: '✨ Trendy', action: 'Casual', icon: ICONS.coffee },
            { label: '💫 Inspirational', action: 'Confident', icon: ICONS.shield },
            { label: '😂 Funny', action: 'Casual', icon: ICONS.smile }
        ]
    },
    'google-docs': {
        actions: [
            { id: 'continue-writing', label: '🚀 Continue Writing', icon: ICONS.draftReply, action: 'ContinueWriting' },
            { id: 'summarize', label: '📝 Summarize', icon: ICONS.summarize, action: 'Summarize' },
            { id: 'rephrase', label: '✨ Rephrase', icon: ICONS.rephrase, action: 'Rephrase' },
            { id: 'grammar', label: '✅ Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'extract-actions', label: '📋 Extract Action Items', icon: ICONS.briefcase, action: 'ExtractActionItems' },
            { id: 'translate', label: '🌐 Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: '💼 Professional', action: 'Formal', icon: ICONS.briefcase },
            { label: '☕ Casual', action: 'Casual', icon: ICONS.coffee },
            { label: '💪 Confident', action: 'Confident', icon: ICONS.shield }
        ]
    },
    'notion': {
        actions: [
            { id: 'continue-writing', label: '🚀 Continue Writing', icon: ICONS.draftReply, action: 'ContinueWriting' },
            { id: 'summarize', label: '📝 Summarize', icon: ICONS.summarize, action: 'Summarize' },
            { id: 'rephrase', label: '✨ Rephrase', icon: ICONS.rephrase, action: 'Rephrase' },
            { id: 'grammar', label: '✅ Grammar Fix', icon: ICONS.grammar, action: 'Grammar Fix' },
            { id: 'extract-actions', label: '📋 Extract Action Items', icon: ICONS.briefcase, action: 'ExtractActionItems' },
            { id: 'translate', label: '🌐 Translate', icon: ICONS.translate, action: 'Translate' }
        ],
        tones: [
            { label: '💼 Professional', action: 'Formal', icon: ICONS.briefcase },
            { label: '☕ Casual', action: 'Casual', icon: ICONS.coffee },
            { label: '💪 Confident', action: 'Confident', icon: ICONS.shield }
        ]
    }
};

function getContext(url) {
    if (!url) return 'default';
    if (url.includes('docs.google.com')) return 'google-docs';
    if (url.includes('notion.so')) return 'notion';
    if (url.includes('studio.youtube.com')) return 'youtube';
    if (url.includes('mail.google.com')) return 'gmail';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('instagram.com')) return 'instagram';
    return 'default';
}

const LANGUAGES = [
    { code: "Afrikaans", name: "Afrikaans" }, { code: "Albanian", name: "Albanian" },
    { code: "Amharic", name: "Amharic" }, { code: "Arabic", name: "Arabic" },
    { code: "Armenian", name: "Armenian" }, { code: "Azerbaijani", name: "Azerbaijani" },
    { code: "Basque", name: "Basque" }, { code: "Belarusian", name: "Belarusian" },
    { code: "Bengali", name: "Bengali" }, { code: "Bosnian", name: "Bosnian" },
    { code: "Bulgarian", name: "Bulgarian" }, { code: "Catalan", name: "Catalan" },
    { code: "Cebuano", name: "Cebuano" }, { code: "Chinese (Simplified)", name: "Chinese (Simplified)" },
    { code: "Chinese (Traditional)", name: "Chinese (Traditional)" }, { code: "Corsican", name: "Corsican" },
    { code: "Croatian", name: "Croatian" }, { code: "Czech", name: "Czech" },
    { code: "Danish", name: "Danish" }, { code: "Dutch", name: "Dutch" },
    { code: "English", name: "English" }, { code: "Esperanto", name: "Esperanto" },
    { code: "Estonian", name: "Estonian" }, { code: "Finnish", name: "Finnish" },
    { code: "French", name: "French" }, { code: "Frisian", name: "Frisian" },
    { code: "Galician", name: "Galician" }, { code: "gbm", name: "Garhwali" },
    { code: "Georgian", name: "Georgian" }, { code: "German", name: "German" },
    { code: "Greek", name: "Greek" }, { code: "Gujarati", name: "Gujarati" },
    { code: "Haitian Creole", name: "Haitian Creole" }, { code: "Hausa", name: "Hausa" },
    { code: "Hawaiian", name: "Hawaiian" }, { code: "Hebrew", name: "Hebrew" },
    { code: "Hindi", name: "Hindi" }, { code: "en-HI", name: "Hinglish" },
    { code: "Hmong", name: "Hmong" }, { code: "Hungarian", name: "Hungarian" },
    { code: "Icelandic", name: "Icelandic" }, { code: "Igbo", name: "Igbo" },
    { code: "Indonesian", name: "Indonesian" }, { code: "Irish", name: "Irish" },
    { code: "Italian", name: "Italian" }, { code: "Japanese", name: "Japanese" },
    { code: "Javanese", name: "Javanese" }, { code: "Kannada", name: "Kannada" },
    { code: "Kazakh", name: "Kazakh" }, { code: "Khmer", name: "Khmer" },
    { code: "Kinyarwanda", name: "Kinyarwanda" }, { code: "Korean", name: "Korean" },
    { code: "Kurdish", name: "Kurdish" }, { code: "Kyrgyz", name: "Kyrgyz" },
    { code: "Lao", name: "Lao" }, { code: "Latin", name: "Latin" },
    { code: "Latvian", name: "Latvian" }, { code: "Lithuanian", name: "Lithuanian" },
    { code: "Luxembourgish", name: "Luxembourgish" }, { code: "Macedonian", name: "Macedonian" },
    { code: "Malagasy", name: "Malagasy" }, { code: "Malay", name: "Malay" },
    { code: "Malayalam", name: "Malayalam" }, { code: "Maltese", name: "Maltese" },
    { code: "Maori", name: "Maori" }, { code: "Marathi", name: "Marathi" },
    { code: "Mongolian", name: "Mongolian" }, { code: "Myanmar (Burmese)", name: "Myanmar (Burmese)" },
    { code: "Nepali", name: "Nepali" }, { code: "Norwegian", name: "Norwegian" },
    { code: "Nyanja (Chichewa)", name: "Nyanja (Chichewa)" }, { code: "Odia (Oriya)", name: "Odia (Oriya)" },
    { code: "Pashto", name: "Pashto" }, { code: "Persian", name: "Persian" },
    { code: "Polish", name: "Polish" }, { code: "Portuguese", name: "Portuguese" },
    { code: "Punjabi", name: "Punjabi" }, { code: "Romanian", name: "Romanian" },
    { code: "Russian", name: "Russian" }, { code: "Samoan", name: "Samoan" },
    { code: "Scots Gaelic", name: "Scots Gaelic" }, { code: "Serbian", name: "Serbian" },
    { code: "Sesotho", name: "Sesotho" }, { code: "Shona", name: "Shona" },
    { code: "Sindhi", name: "Sindhi" }, { code: "Sinhala (Sinhalese)", name: "Sinhala (Sinhalese)" },
    { code: "Slovak", name: "Slovak" }, { code: "Slovenian", name: "Slovenian" },
    { code: "Somali", name: "Somali" }, { code: "Spanish", name: "Spanish" },
    { code: "Sundanese", name: "Sundanese" }, { code: "Swahili", name: "Swahili" },
    { code: "Swedish", name: "Swedish" }, { code: "Tagalog (Filipino)", name: "Tagalog (Filipino)" },
    { code: "Tajik", name: "Tajik" }, { code: "Tamil", name: "Tamil" },
    { code: "Tatar", name: "Tatar" }, { code: "Telugu", name: "Telugu" },
    { code: "Thai", name: "Thai" }, { code: "Turkish", name: "Turkish" },
    { code: "Turkmen", name: "Turkmen" }, { code: "Ukrainian", name: "Ukrainian" },
    { code: "Urdu", name: "Urdu" }, { code: "Uyghur", name: "Uyghur" },
    { code: "Uzbek", name: "Uzbek" }, { code: "Vietnamese", name: "Vietnamese" },
    { code: "Welsh", name: "Welsh" }, { code: "Xhosa", name: "Xhosa" },
    { code: "Yiddish", name: "Yiddish" }, { code: "Yoruba", name: "Yoruba" },
    { code: "Zulu", name: "Zulu" }
];
