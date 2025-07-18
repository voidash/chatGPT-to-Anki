// Chat to Anki Flashcards - Content Script
// Future-proof ChatGPT and Claude.ai chat detection and flashcard generation

console.log('Anki Extension: Content script loading...');
console.log('Anki Extension: Current URL:', window.location.href);
console.log('Anki Extension: Hostname:', window.location.hostname);
console.log('Anki Extension: User agent:', navigator.userAgent);
console.log('Anki Extension: Document ready state:', document.readyState);

// Add a simple test to verify the script is running
window.ankiExtensionTest = 'LOADED';
console.log('Anki Extension: Test marker set');

class ChatToAnkiExtension {
  constructor() {
    console.log('Anki Extension: Constructor starting...');
    // Detect current platform
    this.platform = this.detectPlatform();
    console.log('Anki Extension: Platform detected as:', this.platform);
    
    // Platform-specific chat detection strategies
    console.log('Anki Extension: Getting detection strategies...');
    this.chatDetectionStrategies = this.getDetectionStrategies();
    console.log('Anki Extension: Detection strategies loaded:', this.chatDetectionStrategies.length);
    
    this.selectedChats = new Set();
    this.isProcessing = false;
    this.observer = null;
    this.exportButton = null;
    this.modal = null;
    
    this.init();
  }
  
