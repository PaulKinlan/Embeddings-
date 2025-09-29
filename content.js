/**
 * Content script for Element Embeddings Chrome Extension
 * Adds .embedding property to every HTML element
 */

class EmbeddingManager {
  constructor() {
    this.cache = new Map();
    this.processing = new Set();
    this.observer = null;
    this.initializeEmbeddings();
  }

  /**
   * Initialize embeddings for all existing elements and set up monitoring
   */
  async initializeEmbeddings() {
    console.log('[Embeddings] Initializing element embeddings...');
    
    // Process existing elements
    await this.processAllElements();
    
    // Set up mutation observer for new elements
    this.setupMutationObserver();
    
    console.log('[Embeddings] Initialization complete');
  }

  /**
   * Process all elements in the document
   */
  async processAllElements() {
    const elements = document.querySelectorAll('*');
    
    // Process elements in batches to avoid blocking the main thread
    const batchSize = 50;
    for (let i = 0; i < elements.length; i += batchSize) {
      const batch = Array.from(elements).slice(i, i + batchSize);
      await this.processBatch(batch);
      
      // Allow other tasks to run
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  /**
   * Process a batch of elements
   */
  async processBatch(elements) {
    const promises = elements.map(element => this.addEmbeddingProperty(element));
    await Promise.all(promises);
  }

  /**
   * Add embedding property to an element
   */
  async addEmbeddingProperty(element) {
    if (!element || element.hasAttribute('data-embedding-processed')) {
      return;
    }

    // Mark element as being processed
    element.setAttribute('data-embedding-processed', 'true');

    try {
      // Define the embedding property with a getter
      Object.defineProperty(element, 'embedding', {
        get: () => this.getEmbedding(element),
        configurable: true,
        enumerable: true
      });
    } catch (error) {
      console.warn('[Embeddings] Failed to add embedding property to element:', error);
    }
  }

  /**
   * Get embedding for an element (with caching)
   */
  async getEmbedding(element) {
    const elementId = this.getElementIdentifier(element);
    
    // Check cache first
    if (this.cache.has(elementId)) {
      return this.cache.get(elementId);
    }

    // Check if already processing
    if (this.processing.has(elementId)) {
      // Wait for processing to complete
      while (this.processing.has(elementId)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.cache.get(elementId);
    }

    // Start processing
    this.processing.add(elementId);

    try {
      const embedding = await this.generateEmbedding(element);
      this.cache.set(elementId, embedding);
      return embedding;
    } catch (error) {
      console.error('[Embeddings] Failed to generate embedding:', error);
      const errorResult = { error: error.message, timestamp: Date.now() };
      this.cache.set(elementId, errorResult);
      return errorResult;
    } finally {
      this.processing.delete(elementId);
    }
  }

  /**
   * Generate embedding based on element type
   */
  async generateEmbedding(element) {
    const tagName = element.tagName.toLowerCase();
    
    let content = '';
    let contentType = 'text';

    if (tagName === 'img') {
      content = await this.extractImageContent(element);
      contentType = 'image';
    } else if (tagName === 'video') {
      content = await this.extractVideoContent(element);
      contentType = 'video';
    } else if (tagName === 'audio') {
      content = await this.extractAudioContent(element);
      contentType = 'audio';
    } else {
      content = this.extractTextContent(element);
      contentType = 'text';
    }

    if (!content || content.trim() === '') {
      return { 
        vector: null, 
        content: '', 
        type: contentType,
        timestamp: Date.now(),
        message: 'No content to embed'
      };
    }

    // Request embedding from background script
    const response = await this.requestEmbedding(content, contentType);
    return {
      vector: response.embedding,
      content: content,
      type: contentType,
      timestamp: Date.now(),
      model: response.model || 'gemini'
    };
  }

  /**
   * Extract text content from element
   */
  extractTextContent(element) {
    const text = element.innerText?.trim() || element.textContent?.trim() || '';
    // Limit text length to avoid API limits
    return text.substring(0, 2000);
  }

  /**
   * Extract image content (convert to base64 or use src)
   */
  async extractImageContent(element) {
    if (element.src) {
      // For now, return the image URL/alt text
      return element.alt || element.src || '';
    }
    return '';
  }

  /**
   * Extract video content
   */
  async extractVideoContent(element) {
    // For now, extract video metadata
    const title = element.title || element.getAttribute('aria-label') || '';
    const src = element.src || element.currentSrc || '';
    return `Video: ${title} ${src}`.trim();
  }

  /**
   * Extract audio content
   */
  async extractAudioContent(element) {
    // For now, extract audio metadata
    const title = element.title || element.getAttribute('aria-label') || '';
    const src = element.src || element.currentSrc || '';
    return `Audio: ${title} ${src}`.trim();
  }

  /**
   * Request embedding from background script
   */
  async requestEmbedding(content, contentType) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'GET_EMBEDDING',
        content: content,
        contentType: contentType
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Generate unique identifier for element
   */
  getElementIdentifier(element) {
    // Create a unique identifier based on element properties
    const tagName = element.tagName;
    const id = element.id;
    const className = element.className;
    const textContent = element.textContent?.substring(0, 100) || '';
    const src = element.src || '';
    
    return `${tagName}-${id}-${className}-${btoa(textContent + src)}`.substring(0, 200);
  }

  /**
   * Set up mutation observer to handle dynamic content
   */
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      const newElements = [];
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              newElements.push(node);
              // Also get all child elements
              newElements.push(...node.querySelectorAll('*'));
            }
          });
        }
      });

      if (newElements.length > 0) {
        this.processBatch(newElements);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.cache.clear();
    this.processing.clear();
  }
}

// Initialize the embedding manager when the page loads
let embeddingManager;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    embeddingManager = new EmbeddingManager();
  });
} else {
  embeddingManager = new EmbeddingManager();
}

// Cleanup when page unloads
window.addEventListener('beforeunload', () => {
  if (embeddingManager) {
    embeddingManager.destroy();
  }
});

// Export for debugging
window.embeddingManager = embeddingManager;