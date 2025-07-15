// Chat to Anki Flashcards - Popup Script

document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const configBtn = document.getElementById('configBtn');
  const helpBtn = document.getElementById('helpBtn');
  const statusDiv = document.getElementById('status');
  
  // Check if we're on ChatGPT
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const isOnChatGPT = currentTab.url.includes('chatgpt.com') || currentTab.url.includes('chat.openai.com');
    
    if (!isOnChatGPT) {
      showStatus('Navigate to ChatGPT to use this extension', 'info');
      exportBtn.textContent = 'Go to ChatGPT';
      exportBtn.onclick = function() {
        chrome.tabs.create({ url: 'https://chatgpt.com' });
        window.close();
      };
    } else {
      showStatus('Ready to export chats', 'success');
    }
  });
  
  // Export button click
  exportBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      if (currentTab.url.includes('chatgpt.com') || currentTab.url.includes('chat.openai.com')) {
        // Execute the export function
        chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          func: () => {
            if (window.chatToAnki) {
              window.chatToAnki.openChatSelectionModal();
            } else {
              alert('Extension not loaded. Please refresh the page and try again.');
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

1. Navigate to ChatGPT (chatgpt.com)
2. Click the "Export to Anki" button in the sidebar
3. Select chats you want to convert to flashcards
4. The extension will automatically generate flashcards
5. Review and export your flashcards from the configuration page

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