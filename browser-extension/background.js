// Chat to Anki Flashcards - Background Script

chrome.runtime.onInstalled.addListener(() => {
  console.log('Chat to Anki Flashcards extension installed');
  
  // Create context menu for text selection
  chrome.contextMenus.create({
    id: 'addToContext',
    title: 'Add to Context for Flashcards',
    contexts: ['selection']
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('chatgpt.com') || tab.url.includes('chat.openai.com')) {
    // Already on ChatGPT, just activate the extension
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.chatToAnki) {
          window.chatToAnki.openChatSelectionModal();
        }
      }
    });
  } else {
    // Navigate to ChatGPT
    chrome.tabs.create({ url: 'https://chatgpt.com' });
  }
});

// Handle storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.flashcardData) {
    console.log('Flashcard data updated');
  }
});

// Handle downloads
chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.state && downloadDelta.state.current === 'complete') {
    console.log('Download completed');
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToContext') {
    const selectedText = info.selectionText;
    
    // Get current context and add the new text
    chrome.storage.local.get(['contextData'], (result) => {
      const currentContext = result.contextData || [];
      
      // Add new context item with metadata
      const contextItem = {
        text: selectedText,
        url: tab.url,
        title: tab.title,
        timestamp: new Date().toISOString(),
        id: Date.now()
      };
      
      currentContext.push(contextItem);
      
      // Save updated context
      chrome.storage.local.set({ contextData: currentContext }, () => {
        console.log('Context item added:', contextItem);
        
        // Context added successfully - notification permission removed
      });
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openConfig':
      chrome.tabs.create({ url: chrome.runtime.getURL('config.html') });
      break;
    
    case 'downloadAnkiDeck':
      // Handle Anki deck download
      chrome.downloads.download({
        url: request.url,
        filename: request.filename,
        saveAs: true
      }, (downloadId) => {
        sendResponse({ success: true, downloadId });
      });
      return true; // Keep message channel open for async response
    
    case 'getStoredData':
      chrome.storage.local.get(request.keys, (result) => {
        sendResponse(result);
      });
      return true;
    
    case 'setStoredData':
      chrome.storage.local.set(request.data, () => {
        sendResponse({ success: true });
      });
      return true;
    
    case 'generateContextFlashcards':
      // Handle context flashcard generation
      handleContextFlashcardGeneration(request, sendResponse);
      return true;
    
    case 'storeContextFlashcards':
      // Handle storing flashcards from context processing
      handleStoreContextFlashcards(request, sendResponse);
      return true;
    
    default:
      sendResponse({ error: 'Unknown action' });
  }
});

// Handle context flashcard generation
async function handleContextFlashcardGeneration(request, sendResponse) {
  try {
    // Get context data and settings
    const result = await chrome.storage.local.get(['contextData', 'settings']);
    const contextData = result.contextData || [];
    const settings = result.settings || {};
    
    if (contextData.length === 0) {
      sendResponse({ error: 'No context data available' });
      return;
    }
    
    // Prepare context content
    const contextContent = contextData.map(item => {
      return `Source: ${item.title} (${item.url})\nContent: ${item.text}\n---`;
    }).join('\n\n');
    
    // Get context prompt template
    const contextPrompt = settings.contextPrompt || getDefaultContextPrompt();
    
    // Create final prompt
    const finalPrompt = contextPrompt.replace('{CONTEXT}', contextContent);
    
    // Open ChatGPT and paste the prompt
    const chatGPTTab = await chrome.tabs.create({ url: 'https://chatgpt.com' });
    
    // Wait for the tab to load and inject the prompt with full automation
    // Use shorter delay and add page load detection
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: chatGPTTab.id },
        func: injectAndProcessContextPrompt,
        args: [finalPrompt]
      });
    }, 1500);
    
    sendResponse({ success: true });
    
  } catch (error) {
    console.error('Error generating context flashcards:', error);
    sendResponse({ error: error.message });
  }
}

function getDefaultContextPrompt() {
  return `Create educational flashcards from the following context information. Return ONLY CSV data with no markdown, explanations, or code blocks.

Context Information:
{CONTEXT}

Format: Topic,Question,Answer
Generate 10-15 flashcards. Begin output immediately with CSV data:`;
}