  detectPlatform() {
    const hostname = window.location.hostname;
    console.log('Anki Extension: Detecting platform for hostname:', hostname);
    console.log('Anki Extension: Full URL:', window.location.href);
    
    if (hostname.includes('claude.ai')) {
      console.log('Anki Extension: Detected Claude.ai platform');
      return 'claude';
    } else if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      console.log('Anki Extension: Detected ChatGPT platform');
      return 'chatgpt';
    } else if (hostname.includes('perplexity.ai') || hostname.includes('www.perplexity.ai')) {
      console.log('Anki Extension: Detected Perplexity platform');
      return 'perplexity';
    }
    console.log('Anki Extension: Unknown platform detected for hostname:', hostname);
    return 'unknown';
  }

  getDetectionStrategies() {
    console.log('Anki Extension: Getting detection strategies for platform:', this.platform);
    switch (this.platform) {
      case 'claude':
        return [
          // Claude.ai specific strategies
          {
            name: 'claude-sidebar-chats',
            selector: 'nav[aria-label="Sidebar"] a[href*="/chat/"]',
            linkSelector: 'a[href*="/chat/"]'
          },
          {
            name: 'claude-data-testid',
            selector: '[data-testid*="chat"], [data-testid*="conversation"]',
            linkSelector: 'a[href*="/chat/"]'
          },
          {
            name: 'claude-recent-chats',
            selector: 'nav a[href*="/chat/"]',
            linkSelector: 'a[href*="/chat/"]'
          }
        ];
      
      case 'perplexity':
        return [
          // Perplexity.ai specific strategies
          {
            name: 'perplexity-history-threads',
            selector: '[class*="group/history"] a[href*="/search/"]',
            linkSelector: 'a[href*="/search/"]'
          },
          {
            name: 'perplexity-thread-testid',
            selector: '[data-testid*="thread-title"]',
            linkSelector: 'a[href*="/search/"]'
          },
          {
            name: 'perplexity-search-links',
            selector: 'a[href*="/search/"]',
            linkSelector: 'a[href*="/search/"]'
          },
          {
            name: 'perplexity-library-section',
            selector: '[data-testid="library-button"]',
            linkSelector: 'a[href*="/search/"]'
          }
        ];
      
      case 'chatgpt':
      case 'unknown':
      default:
        console.log('Anki Extension: Using default (ChatGPT) detection strategies');
        return [
          // ChatGPT specific strategies
          {
            name: 'data-testid',
            selector: '[data-testid*="chat"], [data-testid*="conversation"]',
            linkSelector: 'a[href*="/c/"]'
          },
          {
            name: 'aria-labels',
            selector: '[role="button"][aria-label*="chat"], [role="menuitem"][aria-label*="conversation"]',
            linkSelector: 'a[href*="/c/"]'
          },
          {
            name: 'url-pattern',
            selector: 'a[href*="/c/"]',
            linkSelector: 'a[href*="/c/"]'
          },
          {
            name: 'structural',
            selector: 'nav li, .sidebar li, [class*="sidebar"] li',
            linkSelector: 'a[href*="/c/"]'
          },
          {
            name: 'text-content',
            selector: '*',
            linkSelector: 'a[href*="/c/"]',
            textFilter: true
          }
        ];
    }
  }

  getLinkPattern() {
    switch (this.platform) {
      case 'claude':
        return 'a[href*="/chat/"]';
      case 'perplexity':
        return 'a[href*="/search/"]';
      case 'chatgpt':
      case 'unknown':
      default:
        return 'a[href*="/c/"]';
    }
  }

  getSidebarSelectors() {
    switch (this.platform) {
      case 'claude':
        return [
          'nav[aria-label="Sidebar"]',
          'nav.h-screen.flex.flex-col',
          'nav.h-screen',
          'div.fixed.z-sidebar nav',
          'nav'
        ];
      case 'perplexity':
        return [
          'aside',
          'nav[class*="sidebar"]',
          '[class*="sidebar"]',
          '[class*="group/history"]',
          'nav'
        ];
      case 'chatgpt':
      case 'unknown':
      default:
        return [
          'nav',
          '[class*="sidebar"]',
          '[data-testid*="sidebar"]',
          '.flex.h-full.w-full.flex-col'
        ];
    }
  }

  getRetryDelay() {
    switch (this.platform) {
      case 'claude':
        return 3000;
      case 'perplexity':
        return 2500;
      case 'chatgpt':
      case 'unknown':
      default:
        return 2000;
    }
  }

  getPlatformName() {
    switch (this.platform) {
      case 'claude':
        return 'Claude.ai';
      case 'perplexity':
        return 'Perplexity.ai';
      case 'chatgpt':
      case 'unknown':
      default:
        return 'ChatGPT';
    }
  }

  getInputSelectors() {
    switch (this.platform) {
      case 'claude':
        return [
          // Claude.ai specific selectors
          'div[contenteditable="true"].ProseMirror',
          'div.ProseMirror[contenteditable="true"]',
          '[contenteditable="true"]',
          'textarea[placeholder*="Talk"]',
          'textarea[placeholder*="Message"]',
          'textarea',
          'input[type="text"]'
        ];
      case 'perplexity':
        return [
          // Perplexity.ai specific selectors
          'textarea[placeholder*="Ask a follow-up"]',
          'textarea[id="ask-input"]',
          'textarea[placeholder*="follow"]',
          'textarea[placeholder*="Ask"]',
          'textarea[placeholder*="search"]',
          'textarea[placeholder*="query"]',
          'textarea',
          'input[type="text"]',
          '[contenteditable="true"]'
        ];
      case 'chatgpt':
      case 'unknown':
      default:
        return [
          // ChatGPT specific selectors
          '#prompt-textarea',
          'div[contenteditable="true"]#prompt-textarea',
          'div.ProseMirror[contenteditable="true"]',
          'textarea[placeholder*="Ask"]',
          'textarea[placeholder*="Message"]',
          '[contenteditable="true"]',
          'textarea',
          'input[type="text"]'
        ];
    }
  }

  getSendButtonSelectors() {
    switch (this.platform) {
      case 'claude':
        return [
          // Claude.ai specific selectors
          'button[aria-label*="Send"]',
          'button[aria-label*="send"]',
          'button:has(svg[viewBox*="24"])',
          'button[type="submit"]',
          'form button[type="submit"]',
          'form button:last-child',
          'button:has(svg)',
          'button[class*="send"]',
          'button[data-testid*="send"]'
        ];
      case 'perplexity':
        return [
          // Perplexity.ai specific selectors
          'button[aria-label*="Submit"]',
          'button[aria-label*="Search"]',
          'button[aria-label*="Ask"]',
          'button[type="submit"]',
          'form button[type="submit"]',
          'form button:last-child',
          'button:has(svg)',
          'button[class*="submit"]',
          'button[class*="search"]',
          'div[class*="input"] + button',
          'textarea + button'
        ];
      case 'chatgpt':
      case 'unknown':
      default:
        return [
          // ChatGPT specific selectors
          '[data-testid="send-button"]',
          'button[aria-label*="Send"]',
          'button[aria-label*="send"]',
          'button[type="submit"]',
          'button[data-testid*="send"]',
          'button[class*="send"]',
          'button svg[data-testid*="send"]',
          'button:has(svg[data-testid*="send"])',
          'button:has(svg[class*="send"])',
          'form button[type="submit"]',
          'form button:last-child',
          'div[class*="group"] button:last-child',
          'div[class*="flex"] button:last-child',
          'div[class*="input"] + button',
          'div[class*="textarea"] + button'
        ];
    }
  }

  getResponseSelectors() {
    switch (this.platform) {
      case 'claude':
        return [
          '.font-claude-message',
          '[data-is-streaming="false"]',
          '.font-claude-message .grid-cols-1',
          '.font-claude-message div'
        ];
      case 'perplexity':
        return [
          '.prose.text-pretty',
          '.prose',
          '[id^="markdown-content-"]',
          '.relative.font-sans.text-base',
          '.min-w-0.break-words',
          '[data-testid="search-result"]',
          '[data-testid="answer"]',
          '.answer-content',
          '.search-result',
          '.response'
        ];
      case 'chatgpt':
      case 'unknown':
      default:
        return [
          '[data-message-author-role="assistant"]',
          '.message.assistant',
          '[class*="assistant"]',
          '.response'
        ];
    }
  }

  init() {
    console.log('Anki Extension: Initializing for platform:', this.platform);
    this.waitForPageLoad().then(() => {
      console.log('Anki Extension: Page loaded, setting up extension');
      this.setupChatDetection();
      this.addExportButton();
      this.setupMutationObserver();
    });
  }
  
  async waitForPageLoad() {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
  }
  
  setupChatDetection() {
    this.detectChats();
    // Re-detect chats periodically in case of dynamic loading
    setInterval(() => this.detectChats(), 2000);
  }
  
  detectChats() {
    let chats = [];
    
    for (const strategy of this.chatDetectionStrategies) {
      try {
        const elements = this.findChatsByStrategy(strategy);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} chats using strategy: ${strategy.name}`);
          chats = elements;
          break;
        }
      } catch (error) {
        console.warn(`Strategy ${strategy.name} failed:`, error);
      }
    }
    
    this.currentChats = chats;
    return chats;
  }
  
  findChatsByStrategy(strategy) {
    const elements = document.querySelectorAll(strategy.selector);
    const chats = [];
    
    elements.forEach(element => {
      let chatData = null;
      
      if (strategy.textFilter) {
        // For text content strategy, look for chat-like patterns
        const text = element.textContent?.trim();
        if (text && text.length > 0 && text.length < 100) {
          const linkPattern = this.getLinkPattern();
          const link = element.querySelector(strategy.linkSelector) || 
                      element.closest(linkPattern);
          if (link) {
            chatData = {
              element: element,
              title: text,
              url: link.href,
              id: this.extractChatId(link.href)
            };
          }
        }
      } else {
        // For other strategies, look for links within or around elements
        const linkPattern = this.getLinkPattern();
        const link = element.querySelector(strategy.linkSelector) || 
                    element.closest(linkPattern) ||
                    element.querySelector(linkPattern);
        
        if (link) {
          const title = this.extractChatTitle(element, link);
          if (title) {
            chatData = {
              element: element,
              title: title,
              url: link.href,
              id: this.extractChatId(link.href)
            };
          }
        }
      }
      
      if (chatData && chatData.id) {
        chats.push(chatData);
      }
    });
    
    // Remove duplicates based on chat ID
    const uniqueChats = chats.filter((chat, index, self) => 
      index === self.findIndex(c => c.id === chat.id)
    );
    
    return uniqueChats;
  }
  
  extractChatTitle(element, link) {
    // Try multiple approaches to get chat title
    const strategies = [
      () => element.textContent?.trim(),
      () => element.querySelector('[title]')?.getAttribute('title'),
      () => element.querySelector('span, div')?.textContent?.trim(),
      () => link.textContent?.trim(),
      () => link.getAttribute('title'),
      () => link.getAttribute('aria-label')
    ];
    
    for (const strategy of strategies) {
      try {
        const title = strategy();
        if (title && title.length > 0 && title.length < 200) {
          return title;
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  }
  
  extractChatId(url) {
    switch (this.platform) {
      case 'claude':
        const claudeMatch = url.match(/\/chat\/([a-zA-Z0-9-_]+)/);
        return claudeMatch ? claudeMatch[1] : null;
      case 'perplexity':
        const perplexityMatch = url.match(/\/search\/[^\/]+-([a-zA-Z0-9-_]+)/);
        return perplexityMatch ? perplexityMatch[1] : null;
      case 'chatgpt':
      case 'unknown':
      default:
        const chatgptMatch = url.match(/\/c\/([a-zA-Z0-9-_]+)/);
        return chatgptMatch ? chatgptMatch[1] : null;
    }
  }
  
  addExportButton() {
    console.log('Anki Extension: Adding export button for platform:', this.platform);
    
    // Look for sidebar container - platform specific
    const sidebarSelectors = this.getSidebarSelectors();
    
    let sidebar = null;
    for (const selector of sidebarSelectors) {
      sidebar = document.querySelector(selector);
      console.log('Anki Extension: Trying selector:', selector, 'Found:', !!sidebar);
      if (sidebar) break;
    }
    
    if (!sidebar) {
      console.warn('Anki Extension: Could not find sidebar to add export button');
      // Try again after a delay, with more attempts for Claude.ai
      const retryDelay = this.getRetryDelay();
      setTimeout(() => this.addExportButton(), retryDelay);
      return;
    }
    
    console.log('Anki Extension: Found sidebar, adding export button');
    
    // Check if button already exists
    const existingButton = document.getElementById('anki-export-btn');
    if (existingButton) {
      console.log('Anki Extension: Export button already exists');
      return;
    }
    
    // Create export button
    this.exportButton = document.createElement('button');
    this.exportButton.id = 'anki-export-btn';
    this.exportButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
      </svg>
      Export to Anki
    `;
    this.exportButton.className = 'anki-export-button';
    this.exportButton.addEventListener('click', () => this.openChatSelectionModal());
    
    // Try to insert button at the top of sidebar - platform specific
    let insertTarget;
    if (this.platform === 'claude') {
      // For Claude, try multiple insertion strategies
      const topButtonsSection = sidebar.querySelector('.flex.w-full.items-center.gap-px.p-2');
      const flexContainer = sidebar.querySelector('.flex.items-center');
      
      if (topButtonsSection) {
        // Insert after the top buttons section
        topButtonsSection.parentNode.insertBefore(this.exportButton, topButtonsSection.nextSibling);
        console.log('Anki Extension: Inserted button after top buttons section');
        return;
      } else if (flexContainer) {
        // Insert after the flex container
        flexContainer.parentNode.insertBefore(this.exportButton, flexContainer.nextSibling);
        console.log('Anki Extension: Inserted button after flex container');
        return;
      } else {
        // Insert at the beginning of sidebar
        sidebar.insertBefore(this.exportButton, sidebar.firstChild);
        console.log('Anki Extension: Inserted button at beginning of sidebar');
        return;
      }
    } else {
      // For ChatGPT
      insertTarget = sidebar.querySelector('.flex.flex-col') || sidebar.firstElementChild || sidebar;
      if (insertTarget && insertTarget.parentNode) {
        insertTarget.parentNode.insertBefore(this.exportButton, insertTarget.nextSibling);
      } else if (insertTarget) {
        insertTarget.insertBefore(this.exportButton, insertTarget.firstChild);
      }
      console.log('Anki Extension: Inserted button in ChatGPT sidebar');
    }
  }
  
  openChatSelectionModal() {
    if (this.modal) {
      this.modal.remove();
    }
    
    const chats = this.detectChats();
    if (chats.length === 0) {
      const platformName = this.getPlatformName();
      alert(`No chats found. Please make sure you are on the ${platformName} main page.`);
      return;
    }
    
    this.createModal(chats);
  }
  
  createModal(chats) {
    // Create modal overlay
    this.modal = document.createElement('div');
    this.modal.id = 'anki-chat-modal';
    this.modal.className = 'anki-modal-overlay';
    
    this.modal.innerHTML = `
      <div class="anki-modal-content">
        <div class="anki-modal-header">
          <h2>Create Anki Flashcards</h2>
          <button id="anki-modal-close" class="anki-close-btn">&times;</button>
        </div>
        <div class="anki-modal-body">
          <div class="anki-section">
            <h3>Select Chats</h3>
            <div class="anki-chat-list">
              ${chats.map(chat => `
                <div class="anki-chat-item">
                  <label class="anki-chat-label">
                    <input type="checkbox" class="anki-chat-checkbox" data-chat-id="${chat.id}" data-chat-url="${chat.url}">
                    <span class="anki-chat-title">${this.escapeHtml(chat.title)}</span>
                  </label>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="anki-section">
            <h3>Customize Flashcard Generation</h3>
            <div class="anki-prompt-options">
              <div class="anki-form-group">
                <label for="anki-topic-focus">Topic Focus (optional)</label>
                <input type="text" id="anki-topic-focus" placeholder="e.g., JavaScript functions, Machine Learning concepts, History dates">
                <small>Specify what topics you want to focus on from the conversation</small>
              </div>
              
              <div class="anki-form-group">
                <label for="anki-question-type">Question Type</label>
                <select id="anki-question-type">
                  <option value="mixed">Mixed (Definitions, Examples, Applications)</option>
                  <option value="definitions">Definitions only</option>
                  <option value="examples">Examples and use cases</option>
                  <option value="applications">Practical applications</option>
                  <option value="comparisons">Comparisons and differences</option>
                  <option value="steps">Step-by-step processes</option>
                  <option value="facts">Facts and details</option>
                </select>
              </div>
              
              <div class="anki-form-group">
                <label for="anki-difficulty">Difficulty Level</label>
                <select id="anki-difficulty">
                  <option value="mixed">Mixed levels</option>
                  <option value="beginner">Beginner friendly</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div class="anki-form-group">
                <label for="anki-card-count">Number of Cards</label>
                <select id="anki-card-count">
                  <option value="auto">Auto (5-20 based on content)</option>
                  <option value="5">5 cards</option>
                  <option value="10">10 cards</option>
                  <option value="15">15 cards</option>
                  <option value="20">20 cards</option>
                  <option value="25">25 cards</option>
                </select>
              </div>
              
              <div class="anki-form-group">
                <label for="anki-custom-instructions">Additional Instructions (optional)</label>
                <textarea id="anki-custom-instructions" rows="3" placeholder="e.g., Focus on code examples, Include mnemonics, Use simple language"></textarea>
              </div>
              
              <div class="anki-form-group">
                <button id="anki-preview-prompt" class="anki-btn anki-btn-secondary">Preview Prompt</button>
              </div>
            </div>
          </div>
        </div>
        <div class="anki-modal-footer">
          <button id="anki-select-all" class="anki-btn anki-btn-secondary">Select All Chats</button>
          <button id="anki-export-selected" class="anki-btn anki-btn-primary">Generate Flashcards</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.modal);
    
    // Add event listeners
    document.getElementById('anki-modal-close').addEventListener('click', () => this.closeModal());
    document.getElementById('anki-select-all').addEventListener('click', () => this.selectAllChats());
    document.getElementById('anki-export-selected').addEventListener('click', () => this.exportSelectedChats());
    document.getElementById('anki-preview-prompt').addEventListener('click', () => this.previewPrompt());
    
    // Close modal when clicking outside
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });
  }
  
  closeModal() {
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
  
  selectAllChats() {
    const checkboxes = document.querySelectorAll('.anki-chat-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = true;
    });
  }
  
  async exportSelectedChats() {
    const selectedCheckboxes = document.querySelectorAll('.anki-chat-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
      alert('Please select at least one chat to export.');
      return;
    }
    
    const selectedChats = Array.from(selectedCheckboxes).map(checkbox => ({
      id: checkbox.dataset.chatId,
      url: checkbox.dataset.chatUrl
    }));
    
    // Store current prompt settings for use during processing
    this.currentPromptSettings = this.getUserPromptSettings();
    console.log('Storing prompt settings for processing:', this.currentPromptSettings);
    
    this.closeModal();
    
    // Show processing indicator
    this.showProcessingIndicator();
    
    try {
      await this.processSelectedChats(selectedChats);
    } catch (error) {
      console.error('Error processing chats:', error);
      alert('Error processing chats. Please try again.');
    } finally {
      this.hideProcessingIndicator();
    }
  }
  
  async processSelectedChats(selectedChats) {
    const flashcardData = [];
    
    for (const chat of selectedChats) {
      try {
        console.log(`Processing chat: ${chat.id}`);
        
        // Navigate to chat
        await this.navigateToChat(chat.url);
        
        // Wait for chat to load
        await this.waitForChatLoad();
        
        // Send flashcard generation prompt
        const csvData = await this.generateFlashcards();
        
        if (csvData) {
          flashcardData.push({
            chatId: chat.id,
            chatName: chat.name || `Chat ${chat.id}`,
            chatUrl: chat.url || window.location.href,
            csvData: csvData,
            timestamp: new Date().toISOString(),
            flashcardCount: csvData.split('\n').filter(line => line.trim()).length
          });
          console.log(`Successfully processed chat ${chat.id}`);
        } else {
          console.warn(`No CSV data generated for chat ${chat.id}`);
        }
        
        // Small delay between chats
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`Error processing chat ${chat.id}:`, error);
        // Continue with other chats even if one fails
      }
    }
    
    console.log(`Processing complete. Generated data for ${flashcardData.length} chats`);
    
    // Store flashcard data
    await this.storeFlashcardData(flashcardData);
    
    // Only open config page if we have data
    if (flashcardData.length > 0) {
      console.log('Opening configuration page with generated data...');
      this.openConfigurationPage();
    } else {
      console.warn('No flashcard data generated. Not opening config page.');
      alert('No flashcard data was generated. Please check the console for errors.');
    }
  }
  
  async navigateToChat(url) {
    // Prevent navigation if already on the target URL
    if (window.location.href === url) {
      console.log('Already on target URL, skipping navigation');
      return Promise.resolve();
    }
    
    console.log(`Navigating to chat for ${this.platform}:`, url);
    
    // Platform-specific navigation
    if (this.platform === 'claude') {
      // For Claude.ai, we need to click on the chat link in the sidebar
      // because URL changes don't work properly
      const chatId = this.extractChatId(url);
      if (chatId) {
        console.log('Looking for Claude chat link with ID:', chatId);
        
        // Try to find the chat link in the sidebar
        const chatLink = document.querySelector(`a[href*="/chat/${chatId}"]`);
        if (chatLink) {
          console.log('Found Claude chat link, clicking:', chatLink);
          chatLink.click();
          
          // Wait for navigation to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify we're on the correct page
          if (window.location.href.includes(chatId)) {
            console.log('Claude navigation successful');
            return Promise.resolve();
          } else {
            console.log('Claude navigation failed, falling back to URL change');
          }
        } else {
          console.log('Could not find Claude chat link, falling back to URL change');
        }
      }
      
      // Fallback to URL change for Claude
      window.location.href = url;
      return new Promise(resolve => {
        const checkUrl = () => {
          if (window.location.href.includes(chatId)) {
            resolve();
          } else {
            setTimeout(checkUrl, 100);
          }
        };
        setTimeout(checkUrl, 1000);
      });
    } else if (this.platform === 'perplexity') {
      // For Perplexity.ai, we need to click on the search link in the sidebar
      // similar to Claude.ai
      const chatId = this.extractChatId(url);
      if (chatId) {
        console.log('Looking for Perplexity search link with ID:', chatId);
        
        // Try to find the search link in the sidebar
        const searchLink = document.querySelector(`a[href*="/search/"][href*="${chatId}"]`);
        if (searchLink) {
          console.log('Found Perplexity search link, clicking:', searchLink);
          searchLink.click();
          
          // Wait for navigation to complete
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify we're on the correct page
          if (window.location.href.includes(chatId)) {
            console.log('Perplexity navigation successful');
            return Promise.resolve();
          } else {
            console.log('Perplexity navigation failed, falling back to URL change');
          }
        } else {
          console.log('Could not find Perplexity search link, falling back to URL change');
        }
      }
      
      // Fallback to URL change for Perplexity
      window.location.href = url;
      return new Promise(resolve => {
        const checkUrl = () => {
          if (window.location.href.includes(chatId)) {
            resolve();
          } else {
            setTimeout(checkUrl, 100);
          }
        };
        setTimeout(checkUrl, 1000);
      });
    } else {
      // For ChatGPT and other platforms, use the existing logic
      try {
        // First try using history API if possible
        if (url.includes(window.location.origin)) {
          const path = url.replace(window.location.origin, '');
          window.history.pushState({}, '', path);
          
          // Dispatch a popstate event to trigger any route handlers
          window.dispatchEvent(new PopStateEvent('popstate'));
          
          // Wait for navigation to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // If URL didn't change, fall back to location.href
          if (window.location.href !== url) {
            console.log('History API navigation failed, using location.href');
            window.location.href = url;
          }
        } else {
          // External URL, use location.href
          window.location.href = url;
        }
        
        return new Promise(resolve => {
          const checkUrl = () => {
            if (window.location.href === url) {
              resolve();
            } else {
              setTimeout(checkUrl, 100);
            }
          };
          checkUrl();
        });
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to direct navigation
        window.location.href = url;
        return Promise.resolve();
      }
    }
  }
  
  async waitForChatLoad() {
    return new Promise(resolve => {
      console.log(`Waiting for ${this.platform} chat to load...`);
      
      const checkLoad = () => {
        const inputBox = this.findInputBox();
        
        if (this.platform === 'claude') {
          // For Claude, also check that we're not on the new chat page
          const isNewChatPage = window.location.href.includes('/new') || 
                               window.location.href.endsWith('/recents') ||
                               document.querySelector('[data-testid="new-chat"]');
          
          if (inputBox && !isNewChatPage) {
            console.log('Claude chat loaded and ready');
            resolve();
          } else {
            setTimeout(checkLoad, 200);
          }
        } else {
          // For other platforms, just check for input box
          if (inputBox) {
            console.log(`${this.platform} chat loaded and ready`);
            resolve();
          } else {
            setTimeout(checkLoad, 100);
          }
        }
      };
      checkLoad();
    });
  }
  
  findInputBox() {
    const inputSelectors = this.getInputSelectors();
    
    for (const selector of inputSelectors) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) {
        console.log(`Found input box with selector: ${selector}`);
        return element;
      }
    }
    
    console.warn('No input box found for platform:', this.platform);
    return null;
  }
  
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0'
    );
  }
  
  async generateFlashcards() {
    console.log(`Starting flashcard generation for ${this.platform}...`);
    
    const inputBox = this.findInputBox();
    if (!inputBox) {
      throw new Error(`Could not find input box for ${this.platform}`);
    }
    
    console.log(`Found input box for ${this.platform}:`, inputBox);
    
    // Generate prompt using current form values when actually generating flashcards
    const prompt = await this.generateCustomPrompt();
    
    // Clear input and add prompt gently
    this.gentleClearElement(inputBox);
    
    // Wait a moment for clearing to take effect
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use gentle text insertion
    this.insertTextIntoContentEditable(inputBox, prompt);
    
    // Wait for text to be inserted
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify text was inserted
    const currentContent = inputBox.textContent || inputBox.value || '';
    if (!currentContent.includes('flashcards')) {
      console.warn('Text insertion may have failed, trying alternative method...');
      
      // Alternative method: Direct gentle insertion
      inputBox.focus();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try using clipboard API gently
      try {
        await navigator.clipboard.writeText(prompt);
        inputBox.focus();
        document.execCommand('paste');
      } catch (e) {
        console.warn('Clipboard method failed, using gentle direct insertion');
        this.gentleTextInsertion(inputBox, prompt);
      }
    }
    
    // Wait for user confirmation
    const confirmed = confirm('A flashcard generation prompt has been prepared. Click OK to send it, or Cancel to abort.');
    if (!confirmed) {
      return null;
    }
    
    // Send the prompt
    await this.sendPrompt(inputBox);
    
    // Wait for response with better error handling
    try {
      const response = await this.waitForResponse();
      
      if (!response || response.length === 0) {
        console.warn('No response received from ChatGPT');
        return null;
      }
      
      console.log('Response received, length:', response.length);
      return this.extractCSVFromResponse(response);
    } catch (error) {
      console.error('Error waiting for response:', error);
      return null;
    }
  }
  
  simulateTyping(element, text) {
    console.log('Simulating typing - gentle approach');
    element.focus();
    
    // Use gentle clearing to avoid triggering navigation
    this.gentleClearElement(element);
    
    // Wait a bit for clearing to take effect
    setTimeout(() => {
      if (element.contentEditable === 'true') {
        this.insertTextIntoContentEditable(element, text);
      } else {
        element.value = text;
        // Only trigger essential events
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 100);
  }
  
  gentleClearElement(element) {
    console.log('Gentle clearing element');
    if (element.contentEditable === 'true') {
      // For contenteditable elements - minimal clearing
      element.innerHTML = '';
      // Don't trigger aggressive events that might cause reload
    } else {
      // For regular inputs
      element.value = '';
    }
  }
  
  clearElement(element) {
    if (element.contentEditable === 'true') {
      // For contenteditable elements
      element.innerHTML = '';
      element.textContent = '';
      
      // Remove placeholder
      const placeholder = element.querySelector('[data-placeholder]');
      if (placeholder) {
        placeholder.remove();
      }
      
      // Trigger events
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      element.dispatchEvent(new Event('focus', { bubbles: true }));
    } else {
      // For regular inputs
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  
  insertTextIntoContentEditable(element, text) {
    console.log('Inserting text into element:', element, text);
    
    // Check if it's a textarea or input element first
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      console.log('Detected textarea/input, using direct value assignment');
      element.value = text;
      element.focus();
      element.setSelectionRange(text.length, text.length);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Textarea insertion complete, content:', element.value);
      return;
    }
    
    // Focus first but don't trigger unnecessary events
    element.focus();
    
    // Method 1: For ProseMirror specifically (minimal events)
    if (element.classList.contains('ProseMirror')) {
      console.log('Using ProseMirror method');
      
      // Clear existing content gently
      element.innerHTML = '';
      
      // Create a proper paragraph element with text
      const p = document.createElement('p');
      p.textContent = text;
      element.appendChild(p);
      
      // Place cursor at end
      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger only essential events to prevent reload
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      
      console.log('ProseMirror insertion complete, content:', element.textContent);
      return;
    }
    
    // Method 2: Gentle clipboard approach
    if (navigator.clipboard && navigator.clipboard.writeText) {
      console.log('Using clipboard API method');
      
      try {
        // Don't clear content aggressively
        element.focus();
        
        // Use clipboard API without clearing
        navigator.clipboard.writeText(text).then(() => {
          // Simple paste without aggressive clearing
          document.execCommand('paste');
          console.log('Clipboard insertion complete');
        }).catch(err => {
          console.warn('Clipboard method failed:', err);
          this.gentleTextInsertion(element, text);
        });
        return;
      } catch (err) {
        console.warn('Clipboard API not supported:', err);
      }
    }
    
    // Method 3: Gentle execCommand approach
    if (document.execCommand) {
      console.log('Using execCommand method');
      
      try {
        element.focus();
        // Don't clear aggressively, just insert
        document.execCommand('insertText', false, text);
        
        console.log('execCommand insertion complete');
        return;
      } catch (err) {
        console.warn('execCommand method failed:', err);
      }
    }
    
    // Method 4: Gentle direct insertion
    this.gentleTextInsertion(element, text);
  }
  
  gentleTextInsertion(element, text) {
    console.log('Using gentle insertion method');
    
    // Check if it's a textarea or input element
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      console.log('Inserting text into textarea/input element');
      
      // Clear existing content and set new value
      element.value = text;
      
      // Set cursor at end
      element.focus();
      element.setSelectionRange(text.length, text.length);
      
      // Trigger essential events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('Gentle insertion complete, content:', element.value);
    } else {
      console.log('Inserting text into contenteditable element');
      
      // Clear existing content gently
      element.innerHTML = '';
      
      // Create paragraph element
      const p = document.createElement('p');
      p.textContent = text;
      element.appendChild(p);
      
      // Set cursor at end
      const range = document.createRange();
      range.selectNodeContents(p);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      
      // Trigger only essential events to prevent reload
      element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      
      console.log('Gentle insertion complete, content:', element.textContent);
    }
  }
  
  async sendPrompt(inputBox) {
    console.log(`Sending prompt for ${this.platform}...`);
    
    // Look for send button
    const sendButton = this.findSendButton();
    if (sendButton) {
      console.log(`Found send button for ${this.platform}:`, sendButton);
      sendButton.click();
    } else {
      console.log(`No send button found for ${this.platform}, using Enter key`);
      // Fallback: simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      inputBox.dispatchEvent(enterEvent);
    }
  }
  
  findSendButton() {
    const buttonSelectors = this.getSendButtonSelectors();
    
    console.log('Searching for send button...');
    
    for (const selector of buttonSelectors) {
      try {
        const buttons = document.querySelectorAll(selector);
        for (const button of buttons) {
          if (button && this.isElementVisible(button)) {
            console.log(`Found send button with selector: ${selector}`, button);
            return button;
          }
        }
      } catch (e) {
        console.warn(`Failed to query selector: ${selector}`, e);
      }
    }
    
    // Fallback: Look for buttons near the input box
    const inputBox = this.findInputBox();
    if (inputBox) {
      console.log('Searching for buttons near input box...');
      
      // Check parent containers
      const containers = [
        inputBox.closest('form'),
        inputBox.closest('div'),
        inputBox.parentElement,
        inputBox.parentElement?.parentElement
      ];
      
      for (const container of containers) {
        if (container) {
          const buttons = container.querySelectorAll('button');
          console.log(`Found ${buttons.length} buttons in container`);
          
          for (const button of buttons) {
            if (this.isElementVisible(button)) {
              // Check if button looks like a send button
              const buttonText = button.textContent?.toLowerCase() || '';
              const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';
              const className = button.className?.toLowerCase() || '';
              
              if (buttonText.includes('send') || 
                  ariaLabel.includes('send') || 
                  className.includes('send') ||
                  button.type === 'submit') {
                console.log('Found send button by content/attributes:', button);
                return button;
              }
            }
          }
          
          // If no obvious send button, return the last visible button
          const visibleButtons = Array.from(buttons).filter(btn => this.isElementVisible(btn));
          if (visibleButtons.length > 0) {
            const lastButton = visibleButtons[visibleButtons.length - 1];
            console.log('Using last visible button as send button:', lastButton);
            return lastButton;
          }
        }
      }
    }
    
    console.log('No send button found');
    return null;
  }
  
  async waitForResponse() {
    return new Promise((resolve) => {
      const platformName = this.getPlatformName();
      console.log(`Waiting for ${platformName} response...`);
      
      let previousResponseLength = 0;
      let stableCount = 0;
      let maxWaitTime = 60000; // 60 seconds max wait
      let startTime = Date.now();
      
      const checkForResponse = () => {
        // Check if we've exceeded max wait time
        if (Date.now() - startTime > maxWaitTime) {
          console.log('Max wait time exceeded, returning current response');
          resolve(this.getCurrentResponse());
          return;
        }
        
        // Platform-specific streaming detection
        if (this.platform === 'claude') {
          // Claude.ai specific: Check for streaming attribute
          const streamingElement = document.querySelector('[data-is-streaming="true"]');
          if (streamingElement) {
            console.log('Claude is still streaming, waiting...');
            setTimeout(checkForResponse, 1000);
            return;
          }
          
          // Additional check: Look for any elements that might be streaming
          const allStreamingElements = document.querySelectorAll('[data-is-streaming]');
          const hasActiveStreaming = Array.from(allStreamingElements).some(el => 
            el.getAttribute('data-is-streaming') === 'true'
          );
          
          if (hasActiveStreaming) {
            console.log('Claude has active streaming elements, waiting...');
            setTimeout(checkForResponse, 1000);
            return;
          }
          
          // Check if Claude is still generating (no streaming attribute but response is growing)
          const claudeResponseSelectors = [
            '.font-claude-message',
            '[data-is-streaming="false"]',
            '.font-claude-message div div',
            '.font-claude-message .grid-cols-1'
          ];
          
          let latestResponse = null;
          for (const selector of claudeResponseSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              latestResponse = elements[elements.length - 1];
              break;
            }
          }
          
          if (latestResponse && latestResponse.textContent.trim()) {
            const currentResponseLength = latestResponse.textContent.trim().length;
            
            // For Claude, also check if response is still growing
            if (currentResponseLength > previousResponseLength) {
              console.log(`Claude response growing: ${currentResponseLength} chars`);
              previousResponseLength = currentResponseLength;
              stableCount = 0;
              setTimeout(checkForResponse, 1000);
              return;
            } else {
              // Response hasn't grown, check if it's stable
              stableCount++;
              if (stableCount >= 5) { // Wait longer for Claude to be sure
                console.log('Claude response appears complete, resolving');
                resolve(latestResponse.textContent.trim());
                return;
              } else {
                console.log(`Claude response stable for ${stableCount} seconds, waiting...`);
                setTimeout(checkForResponse, 1000);
                return;
              }
            }
          }
        } else if (this.platform === 'perplexity') {
          // Perplexity.ai specific logic
          // Check for streaming animations (fade-in classes indicate streaming)
          const streamingElements = document.querySelectorAll('.animate-in.fade-in-25');
          if (streamingElements.length > 0) {
            console.log('Perplexity is still streaming (found animate-in elements), waiting...');
            setTimeout(checkForResponse, 1000);
            return;
          }
          
          const responseSelectors = [
            '.prose.text-pretty',
            '.prose',
            '[id^="markdown-content-"]',
            '.relative.font-sans.text-base',
            '.min-w-0.break-words'
          ];
          
          let latestResponse = null;
          for (const selector of responseSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              latestResponse = elements[elements.length - 1];
              break;
            }
          }
          
          if (latestResponse && latestResponse.textContent.trim()) {
            const currentResponseLength = latestResponse.textContent.trim().length;
            
            // Check if response is still growing (streaming)
            if (currentResponseLength > previousResponseLength) {
              console.log(`Perplexity response growing: ${currentResponseLength} chars`);
              previousResponseLength = currentResponseLength;
              stableCount = 0;
              setTimeout(checkForResponse, 1000);
              return;
            } else {
              // Response hasn't grown, check if it's stable
              stableCount++;
              if (stableCount >= 3) { // Less wait time for Perplexity
                console.log('Perplexity response appears complete, resolving');
                resolve(latestResponse.textContent.trim());
                return;
              } else {
                console.log(`Perplexity response stable for ${stableCount} seconds, waiting...`);
                setTimeout(checkForResponse, 1000);
                return;
              }
            }
          }
        } else {
          // ChatGPT specific logic (existing)
          const responseSelectors = [
            '[data-message-author-role="assistant"]',
            '.message.assistant',
            '[class*="assistant"]',
            '.response'
          ];
          
          let latestResponse = null;
          for (const selector of responseSelectors) {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              latestResponse = elements[elements.length - 1];
              break;
            }
          }
          
          if (latestResponse && latestResponse.textContent.trim()) {
            const currentResponseLength = latestResponse.textContent.trim().length;
            
            // Check if response is still growing (streaming)
            if (currentResponseLength > previousResponseLength) {
              console.log(`Response growing: ${currentResponseLength} chars`);
              previousResponseLength = currentResponseLength;
              stableCount = 0;
              setTimeout(checkForResponse, 1000);
              return;
            } else {
              // Response hasn't grown, check if it's stable
              stableCount++;
              if (stableCount >= 3) {
                // Response has been stable for 3 seconds, it's complete
                console.log('Response appears complete, resolving');
                resolve(latestResponse.textContent.trim());
                return;
              }
            }
          }
        }
        
        // Continue waiting
        setTimeout(checkForResponse, 1000);
      };
      
      checkForResponse();
    });
  }
  
  getCurrentResponse() {
    const responseSelectors = this.getResponseSelectors();
    
    for (const selector of responseSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        const latestResponse = elements[elements.length - 1];
        if (latestResponse && latestResponse.textContent.trim()) {
          return latestResponse.textContent.trim();
        }
      }
    }
    
    return '';
  }
  
  extractCSVFromResponse(response) {
    // Try to extract CSV data from response
    const lines = response.split('\n');
    const csvLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine.includes(',')) {
        // Basic CSV validation
        const parts = trimmedLine.split(',');
        if (parts.length >= 3) {
          csvLines.push(trimmedLine);
        }
      }
    }
    
    if (csvLines.length === 0) {
      console.warn('No valid CSV found in response, attempting retry...');
      return null;
    }
    
    return csvLines.join('\n');
  }
  
  async storeFlashcardData(newFlashcardData) {
    return new Promise((resolve) => {
      // Get existing data first
      chrome.storage.local.get(['flashcardData'], (result) => {
        let existingData = result.flashcardData || [];
        
        // Filter out any existing data with the same chatId to avoid duplicates
        const existingChatIds = new Set(existingData.map(item => item.chatId));
        const uniqueNewData = newFlashcardData.filter(item => !existingChatIds.has(item.chatId));
        
        // Append new data to existing data
        const allData = [...existingData, ...uniqueNewData];
        
        console.log(`Storing ${uniqueNewData.length} new chats. Total: ${allData.length} chats`);
        
        chrome.storage.local.set({ flashcardData: allData }, () => {
          resolve();
        });
      });
    });
  }
  
  openConfigurationPage() {
    console.log('Opening configuration page...');
    
    // Check if we're still on ChatGPT and potentially waiting for responses
    if (window.location.href.includes('chatgpt.com') || window.location.href.includes('chat.openai.com') || window.location.href.includes('claude.ai')) {
      // Add a longer delay to ensure we're not interrupting response streaming
      setTimeout(() => {
        console.log('Delayed opening of config page after ensuring response completion');
        const configUrl = chrome.runtime.getURL('config.html');
        console.log('Config URL:', configUrl);
        
        // Open in new tab to avoid navigating away from current chat
        window.open(configUrl, '_blank');
      }, 3000);
    } else {
      // We're already on a different page, open immediately
      const configUrl = chrome.runtime.getURL('config.html');
      console.log('Config URL:', configUrl);
      window.open(configUrl, '_blank');
    }
  }
  
  showProcessingIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'anki-processing-indicator';
    indicator.className = 'anki-processing-indicator';
    indicator.innerHTML = `
      <div class="anki-spinner"></div>
      <div class="anki-processing-text">Processing chats for flashcard generation...</div>
    `;
    
    document.body.appendChild(indicator);
  }
  
  hideProcessingIndicator() {
    const indicator = document.getElementById('anki-processing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Re-detect chats when DOM changes
          this.detectChats();
        }
      });
    });
    
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  async generateCustomPrompt() {
    console.log('generateCustomPrompt called');
    
    try {
      // Get custom prompt from settings
      const result = await chrome.storage.local.get(['settings']);
      const customPrompt = result.settings?.customPrompt;
      
      if (customPrompt) {
        console.log('Using custom prompt from settings');
        
        // Get modal form settings (if modal is open)
        const modalSettings = this.currentPromptSettings || this.getUserPromptSettings();
        
        // Start with the custom prompt
        let finalPrompt = customPrompt;
        
        // Add modal customizations if available
        if (modalSettings) {
          const modalCustomization = this.getCustomizationText(modalSettings);
          if (modalCustomization.trim()) {
            finalPrompt += `\n\nAdditional Instructions:\n${modalCustomization}`;
          }
        }
        
        console.log('Final prompt generated from custom prompt + modal settings');
        return finalPrompt;
      } else {
        console.log('No custom prompt found, using default generation');
        // Fallback to original method
        return this.generateDefaultPrompt();
      }
    } catch (error) {
      console.error('Error generating custom prompt:', error);
      // Fallback to original method
      return this.generateDefaultPrompt();
    }
  }
  
  generateDefaultPrompt() {
    console.log('generateDefaultPrompt called');
    
    // Use stored settings if available (from modal submission), otherwise read current form
    const userSettings = this.currentPromptSettings || this.getUserPromptSettings();
    console.log('Using prompt settings:', userSettings);
    
    const basePrompt = this.getBasePromptTemplate();
    const customization = this.getCustomizationText(userSettings);
    
    const finalPrompt = `${basePrompt}\n\n${customization}`;
    console.log('Final prompt generated:', finalPrompt);
    
    return finalPrompt;
  }
  
  getSelectedChatContent() {
    // Get content from selected chats
    const selectedChats = Array.from(this.selectedChats);
    let chatContent = '';
    
    selectedChats.forEach(chatId => {
      const chatLink = document.querySelector(`a[href*="${chatId}"]`);
      if (chatLink) {
        const chatTitle = chatLink.textContent?.trim() || 'Untitled Chat';
        chatContent += `Chat: ${chatTitle}\n`;
        chatContent += `Content: [Chat content would be extracted from the conversation]\n\n`;
      }
    });
    
    if (!chatContent) {
      chatContent = 'No specific chat selected. Please select chats to process.';
    }
    
    return chatContent;
  }
  
  getSelectedChatTitles() {
    // Get titles from selected chats
    const selectedChats = Array.from(this.selectedChats);
    const titles = [];
    
    selectedChats.forEach(chatId => {
      const chatLink = document.querySelector(`a[href*="${chatId}"]`);
      if (chatLink) {
        const chatTitle = chatLink.textContent?.trim() || 'Untitled Chat';
        titles.push(chatTitle);
      }
    });
    
    return titles.length > 0 ? titles : ['Current Conversation'];
  }
  
  getUserPromptSettings() {
    // Get settings from modal if it exists, otherwise use defaults
    const settings = {
      topicFocus: '',
      questionType: 'mixed',
      difficulty: 'mixed',
      cardCount: 'auto',
      customInstructions: ''
    };
    
    try {
      const topicFocusEl = document.getElementById('anki-topic-focus');
      const questionTypeEl = document.getElementById('anki-question-type');
      const difficultyEl = document.getElementById('anki-difficulty');
      const cardCountEl = document.getElementById('anki-card-count');
      const customInstructionsEl = document.getElementById('anki-custom-instructions');
      
      if (topicFocusEl) {
        settings.topicFocus = topicFocusEl.value.trim();
        console.log('Topic focus:', settings.topicFocus);
      }
      
      if (questionTypeEl) {
        settings.questionType = questionTypeEl.value;
        console.log('Question type:', settings.questionType);
      }
      
      if (difficultyEl) {
        settings.difficulty = difficultyEl.value;
        console.log('Difficulty:', settings.difficulty);
      }
      
      if (cardCountEl) {
        settings.cardCount = cardCountEl.value;
        console.log('Card count:', settings.cardCount);
      }
      
      if (customInstructionsEl) {
        settings.customInstructions = customInstructionsEl.value.trim();
        console.log('Custom instructions:', settings.customInstructions);
      }
    } catch (error) {
      console.warn('Error reading prompt settings:', error);
    }
    
    console.log('Final settings:', settings);
    return settings;
  }
  
  getBasePromptTemplate() {
    return `Based on our conversation, I need you to create flashcards in CSV format. Please analyze the conversation and create comprehensive flashcards covering key concepts, definitions, and important details.

CRITICAL REQUIREMENTS AND FORMATTING INSTRUCTIONS:
- Output ONLY CSV data in your response - no other text, explanations, or formatting
- Do NOT use markdown code blocks (no backticks, no triple backticks with csv, no code formatting)
- Do NOT add any introductory text like "Here are the flashcards:" or "Based on our conversation:"
- Do NOT add any explanatory text before or after the CSV data
- Format: Topic,Question,Answer
- Each line must be a complete flashcard in CSV format
- Questions should test understanding, not just recall
- Answers should be concise but complete
- Topics should be categorized (e.g., "Programming", "Science", "General")
- Start your response immediately with the first CSV line
- End your response with the last CSV line

IMPORTANT: Your entire response should be raw CSV data that can be directly imported into a spreadsheet. Do not wrap it in markdown code blocks or add any other formatting.

EXAMPLE FORMAT (this is what your response should look like):
Programming,What is a variable in programming?,A variable is a container that stores data values that can be changed during program execution
Science,What is photosynthesis?,The process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen
General,What is the capital of France?,Paris`;
  }
  
  getCustomizationText(settings) {
    console.log('getCustomizationText called with settings:', settings);
    let customization = 'CUSTOMIZATION INSTRUCTIONS:\n';
    
    // Topic focus
    if (settings.topicFocus) {
      customization += `- Focus specifically on: ${settings.topicFocus}\n`;
    }
    
    // Question type
    const questionTypes = {
      'mixed': 'Create a mix of definitions, examples, and applications',
      'definitions': 'Focus on definitions and "What is..." questions',
      'examples': 'Focus on examples and use cases',
      'applications': 'Focus on practical applications and "How to..." questions',
      'comparisons': 'Focus on comparisons and differences between concepts',
      'steps': 'Focus on step-by-step processes and procedures',
      'facts': 'Focus on facts, details, and specific information'
    };
    customization += `- Question style: ${questionTypes[settings.questionType]}\n`;
    
    // Difficulty level
    const difficultyLevels = {
      'mixed': 'Mix of beginner, intermediate, and advanced questions',
      'beginner': 'Use simple language and basic concepts',
      'intermediate': 'Moderate complexity with some technical terms',
      'advanced': 'Complex questions with technical depth'
    };
    customization += `- Difficulty level: ${difficultyLevels[settings.difficulty]}\n`;
    
    // Card count
    if (settings.cardCount === 'auto') {
      customization += '- Create 5-20 flashcards based on conversation content\n';
    } else {
      customization += `- Create exactly ${settings.cardCount} flashcards\n`;
    }
    
    // Custom instructions
    if (settings.customInstructions) {
      customization += `- Additional instructions: ${settings.customInstructions}\n`;
    }
    
    console.log('Generated customization text:', customization);
    return customization;
  }
  
  async previewPrompt() {
    console.log('Generating preview prompt...');
    const prompt = await this.generateCustomPrompt();
    console.log('Generated prompt:', prompt);
    
    // Create preview modal
    const previewModal = document.createElement('div');
    previewModal.className = 'anki-modal-overlay';
    previewModal.id = 'anki-preview-modal';
    
    const escapedPrompt = this.escapeHtml(prompt);
    const promptForClipboard = prompt.replace(/"/g, '\\"').replace(/`/g, '\\`');
    
    previewModal.innerHTML = `
      <div class="anki-modal-content anki-preview-modal">
        <div class="anki-modal-header">
          <h2>Prompt Preview</h2>
          <button class="anki-close-btn" id="anki-preview-close-x">&times;</button>
        </div>
        <div class="anki-modal-body">
          <div class="anki-prompt-preview">
            <pre>${escapedPrompt}</pre>
          </div>
        </div>
        <div class="anki-modal-footer">
          <button class="anki-btn anki-btn-secondary" id="anki-preview-close">Close</button>
          <button class="anki-btn anki-btn-primary" id="anki-preview-copy">Copy to Clipboard</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(previewModal);
    
    // Add event listeners for buttons
    const closeBtn = document.getElementById('anki-preview-close');
    const closeXBtn = document.getElementById('anki-preview-close-x');
    const copyBtn = document.getElementById('anki-preview-copy');
    
    const closeModal = () => {
      previewModal.remove();
    };
    
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(prompt);
        // Show feedback
        copyBtn.textContent = 'Copied!';
        copyBtn.style.backgroundColor = '#10a37f';
        setTimeout(() => {
          copyBtn.textContent = 'Copy to Clipboard';
          copyBtn.style.backgroundColor = '';
        }, 2000);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = prompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = 'Copy to Clipboard';
        }, 2000);
      }
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (closeXBtn) closeXBtn.addEventListener('click', closeModal);
    if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
    
    // Close when clicking outside
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        closeModal();
      }
    });
  }
  
  // Debug functions for testing
  debugFindInputBox() {
    const inputBox = this.findInputBox();
    console.log('Found input box:', inputBox);
    if (inputBox) {
      console.log('Input box properties:', {
        id: inputBox.id,
        className: inputBox.className,
        tagName: inputBox.tagName,
        contentEditable: inputBox.contentEditable,
        placeholder: inputBox.placeholder,
        value: inputBox.value,
        textContent: inputBox.textContent,
        innerHTML: inputBox.innerHTML
      });
    }
    return inputBox;
  }
  
  debugTestTyping(text = 'Test message') {
    const inputBox = this.debugFindInputBox();
    if (inputBox) {
      console.log('Testing typing with text:', text);
      console.log('Using gentle insertion to prevent page reload');
      this.insertTextIntoContentEditable(inputBox, text);
      setTimeout(() => {
        console.log('After typing - content:', inputBox.textContent || inputBox.value);
      }, 1000);
    }
  }
  
  debugFindSendButton() {
    const sendButton = this.findSendButton();
    console.log('Found send button:', sendButton);
    if (sendButton) {
      console.log('Send button properties:', {
        tagName: sendButton.tagName,
        className: sendButton.className,
        textContent: sendButton.textContent,
        ariaLabel: sendButton.ariaLabel,
        type: sendButton.type
      });
    }
    return sendButton;
  }
  
  debugTestResponseWaiting() {
    console.log('Testing response waiting...');
    console.log('Send a message in ChatGPT and this will monitor the response');
    
    this.waitForResponse().then(response => {
      console.log('Response received:', response);
      console.log('Response length:', response.length);
      
      // Test CSV extraction
      const csvData = this.extractCSVFromResponse(response);
      if (csvData) {
        console.log('CSV data extracted:', csvData);
      } else {
        console.log('No CSV data found in response');
      }
    }).catch(error => {
      console.error('Error waiting for response:', error);
    });
  }
  
  async debugTestPromptGeneration() {
    console.log('=== Testing Prompt Generation ===');
    
    // Test with default settings
    console.log('--- Testing with default settings ---');
    const defaultPrompt = await this.generateCustomPrompt();
    console.log('Default prompt length:', defaultPrompt.length);
    console.log('Default prompt preview:', defaultPrompt.substring(0, 200) + '...');
    
    // Test reading form elements
    console.log('\n--- Testing form element reading ---');
    const elements = {
      'anki-topic-focus': document.getElementById('anki-topic-focus'),
      'anki-question-type': document.getElementById('anki-question-type'),
      'anki-difficulty': document.getElementById('anki-difficulty'),
      'anki-card-count': document.getElementById('anki-card-count'),
      'anki-custom-instructions': document.getElementById('anki-custom-instructions')
    };
    
    Object.keys(elements).forEach(id => {
      const element = elements[id];
      if (element) {
        console.log(`✓ Found ${id}: ${element.value || element.textContent}`);
      } else {
        console.log(`✗ Missing ${id}`);
      }
    });
    
    // Test settings reading
    console.log('\n--- Testing settings reading ---');
    const settings = this.getUserPromptSettings();
    console.log('Current settings:', settings);
    
    // Test customization text generation
    console.log('\n--- Testing customization text ---');
    const customization = this.getCustomizationText(settings);
    console.log('Customization text:', customization);
    
    console.log('\n=== Prompt Generation Test Complete ===');
  }
}

// Initialize the extension with error handling
console.log('Anki Extension: Starting extension initialization...');

try {
  console.log('Anki Extension: About to create ChatToAnkiExtension instance...');
  const chatToAnki = new ChatToAnkiExtension();
  console.log('Anki Extension: Extension initialized successfully:', chatToAnki);
  
  // Expose for debugging and popup access
  window.chatToAnki = chatToAnki;
  
  // Add a global flag to indicate extension is loaded
  window.ankiExtensionLoaded = true;
  
  console.log('Anki Extension: Global window.chatToAnki exposed');
} catch (error) {
  console.error('Anki Extension: Failed to initialize:', error);
  
  // Still expose a minimal object for popup compatibility
  window.chatToAnki = {
    error: error.message,
    openChatSelectionModal: () => {
      alert('Extension failed to load: ' + error.message);
    }
  };
  window.ankiExtensionLoaded = false;
}