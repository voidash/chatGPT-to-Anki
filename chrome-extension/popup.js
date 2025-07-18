// Chat to Anki Flashcards - Popup Script

document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const configBtn = document.getElementById('configBtn');
  const helpBtn = document.getElementById('helpBtn');
  const statusDiv = document.getElementById('status');
  const generateContextBtn = document.getElementById('generateContextBtn');
  const clearContextBtn = document.getElementById('clearContextBtn');
  
  // Check if we're on supported platforms
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const isOnChatGPT = currentTab.url.includes('chatgpt.com') || currentTab.url.includes('chat.openai.com');
    const isOnClaude = currentTab.url.includes('claude.ai');
    const isOnPerplexity = currentTab.url.includes('perplexity.ai');
    const isOnSupportedPlatform = isOnChatGPT || isOnClaude || isOnPerplexity;
    
    if (!isOnSupportedPlatform) {
      showStatus('Choose a platform to get started', 'info');
      document.getElementById('platformButtons').style.display = 'block';
      document.getElementById('exportBtn').style.display = 'none';
      
      // Add platform button handlers
      document.getElementById('chatgptBtn').addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://chatgpt.com' });
        window.close();
      });
      
      document.getElementById('claudeBtn').addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://claude.ai' });
        window.close();
      });
      
      document.getElementById('perplexityBtn').addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://perplexity.ai' });
        window.close();
      });
    } else {
      const platformName = isOnClaude ? 'Claude.ai' : isOnChatGPT ? 'ChatGPT' : 'Perplexity';
      showStatus(`Ready to export ${platformName} chats`, 'success');
      
      // Update header text based on platform
      const headerP = document.querySelector('.header p');
      headerP.textContent = `Convert ${platformName} conversations to flashcards`;
    }
  });
  
  // Export button click
  exportBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const isOnChatGPT = currentTab.url.includes('chatgpt.com') || currentTab.url.includes('chat.openai.com');
      const isOnClaude = currentTab.url.includes('claude.ai');
      const isOnPerplexity = currentTab.url.includes('perplexity.ai');
      const isOnSupportedPlatform = isOnChatGPT || isOnClaude || isOnPerplexity;
      
      if (isOnSupportedPlatform) {
        // Execute the export function
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: () => {
            console.log('Checking extension status...');
            console.log('window.chatToAnki:', window.chatToAnki);
            console.log('window.ankiExtensionLoaded:', window.ankiExtensionLoaded);
            
            if (window.chatToAnki && window.ankiExtensionLoaded) {
              console.log('Extension loaded successfully, opening modal...');
              window.chatToAnki.openChatSelectionModal();
            } else if (window.chatToAnki && window.chatToAnki.error) {
              alert('Extension failed to load: ' + window.chatToAnki.error);
            } else {
              console.log('Extension not loaded, showing error message');
              alert('Extension not loaded. Please refresh the page and try again.\n\nIf the issue persists, check the browser console for error messages.');
            }
          }
        });
        window.close();
      } else {
        chrome.tabs.create({ url: 'https://chatgpt.com' });
        window.close();
      }
    });
  });
  
  // Configuration button click
  configBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('config.html') });
    window.close();
  });
  
  // Help button click
  helpBtn.addEventListener('click', function() {
    const helpContent = `
Chat to Anki Flashcards Extension Help:

1. Navigate to ChatGPT (chatgpt.com) or Claude.ai (claude.ai)
2. Click the "Export to Anki" button in the sidebar
3. Select chats you want to convert to flashcards
4. The extension will automatically generate flashcards
5. Review and export your flashcards from the configuration page

Supported Platforms:
- ChatGPT (chatgpt.com)
- Claude.ai (claude.ai)
- Perplexity.ai (perplexity.ai)

Features:
- Future-proof chat detection
- Automatic flashcard generation
- CSV export and Anki package creation
- AnkiWeb synchronization

For issues or suggestions, visit our GitHub repository.
    `;
    
    alert(helpContent);
  });
  
  // Load context data
  loadContextData();
  
  // Context button handlers
  generateContextBtn.addEventListener('click', function() {
    generateContextBtn.disabled = true;
    generateContextBtn.textContent = 'Generating...';
    
    chrome.runtime.sendMessage({
      action: 'generateContextFlashcards'
    }, function(response) {
      generateContextBtn.disabled = false;
      generateContextBtn.textContent = 'Generate Flashcards';
      
      if (response.success) {
        showStatus('Opening ChatGPT with context prompt...', 'success');
        window.close();
      } else {
        showStatus(response.error || 'Failed to generate flashcards', 'error');
      }
    });
  });
  
  clearContextBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all context items?')) {
      chrome.storage.local.set({ contextData: [] }, function() {
        loadContextData();
        showStatus('Context cleared', 'success');
      });
    }
  });
  
  // Check for stored flashcard data
  chrome.storage.local.get(['flashcardData'], function(result) {
    if (result.flashcardData && result.flashcardData.length > 0) {
      showStatus(`${result.flashcardData.length} flashcard sets ready`, 'success');
    }
  });
  
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status status-${type}`;
    statusDiv.style.display = 'block';
  }
  
  function loadContextData() {
    chrome.storage.local.get(['contextData'], function(result) {
      const contextData = result.contextData || [];
      const contextCount = document.getElementById('contextCount');
      const contextPreview = document.getElementById('contextPreview');
      
      contextCount.textContent = `${contextData.length} items`;
      
      if (contextData.length === 0) {
        contextPreview.innerHTML = `
          <div class="context-empty">
            Select text on any page and right-click "Add to Context" to start collecting information for flashcards.
          </div>
        `;
        generateContextBtn.disabled = true;
      } else {
        generateContextBtn.disabled = false;
        
        const previewHtml = contextData.slice(-3).map(item => {
          const shortText = item.text.length > 100 ? item.text.substring(0, 100) + '...' : item.text;
          const shortTitle = item.title.length > 30 ? item.title.substring(0, 30) + '...' : item.title;
          
          return `
            <div class="context-item">
              <div class="context-item-source">${shortTitle}</div>
              <div class="context-item-text">${shortText}</div>
            </div>
          `;
        }).join('');
        
        contextPreview.innerHTML = previewHtml;
        
        if (contextData.length > 3) {
          contextPreview.innerHTML += `
            <div class="context-item">
              <div class="context-item-text" style="text-align: center; font-style: italic;">
                +${contextData.length - 3} more items...
              </div>
            </div>
          `;
        }
      }
    });
  }
});