// Function to inject context prompt into ChatGPT and process response
function injectAndProcessContextPrompt(prompt) {
  console.log('Starting context prompt injection and processing...');
  console.log('Prompt length:', prompt.length);
  
  // Define all helper functions within this scope
  function showProcessingIndicator() {
    // Add CSS styles if not already present
    if (!document.querySelector('#anki-processing-styles')) {
      const style = document.createElement('style');
      style.id = 'anki-processing-styles';
      style.textContent = `
        .anki-processing-indicator {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10001;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }
        .anki-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #374151;
          border-top: 4px solid #10a37f;
          border-radius: 50%;
          animation: anki-spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes anki-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .anki-processing-text {
          font-size: 16px;
          font-weight: 500;
          text-align: center;
          max-width: 300px;
        }
      `;
      document.head.appendChild(style);
    }
    
    const indicator = document.createElement('div');
    indicator.id = 'anki-processing-indicator';
    indicator.className = 'anki-processing-indicator';
    indicator.innerHTML = `
      <div class="anki-spinner"></div>
      <div class="anki-processing-text">Generating flashcards from context...</div>
    `;
    
    document.body.appendChild(indicator);
  }
  
  function hideProcessingIndicator() {
    const indicator = document.getElementById('anki-processing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }
  
  function updateProcessingText(text) {
    const textElement = document.querySelector('.anki-processing-text');
    if (textElement) {
      textElement.textContent = text;
    }
  }
  
  function openConfigurationPage() {
    console.log('Opening configuration page...');
    
    // Add delay to ensure completion
    setTimeout(() => {
      console.log('Opening config page after context processing');
      const configUrl = chrome.runtime.getURL('config.html');
      console.log('Config URL:', configUrl);
      
      // Open in new tab
      window.open(configUrl, '_blank');
    }, 2000);
  }
  
  function findInputBox() {
    const selectors = [
      '[data-testid="prompt-textarea"]',
      'textarea[placeholder*="message"]',
      '#prompt-textarea',
      '.ProseMirror',
      'div[contenteditable="true"]'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('Found input box with selector:', selector);
        return element;
      }
    }
    
    console.error('No input box found');
    return null;
  }

  async function insertPrompt(inputBox, prompt) {
    console.log('Inserting prompt into input box');
    
    inputBox.focus();
    
    if (inputBox.tagName === 'TEXTAREA') {
      inputBox.value = prompt;
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
      inputBox.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // For contenteditable elements
      inputBox.textContent = prompt;
      inputBox.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    console.log('Prompt inserted successfully');
  }

  async function sendPrompt(inputBox) {
    console.log('Looking for send button...');
    
    // Wait a short moment for the input to be processed
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try the specific button ID you found first
    let sendButton = document.querySelector('#composer-submit-button');
    if (sendButton) {
      console.log('Found composer-submit-button, clicking...', sendButton);
      sendButton.click();
      return true;
    }
    
    // Try other selectors
    const buttonSelectors = [
      '[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[aria-label*="send"]', 
      'button[type="submit"]',
      'button[data-testid*="send"]',
      'button[class*="send"]'
    ];
    
    for (const selector of buttonSelectors) {
      try {
        const buttons = document.querySelectorAll(selector);
        console.log(`Selector "${selector}" found ${buttons.length} buttons`);
        
        for (const button of buttons) {
          if (button && isElementVisible(button)) {
            console.log(`Found visible button with selector "${selector}":`, button);
            button.click();
            return true;
          }
        }
      } catch (e) {
        console.warn(`Failed to query selector: ${selector}`, e);
      }
    }
    
    console.log('No send button found, trying Enter key');
    
    // Try Enter key as fallback
    inputBox.focus();
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true
    });
    inputBox.dispatchEvent(enterEvent);
    
    return true;
  }

  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  async function waitForResponse() {
    console.log('Waiting for ChatGPT response...');
    updateProcessingText('Waiting for ChatGPT response...');
    
    return new Promise((resolve) => {
      let previousResponseLength = 0;
      let stableCount = 0;
      const maxWaitTime = 60000; // 60 seconds
      const startTime = Date.now();
      
      const checkForResponse = () => {
        // Check timeout
        if (Date.now() - startTime > maxWaitTime) {
          console.log('Max wait time exceeded');
          updateProcessingText('Response timeout - processing current content...');
          resolve(getCurrentResponse());
          return;
        }
        
        const currentResponse = getCurrentResponse();
        if (!currentResponse || currentResponse.length === 0) {
          setTimeout(checkForResponse, 1000);
          return;
        }
        
        const currentResponseLength = currentResponse.length;
        
        // Check if response is still growing
        if (currentResponseLength > previousResponseLength) {
          console.log(`Response growing: ${currentResponseLength} chars`);
          updateProcessingText(`Receiving response... (${currentResponseLength} chars)`);
          previousResponseLength = currentResponseLength;
          stableCount = 0;
          setTimeout(checkForResponse, 1000);
          return;
        } else {
          // Response stable, check if it's been stable long enough
          stableCount++;
          if (stableCount >= 3) {
            console.log('Response appears complete');
            updateProcessingText('Response complete - processing flashcards...');
            resolve(currentResponse);
            return;
          } else {
            updateProcessingText(`Response stabilizing... (${stableCount}/3)`);
            setTimeout(checkForResponse, 1000);
            return;
          }
        }
      };
      
      // Start checking after shorter initial delay
      setTimeout(checkForResponse, 1000);
    });
  }

  function getCurrentResponse() {
    // ChatGPT response selectors
    const responseSelectors = [
      '[data-message-author-role="assistant"]',
      '.markdown.prose',
      '.prose',
      '[data-testid*="conversation-turn"] .markdown',
      '.group\\/conversation-turn .markdown',
      '.group\\/conversation-turn .prose'
    ];
    
    for (const selector of responseSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          const lastElement = elements[elements.length - 1];
          const text = lastElement.textContent.trim();
          if (text) {
            return text;
          }
        }
      } catch (e) {
        console.warn(`Failed to query selector: ${selector}`, e);
      }
    }
    
    return '';
  }

  function extractCSVFromResponse(response) {
    console.log('Extracting CSV from response...');
    
    const lines = response.split('\n');
    const csvLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine.includes(',')) {
        // Basic CSV validation - should have at least 2 commas for 3 columns
        const commaCount = (trimmedLine.match(/,/g) || []).length;
        if (commaCount >= 2) {
          csvLines.push(trimmedLine);
        }
      }
    }
    
    console.log(`Extracted ${csvLines.length} CSV lines`);
    return csvLines.length > 0 ? csvLines.join('\n') : null;
  }
  
  // Wait for page to be ready and start automation
  function waitForPageReady() {
    // Check if the page is ready by looking for key elements
    if (document.readyState === 'complete' && 
        (document.querySelector('[data-testid="prompt-textarea"]') || 
         document.querySelector('textarea[placeholder*="message"]') ||
         document.querySelector('#prompt-textarea'))) {
      startAutomation();
    } else {
      // Retry every 100ms until ready, max 30 seconds
      setTimeout(waitForPageReady, 100);
    }
  }
  
  async function startAutomation() {
    try {
      console.log('Page ready, starting automation...');
      
      // Show processing indicator
      showProcessingIndicator();
      
      // Step 1: Find and fill input box
      updateProcessingText('Finding input box...');
      const inputBox = findInputBox();
      if (!inputBox) {
        console.error('Could not find input box');
        hideProcessingIndicator();
        alert('Could not find ChatGPT input box. Please try again.');
        return;
      }
      
      console.log('Found input box:', inputBox);
      
      // Step 2: Insert prompt
      updateProcessingText('Inserting context prompt...');
      await insertPrompt(inputBox, prompt);
      console.log('Prompt inserted');
      
      // Step 3: Send prompt
      updateProcessingText('Sending prompt to ChatGPT...');
      const sent = await sendPrompt(inputBox);
      if (!sent) {
        console.error('Failed to send prompt');
        hideProcessingIndicator();
        alert('Failed to send prompt. Please check the console for errors.');
        return;
      }
      
      console.log('Prompt sent, waiting for response...');
      
      // Step 4: Wait for response
      const response = await waitForResponse();
      console.log('Response received:', response ? response.length : 'no response');
      
      // Step 5: Extract CSV and send back to background script
      if (response) {
        updateProcessingText('Extracting flashcard data...');
        const csvData = extractCSVFromResponse(response);
        if (csvData) {
          console.log('CSV data extracted, storing flashcards...');
          updateProcessingText('Storing flashcards...');
          
          // Send to background script and wait for completion
          chrome.runtime.sendMessage({
            action: 'storeContextFlashcards',
            csvData: csvData,
            url: window.location.href
          }, (response) => {
            if (response && response.success) {
              updateProcessingText('Flashcards generated successfully!');
              
              // Hide processing indicator after a moment
              setTimeout(() => {
                hideProcessingIndicator();
                
                // Open configuration page
                openConfigurationPage();
              }, 1000);
            } else {
              hideProcessingIndicator();
              console.error('Failed to store flashcards:', response);
              alert('Failed to store flashcards. Please try again.');
            }
          });
        } else {
          hideProcessingIndicator();
          console.warn('No CSV data extracted from response');
          alert('No CSV data found in the response. The AI may not have provided the data in the correct format.');
        }
      } else {
        hideProcessingIndicator();
        console.warn('No response received');
        alert('No response received from ChatGPT. Please try again.');
      }
      
    } catch (error) {
      hideProcessingIndicator();
      console.error('Error in context prompt processing:', error);
      alert('Error processing context: ' + error.message);
    }
  }
  
  // Start the page ready check immediately
  waitForPageReady();
}

