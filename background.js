/**
 * Background script for Element Embeddings Chrome Extension
 * Handles API communication with Gemini embedding model
 */

class GeminiEmbeddingService {
  constructor() {
    this.apiKey = null;
    this.baseUrl = 'https://generativelanguage.googleapis.com';
    this.model = 'text-embedding-004';
    this.cache = new Map();
    this.loadApiKey();
  }

  /**
   * Load API key from storage
   */
  async loadApiKey() {
    try {
      const result = await chrome.storage.sync.get(['geminiApiKey']);
      this.apiKey = result.geminiApiKey;
    } catch (error) {
      console.error('[Background] Failed to load API key:', error);
    }
  }

  /**
   * Save API key to storage
   */
  async saveApiKey(apiKey) {
    try {
      await chrome.storage.sync.set({ geminiApiKey: apiKey });
      this.apiKey = apiKey;
      return true;
    } catch (error) {
      console.error('[Background] Failed to save API key:', error);
      return false;
    }
  }

  /**
   * Generate embedding using Gemini API
   */
  async generateEmbedding(content, contentType = 'text') {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    if (!content || content.trim() === '') {
      throw new Error('No content provided for embedding');
    }

    // Check cache first
    const cacheKey = `${contentType}:${content}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let requestBody;
      let endpoint;

      if (contentType === 'text') {
        endpoint = `${this.baseUrl}/v1/models/${this.model}:embedContent?key=${this.apiKey}`;
        requestBody = {
          model: `models/${this.model}`,
          content: {
            parts: [{
              text: content
            }]
          }
        };
      } else {
        // For image/video/audio, we'll use text embedding for now with descriptive text
        // In a full implementation, you'd use the appropriate multimodal embedding endpoints
        endpoint = `${this.baseUrl}/v1/models/${this.model}:embedContent?key=${this.apiKey}`;
        requestBody = {
          model: `models/${this.model}`,
          content: {
            parts: [{
              text: `${contentType.toUpperCase()} CONTENT: ${content}`
            }]
          }
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.embedding || !data.embedding.values) {
        throw new Error('Invalid response format from Gemini API');
      }

      const result = {
        embedding: data.embedding.values,
        model: this.model,
        timestamp: Date.now()
      };

      // Cache the result
      this.cache.set(cacheKey, result);
      
      // Clean up cache if it gets too large
      if (this.cache.size > 1000) {
        const oldestKey = this.cache.keys().next().value;
        this.cache.delete(oldestKey);
      }

      return result;

    } catch (error) {
      console.error('[Background] Embedding generation failed:', error);
      throw error;
    }
  }

  /**
   * Test API key validity
   */
  async testApiKey(apiKey) {
    const tempApiKey = this.apiKey;
    this.apiKey = apiKey;

    try {
      await this.generateEmbedding('test', 'text');
      return true;
    } catch (error) {
      this.apiKey = tempApiKey;
      return false;
    }
  }
}

// Initialize the service
const embeddingService = new GeminiEmbeddingService();

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_EMBEDDING') {
    embeddingService.generateEmbedding(request.content, request.contentType)
      .then(result => {
        sendResponse({
          embedding: result.embedding,
          model: result.model,
          timestamp: result.timestamp
        });
      })
      .catch(error => {
        sendResponse({
          error: error.message
        });
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  } else if (request.type === 'SAVE_API_KEY') {
    embeddingService.saveApiKey(request.apiKey)
      .then(success => {
        sendResponse({ success });
      })
      .catch(error => {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      });
    
    return true;
  } else if (request.type === 'TEST_API_KEY') {
    embeddingService.testApiKey(request.apiKey)
      .then(isValid => {
        sendResponse({ isValid });
      })
      .catch(error => {
        sendResponse({ 
          isValid: false, 
          error: error.message 
        });
      });
    
    return true;
  } else if (request.type === 'GET_API_KEY_STATUS') {
    sendResponse({ 
      hasApiKey: !!embeddingService.apiKey,
      model: embeddingService.model
    });
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[Background] Element Embeddings extension installed');
    
    // Open options page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html')
    });
  }
});

// Export for debugging
if (typeof globalThis !== 'undefined') {
  globalThis.embeddingService = embeddingService;
}