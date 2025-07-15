// Chat to Anki Flashcards - Background Script

chrome.runtime.onInstalled.addListener(() => {
  console.log('Chat to Anki Flashcards extension installed');
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
    
    default:
      sendResponse({ error: 'Unknown action' });
  }
});