// All helper functions are now included within the main injection function above

// Handle storing context flashcards
async function handleStoreContextFlashcards(request, sendResponse) {
  console.log('Storing context flashcards...');
  
  try {
    const { csvData, url } = request;
    
    if (!csvData) {
      sendResponse({ error: 'No CSV data provided' });
      return;
    }
    
    // Create flashcard entry
    const flashcardEntry = {
      chatId: 'context-' + Date.now(),
      chatName: 'Context Flashcards',
      chatUrl: url,
      csvData: csvData,
      timestamp: new Date().toISOString(),
      flashcardCount: csvData.split('\n').filter(line => line.trim()).length
    };
    
    // Get existing flashcard data and add new entry
    chrome.storage.local.get(['flashcardData'], (result) => {
      const existingData = result.flashcardData || [];
      existingData.push(flashcardEntry);
      
      chrome.storage.local.set({ flashcardData: existingData }, () => {
        console.log('Context flashcards saved successfully');
        
        // Clear context data after successful processing
        chrome.storage.local.set({ contextData: [] }, () => {
          console.log('Context data cleared after processing');
        });
        
        // Flashcards generated successfully - notification permission removed
        
        sendResponse({ success: true });
      });
    });
    
  } catch (error) {
    console.error('Error storing context flashcards:', error);
    sendResponse({ error: error.message });
  }
}