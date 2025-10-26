// gemini.js - Optimized lightweight wrapper for Gemini AI API
// This replaces the 17MB bundled version with a simple fetch-based implementation

class GeminiAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = 'gemini-2.0-flash';
  }

  async generateContent(prompt, config = {}) {
    const {
      temperature = 0.7,
      maxTokens = 2048,
      stream = false
    } = config;

    const url = `${this.baseURL}/${this.model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${this.apiKey}${stream ? '&alt=sse' : ''}`;
    
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    };

    if (stream) {
      return this.streamContent(url, body);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API request failed');
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async *streamContent(url, body) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Stream request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) yield text;
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  // Static method for quick usage
  static async generate(apiKey, prompt, config) {
    const client = new GeminiAI(apiKey);
    return client.generateContent(prompt, config);
  }
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GeminiAI };
}

// Global export for browser
if (typeof window !== 'undefined') {
  window.GeminiAI = GeminiAI;
}
