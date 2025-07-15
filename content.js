// Chat to Anki Flashcards - Content Script
// Future-proof ChatGPT chat detection and flashcard generation

class ChatToAnkiExtension {
  constructor() {
    this.chatDetectionStrategies = [
      // Strategy 1: Data attributes (most reliable)
      {
        name: 'data-testid',
        selector: '[data-testid*="chat"], [data-testid*="conversation"]',
        linkSelector: 'a[href*="/c/"]'
      },
      // Strategy 2: ARIA labels
      {
        name: 'aria-labels',
        selector: '[role="button"][aria-label*="chat"], [role="menuitem"][aria-label*="conversation"]',
        linkSelector: 'a[href*="/c/"]'
      },
      // Strategy 3: URL patterns in links
      {
        name: 'url-pattern',
        selector: 'a[href*="/c/"]',
        linkSelector: 'a[href*="/c/"]'
      },
      // Strategy 4: Structural patterns
      {
        name: 'structural',
        selector: 'nav li, .sidebar li, [class*="sidebar"] li',
        linkSelector: 'a[href*="/c/"]'
      },
      // Strategy 5: Text content fallback
      {
        name: 'text-content',
        selector: '*',
        linkSelector: 'a[href*="/c/"]',
        textFilter: true
      }
    ];
    
    this.selectedChats = new Set();
    this.isProcessing = false;
    this.observer = null;
    this.exportButton = null;
    this.modal = null;
    
    this.init();
  }
  
