// Chat to Anki Flashcards - Popup Script

document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const configBtn = document.getElementById('configBtn');
  const helpBtn = document.getElementById('helpBtn');
  const statusDiv = document.getElementById('status');
  
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
});