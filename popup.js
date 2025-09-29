/**
 * Popup script for Element Embeddings Chrome Extension
 */

class PopupManager {
  constructor() {
    this.apiKeyInput = document.getElementById('apiKey');
    this.toggleKeyButton = document.getElementById('toggleKey');
    this.saveKeyButton = document.getElementById('saveKey');
    this.testKeyButton = document.getElementById('testKey');
    this.demoButton = document.getElementById('demo');
    this.statusDiv = document.getElementById('status');
    this.demoResultsDiv = document.getElementById('demoResults');
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadApiKeyStatus();
  }

  setupEventListeners() {
    this.toggleKeyButton.addEventListener('click', () => {
      const type = this.apiKeyInput.type;
      this.apiKeyInput.type = type === 'password' ? 'text' : 'password';
      this.toggleKeyButton.textContent = type === 'password' ? '🙈' : '👁️';
    });

    this.saveKeyButton.addEventListener('click', () => this.saveApiKey());
    this.testKeyButton.addEventListener('click', () => this.testApiKey());
    this.demoButton.addEventListener('click', () => this.runDemo());
    
    this.apiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.saveApiKey();
      }
    });
  }

  async loadApiKeyStatus() {
    try {
      const response = await this.sendMessage({ type: 'GET_API_KEY_STATUS' });
      if (response.hasApiKey) {
        this.showStatus('✅ API key configured', 'success');
        this.apiKeyInput.placeholder = 'API key is set (hidden for security)';
      } else {
        this.showStatus('⚠️ No API key configured', 'warning');
      }
    } catch (error) {
      this.showStatus(`❌ Error: ${error.message}`, 'error');
    }
  }

  async saveApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('❌ Please enter an API key', 'error');
      return;
    }

    this.showStatus('💾 Saving API key...', 'info');
    this.saveKeyButton.disabled = true;

    try {
      const response = await this.sendMessage({ 
        type: 'SAVE_API_KEY', 
        apiKey: apiKey 
      });
      
      if (response.success) {
        this.showStatus('✅ API key saved successfully', 'success');
        this.apiKeyInput.value = '';
        this.apiKeyInput.placeholder = 'API key is set (hidden for security)';
      } else {
        this.showStatus(`❌ Failed to save: ${response.error}`, 'error');
      }
    } catch (error) {
      this.showStatus(`❌ Error: ${error.message}`, 'error');
    } finally {
      this.saveKeyButton.disabled = false;
    }
  }

  async testApiKey() {
    const apiKey = this.apiKeyInput.value.trim();
    
    if (!apiKey) {
      this.showStatus('❌ Please enter an API key to test', 'error');
      return;
    }

    this.showStatus('🔄 Testing API key...', 'info');
    this.testKeyButton.disabled = true;

    try {
      const response = await this.sendMessage({ 
        type: 'TEST_API_KEY', 
        apiKey: apiKey 
      });
      
      if (response.isValid) {
        this.showStatus('✅ API key is valid!', 'success');
      } else {
        this.showStatus(`❌ API key is invalid: ${response.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      this.showStatus(`❌ Test failed: ${error.message}`, 'error');
    } finally {
      this.testKeyButton.disabled = false;
    }
  }

  async runDemo() {
    this.showStatus('🚀 Running demo on current page...', 'info');
    this.demoButton.disabled = true;
    this.demoResultsDiv.innerHTML = '';

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        throw new Error('No active tab found');
      }

      // Inject code to demonstrate the embedding functionality
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.demoScript
      });

      if (results && results[0] && results[0].result) {
        this.displayDemoResults(results[0].result);
        this.showStatus('✅ Demo completed successfully!', 'success');
      } else {
        this.showStatus('⚠️ Demo completed but no results returned', 'warning');
      }
    } catch (error) {
      this.showStatus(`❌ Demo failed: ${error.message}`, 'error');
    } finally {
      this.demoButton.disabled = false;
    }
  }

  // This function will be injected into the page to run the demo
  demoScript() {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const results = [];
        
        try {
          // Find some elements to test
          const testElements = [
            document.querySelector('h1'),
            document.querySelector('p'),
            document.querySelector('img'),
            document.querySelector('a')
          ].filter(el => el && el.innerText?.trim());

          // Limit to first 3 elements to avoid too many API calls
          const elementsToTest = testElements.slice(0, 3);

          for (const element of elementsToTest) {
            try {
              const embedding = await element.embedding;
              results.push({
                tag: element.tagName,
                content: element.innerText?.substring(0, 100) || element.src || element.href || 'No content',
                hasEmbedding: !!embedding.vector,
                vectorLength: embedding.vector?.length || 0,
                type: embedding.type,
                error: embedding.error
              });
            } catch (error) {
              results.push({
                tag: element.tagName,
                content: 'Error getting embedding',
                error: error.message,
                hasEmbedding: false
              });
            }
          }
        } catch (error) {
          results.push({
            error: `Demo error: ${error.message}`,
            hasEmbedding: false
          });
        }

        resolve(results);
      }, 1000); // Give time for embedding manager to initialize
    });
  }

  displayDemoResults(results) {
    if (!results || results.length === 0) {
      this.demoResultsDiv.innerHTML = '<p>No results to display</p>';
      return;
    }

    const html = results.map(result => {
      const status = result.hasEmbedding ? '✅' : '❌';
      const content = result.content?.substring(0, 50) + (result.content?.length > 50 ? '...' : '');
      const error = result.error ? ` (${result.error})` : '';
      const vectorInfo = result.hasEmbedding ? ` [${result.vectorLength}D vector]` : '';
      
      return `
        <div class="demo-result">
          <strong>${status} ${result.tag || 'Element'}</strong>
          <br>Content: "${content}"
          <br>Type: ${result.type || 'unknown'}${vectorInfo}${error}
        </div>
      `;
    }).join('');

    this.demoResultsDiv.innerHTML = `
      <h3>Demo Results:</h3>
      ${html}
    `;
  }

  showStatus(message, type = 'info') {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    
    // Auto-clear status after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        if (this.statusDiv.textContent === message) {
          this.statusDiv.textContent = '';
          this.statusDiv.className = 'status';
        }
      }, 5000);
    }
  }

  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});