  init() {
    this.waitForPageLoad().then(() => {
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
          const link = element.querySelector(strategy.linkSelector) || 
                      element.closest('a[href*="/c/"]');
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
        const link = element.querySelector(strategy.linkSelector) || 
                    element.closest('a[href*="/c/"]') ||
                    element.querySelector('a[href*="/c/"]');
        
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
    const match = url.match(/\/c\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }
  
  addExportButton() {
    // Look for sidebar container
    const sidebarSelectors = [
      'nav',
      '[class*="sidebar"]',
      '[data-testid*="sidebar"]',
      '.flex.h-full.w-full.flex-col'
    ];
    
    let sidebar = null;
    for (const selector of sidebarSelectors) {
      sidebar = document.querySelector(selector);
      if (sidebar) break;
    }
    
    if (!sidebar) {
      console.warn('Could not find sidebar to add export button');
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
    
    // Try to insert button at the top of sidebar
    const insertTarget = sidebar.querySelector('.flex.flex-col') || sidebar.firstElementChild || sidebar;
    if (insertTarget) {
      insertTarget.insertBefore(this.exportButton, insertTarget.firstChild);
    }
  }
  
  openChatSelectionModal() {
    if (this.modal) {
      this.modal.remove();
    }
    
    const chats = this.detectChats();
    if (chats.length === 0) {
      alert('No chats found. Please make sure you are on the ChatGPT main page.');
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
            csvData: csvData
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
    
    console.log('Navigating to chat:', url);
    
    // Use a more gentle navigation approach
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
  
  async waitForChatLoad() {
    return new Promise(resolve => {
      const checkLoad = () => {
        const inputBox = this.findInputBox();
        if (inputBox) {
          resolve();
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      checkLoad();
    });
  }
  
  findInputBox() {
    const inputSelectors = [
      '#prompt-textarea',
      'div[contenteditable="true"]#prompt-textarea',
      'div.ProseMirror[contenteditable="true"]',
      'textarea[placeholder*="Ask"]',
      'textarea[placeholder*="Message"]',
      '[contenteditable="true"]',
      'textarea',
      'input[type="text"]'
    ];
    
    for (const selector of inputSelectors) {
      const element = document.querySelector(selector);
      if (element && this.isElementVisible(element)) {
        return element;
      }
    }
    
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
    const inputBox = this.findInputBox();
    if (!inputBox) {
      throw new Error('Could not find input box');
    }
    
    const prompt = this.generateCustomPrompt();
    
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
    console.log('Inserting text into contenteditable:', element, text);
    
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
  
  async sendPrompt(inputBox) {
    // Look for send button
    const sendButton = this.findSendButton();
    if (sendButton) {
      sendButton.click();
    } else {
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
    const buttonSelectors = [
      // Primary ChatGPT selectors
      '[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="send"]',
      
      // Secondary selectors
      'button[type="submit"]',
      'button[data-testid*="send"]',
      'button[class*="send"]',
      
      // SVG-based selectors
      'button svg[data-testid*="send"]',
      'button:has(svg[data-testid*="send"])',
      'button:has(svg[class*="send"])',
      
      // Form-based selectors
      'form button[type="submit"]',
      'form button:last-child',
      
      // Structural selectors for ChatGPT
      'div[class*="group"] button:last-child',
      'div[class*="flex"] button:last-child',
      'div[class*="input"] + button',
      'div[class*="textarea"] + button'
    ];
    
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
      console.log('Waiting for ChatGPT response...');
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
        
        // Look for the latest response
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
          } else {
            // Response hasn't grown, check if it's stable
            stableCount++;
            if (stableCount >= 3) {
              // Response has been stable for 3 seconds, it's complete
              console.log('Response appears complete, resolving');
              resolve(latestResponse.textContent.trim());
            } else {
              setTimeout(checkForResponse, 1000);
            }
          }
        } else {
          setTimeout(checkForResponse, 1000);
        }
      };
      
      checkForResponse();
    });
  }
  
  getCurrentResponse() {
    const responseSelectors = [
      '[data-message-author-role="assistant"]',
      '.message.assistant',
      '[class*="assistant"]',
      '.response'
    ];
    
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
  
  async storeFlashcardData(flashcardData) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ flashcardData: flashcardData }, () => {
        resolve();
      });
    });
  }
  
  openConfigurationPage() {
    console.log('Opening configuration page...');
    
    // Check if we're still on ChatGPT and potentially waiting for responses
    if (window.location.href.includes('chatgpt.com') || window.location.href.includes('chat.openai.com')) {
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
  
  generateCustomPrompt() {
    const userSettings = this.getUserPromptSettings();
    const basePrompt = this.getBasePromptTemplate();
    const customization = this.getCustomizationText(userSettings);
    
    return `${basePrompt}\n\n${customization}`;
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
    
    if (document.getElementById('anki-topic-focus')) {
      settings.topicFocus = document.getElementById('anki-topic-focus').value.trim();
      settings.questionType = document.getElementById('anki-question-type').value;
      settings.difficulty = document.getElementById('anki-difficulty').value;
      settings.cardCount = document.getElementById('anki-card-count').value;
      settings.customInstructions = document.getElementById('anki-custom-instructions').value.trim();
    }
    
    return settings;
  }
  
  getBasePromptTemplate() {
    return `Based on our conversation, create flashcards in CSV format. Analyze the conversation and create comprehensive flashcards covering key concepts, definitions, and important details.

CRITICAL REQUIREMENTS:
- Output ONLY CSV data, no other text or formatting
- Format: Topic,Question,Answer
- Each line must be a complete flashcard in CSV format
- Questions should test understanding, not just recall
- Answers should be concise but complete
- Topics should be categorized (e.g., "Programming", "Science", "General")

EXAMPLE FORMAT:
Programming,What is a variable in programming?,A variable is a container that stores data values that can be changed during program execution
Science,What is photosynthesis?,The process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen`;
  }
  
  getCustomizationText(settings) {
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
    
    return customization;
  }
  
  previewPrompt() {
    const prompt = this.generateCustomPrompt();
    
    // Create preview modal
    const previewModal = document.createElement('div');
    previewModal.className = 'anki-modal-overlay';
    previewModal.innerHTML = `
      <div class="anki-modal-content anki-preview-modal">
        <div class="anki-modal-header">
          <h2>Prompt Preview</h2>
          <button class="anki-close-btn" onclick="this.closest('.anki-modal-overlay').remove()">&times;</button>
        </div>
        <div class="anki-modal-body">
          <div class="anki-prompt-preview">
            <pre>${this.escapeHtml(prompt)}</pre>
          </div>
        </div>
        <div class="anki-modal-footer">
          <button class="anki-btn anki-btn-secondary" onclick="this.closest('.anki-modal-overlay').remove()">Close</button>
          <button class="anki-btn anki-btn-primary" onclick="navigator.clipboard.writeText(\`${prompt.replace(/`/g, '\\`')}\`)">Copy to Clipboard</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(previewModal);
    
    // Close when clicking outside
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        previewModal.remove();
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
}

// Initialize the extension
const chatToAnki = new ChatToAnkiExtension();

// Expose for debugging
window.chatToAnki = chatToAnki;