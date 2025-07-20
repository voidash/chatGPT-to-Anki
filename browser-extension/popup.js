// Chat to Anki Flashcards - Popup Script

document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportBtn');
  const configBtn = document.getElementById('configBtn');
  const helpBtn = document.getElementById('helpBtn');
  const statusDiv = document.getElementById('status');
  const generateContextBtn = document.getElementById('generateContextBtn');
  const clearContextBtn = document.getElementById('clearContextBtn');
  
  // Tab navigation elements
  const exportTab = document.getElementById('exportTab');
  const contextTab = document.getElementById('contextTab');
  const decksTab = document.getElementById('decksTab');
  const exportSection = document.getElementById('exportSection');
  const contextSection = document.getElementById('contextSection');
  const deckSection = document.getElementById('deckSection');
  
  // Deck management elements
  const deckSelect = document.getElementById('deckSelect');
  const newDeckForm = document.getElementById('newDeckForm');
  const deckName = document.getElementById('deckName');
  const cardFront = document.getElementById('cardFront');
  const cardBack = document.getElementById('cardBack');
  const frontImageUpload = document.getElementById('frontImageUpload');
  const frontAudioUpload = document.getElementById('frontAudioUpload');
  const imageUpload = document.getElementById('imageUpload');
  const audioUpload = document.getElementById('audioUpload');
  const addCardBtn = document.getElementById('addCardBtn');
  
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
  
  // Tab navigation handlers
  exportTab.addEventListener('click', function() {
    switchTab('export');
  });
  
  contextTab.addEventListener('click', function() {
    switchTab('context');
  });
  
  decksTab.addEventListener('click', function() {
    switchTab('decks');
  });
  
  // Deck management handlers
  deckSelect.addEventListener('change', function() {
    if (this.value === 'new') {
      newDeckForm.style.display = 'block';
      deckName.focus();
    } else {
      newDeckForm.style.display = 'none';
    }
  });
  
  // Front image upload handler
  frontImageUpload.addEventListener('change', function(e) {
    handleFileUpload(e, 'frontImageUpload', 'Front Image', 'frontMediaPreview');
  });
  
  // Front audio upload handler
  frontAudioUpload.addEventListener('change', function(e) {
    handleFileUpload(e, 'frontAudioUpload', 'Front Audio', 'frontMediaPreview');
  });

  // Back image upload handler
  imageUpload.addEventListener('change', function(e) {
    handleFileUpload(e, 'imageUpload', 'Back Image', 'backMediaPreview');
  });
  
  // Back audio upload handler
  audioUpload.addEventListener('change', function(e) {
    handleFileUpload(e, 'audioUpload', 'Back Audio', 'backMediaPreview');
  });
  
  // File upload handler with preview
  function handleFileUpload(event, inputId, defaultText, previewContainerId) {
    const file = event.target.files[0];
    const label = document.querySelector(`label[for="${inputId}"]`);
    const previewContainer = document.getElementById(previewContainerId);
    
    if (file && label) {
      // Update label to show file selected
      label.innerHTML = `
        <svg class="file-upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z"/>
        </svg>
        ${file.name}
      `;
      label.style.color = '#10a37f';
      
      // Show preview
      showFilePreview(file, previewContainer, inputId);
    } else if (label) {
      resetFileUploadLabel(inputId, defaultText);
      if (previewContainer) {
        previewContainer.innerHTML = '';
      }
    }
  }
  
  function showFilePreview(file, previewContainer, inputId) {
    if (!previewContainer) return;
    
    const fileReader = new FileReader();
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    
    fileReader.onload = function(e) {
      const result = e.target.result;
      
      if (isImage) {
        previewContainer.innerHTML = `
          <div style="margin-top: 4px;">
            <small style="color: #6b7280;">Preview:</small><br>
            <img src="${result}" alt="Preview" style="max-width: 80px; max-height: 80px; object-fit: cover; border-radius: 4px; border: 2px solid #10a37f;">
          </div>
        `;
      } else if (isAudio) {
        previewContainer.innerHTML = `
          <div style="margin-top: 4px;">
            <small style="color: #6b7280;">Preview:</small><br>
            <audio controls style="width: 100%; max-width: 150px; border: 2px solid #10a37f; border-radius: 4px;">
              <source src="${result}" type="${file.type}">
            </audio>
          </div>
        `;
      }
    };
    
    fileReader.readAsDataURL(file);
  }
  
  function resetFileUploadLabel(inputId, defaultText) {
    const label = document.querySelector(`label[for="${inputId}"]`);
    if (label) {
      // Reset to original icon and text based on input type
      let iconPath = '';
      if (inputId.includes('Image')) {
        iconPath = 'M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,5V19L14,14L11,17L7,13L5,15V5H19Z';
      } else if (inputId.includes('Audio')) {
        iconPath = 'M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z';
      }
      
      label.innerHTML = `
        <svg class="file-upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="${iconPath}"/>
        </svg>
        ${defaultText}
      `;
      label.style.color = '#6b7280';
    }
  }
  
  // Add card handler
  addCardBtn.addEventListener('click', function() {
    addCardToDeck();
  });
  
  // Load initial data
  loadContextData();
  loadDecks();
  
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
  
  function switchTab(tabName) {
    // Update tab buttons
    exportTab.classList.remove('active');
    contextTab.classList.remove('active');
    decksTab.classList.remove('active');
    
    // Update sections
    exportSection.classList.remove('active');
    contextSection.classList.remove('active');
    deckSection.classList.remove('active');
    
    if (tabName === 'export') {
      exportTab.classList.add('active');
      exportSection.classList.add('active');
    } else if (tabName === 'context') {
      contextTab.classList.add('active');
      contextSection.classList.add('active');
    } else if (tabName === 'decks') {
      decksTab.classList.add('active');
      deckSection.classList.add('active');
    }
  }
  
  function loadDecks() {
    chrome.storage.local.get(['customDecks'], function(result) {
      const decks = result.customDecks || [];
      console.log('Loading decks:', decks);
      const deckSelect = document.getElementById('deckSelect');
      
      // Clear existing options except the first two
      while (deckSelect.children.length > 2) {
        deckSelect.removeChild(deckSelect.lastChild);
      }
      
      // Add custom decks
      decks.forEach(deck => {
        const option = document.createElement('option');
        option.value = deck.id;
        option.textContent = deck.name;
        deckSelect.appendChild(option);
        console.log('Added deck option:', deck.name);
      });
      
      console.log('Total deck options now:', deckSelect.children.length);
    });
  }
  
  function addCardToDeck() {
    const front = cardFront.value.trim();
    const back = cardBack.value.trim();
    
    if (!front || !back) {
      showStatus('Please fill in both front and back text', 'error');
      return;
    }
    
    let selectedDeckId = deckSelect.value;
    let deckNameValue = deckName.value.trim();
    
    // Handle new deck creation
    if (selectedDeckId === 'new') {
      if (!deckNameValue) {
        showStatus('Please enter a deck name', 'error');
        deckName.focus();
        return;
      }
      
      // Create new deck
      chrome.storage.local.get(['customDecks'], function(result) {
        const decks = result.customDecks || [];
        const newDeck = {
          id: 'deck_' + Date.now(),
          name: deckNameValue,
          cards: [],
          created: new Date().toISOString()
        };
        
        decks.push(newDeck);
        selectedDeckId = newDeck.id;
        
        chrome.storage.local.set({ customDecks: decks }, function() {
          addCardToExistingDeck(selectedDeckId, front, back);
          loadDecks();
          
          // Select the newly created deck
          deckSelect.value = selectedDeckId;
          newDeckForm.style.display = 'none';
          deckName.value = '';
        });
      });
    } else if (selectedDeckId) {
      addCardToExistingDeck(selectedDeckId, front, back);
    } else {
      showStatus('Please select or create a deck', 'error');
      return;
    }
  }
  
  function addCardToExistingDeck(deckId, front, back) {
    chrome.storage.local.get(['customDecks'], function(result) {
      const decks = result.customDecks || [];
      const deck = decks.find(d => d.id === deckId);
      
      if (!deck) {
        showStatus('Deck not found', 'error');
        return;
      }
      
      // Process uploaded files
      const frontImageFile = frontImageUpload.files[0];
      const frontAudioFile = frontAudioUpload.files[0];
      const backImageFile = imageUpload.files[0];
      const backAudioFile = audioUpload.files[0];
      
      const newCard = {
        id: 'card_' + Date.now(),
        front: front,
        back: back,
        created: new Date().toISOString()
      };
      
      // Handle file uploads
      if (frontImageFile || frontAudioFile || backImageFile || backAudioFile) {
        processAllMediaFiles(frontImageFile, frontAudioFile, backImageFile, backAudioFile, function(frontImageData, frontAudioData, backImageData, backAudioData) {
          if (frontImageData) newCard.frontImage = frontImageData;
          if (frontAudioData) newCard.frontAudio = frontAudioData;
          if (backImageData) newCard.image = backImageData;
          if (backAudioData) newCard.audio = backAudioData;
          
          deck.cards.push(newCard);
          saveDeckAndReset(decks, deck.name);
        });
      } else {
        deck.cards.push(newCard);
        saveDeckAndReset(decks, deck.name);
      }
    });
  }
  
  function processAllMediaFiles(frontImageFile, frontAudioFile, backImageFile, backAudioFile, callback) {
    let frontImageData = null;
    let frontAudioData = null;
    let backImageData = null;
    let backAudioData = null;
    let filesProcessed = 0;
    const totalFiles = (frontImageFile ? 1 : 0) + (frontAudioFile ? 1 : 0) + (backImageFile ? 1 : 0) + (backAudioFile ? 1 : 0);
    
    if (totalFiles === 0) {
      callback(null, null, null, null);
      return;
    }
    
    function checkComplete() {
      filesProcessed++;
      if (filesProcessed === totalFiles) {
        callback(frontImageData, frontAudioData, backImageData, backAudioData);
      }
    }
    
    if (frontImageFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        frontImageData = {
          name: frontImageFile.name,
          type: frontImageFile.type,
          data: e.target.result
        };
        checkComplete();
      };
      reader.readAsDataURL(frontImageFile);
    }
    
    if (frontAudioFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        frontAudioData = {
          name: frontAudioFile.name,
          type: frontAudioFile.type,
          data: e.target.result
        };
        checkComplete();
      };
      reader.readAsDataURL(frontAudioFile);
    }
    
    if (backImageFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        backImageData = {
          name: backImageFile.name,
          type: backImageFile.type,
          data: e.target.result
        };
        checkComplete();
      };
      reader.readAsDataURL(backImageFile);
    }
    
    if (backAudioFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        backAudioData = {
          name: backAudioFile.name,
          type: backAudioFile.type,
          data: e.target.result
        };
        checkComplete();
      };
      reader.readAsDataURL(backAudioFile);
    }
  }

  function processMediaFiles(imageFile, audioFile, callback) {
    let imageData = null;
    let audioData = null;
    let filesProcessed = 0;
    const totalFiles = (imageFile ? 1 : 0) + (audioFile ? 1 : 0);
    
    if (totalFiles === 0) {
      callback(null, null);
      return;
    }
    
    function checkComplete() {
      filesProcessed++;
      if (filesProcessed === totalFiles) {
        callback(imageData, audioData);
      }
    }
    
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        imageData = {
          name: imageFile.name,
          type: imageFile.type,
          data: e.target.result
        };
        checkComplete();
      };
      reader.readAsDataURL(imageFile);
    }
    
    if (audioFile) {
      const reader = new FileReader();
      reader.onload = function(e) {
        audioData = {
          name: audioFile.name,
          type: audioFile.type,
          data: e.target.result
        };
        checkComplete();
      };
      reader.readAsDataURL(audioFile);
    }
  }
  
  function saveDeckAndReset(decks, deckName) {
    chrome.storage.local.set({ customDecks: decks }, function() {
      showStatus(`Card added to ${deckName}`, 'success');
      
      // Reset form
      cardFront.value = '';
      cardBack.value = '';
      frontImageUpload.value = '';
      frontAudioUpload.value = '';
      imageUpload.value = '';
      audioUpload.value = '';
      
      // Reset front image upload label
      const frontImageLabel = document.querySelector('label[for="frontImageUpload"]');
      frontImageLabel.innerHTML = `
        <svg class="file-upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,5V19L14,14L11,17L7,13L5,15V5H19Z"/>
        </svg>
        Front Image
      `;
      frontImageLabel.style.color = '#6b7280';
      
      // Reset front audio upload label
      const frontAudioLabel = document.querySelector('label[for="frontAudioUpload"]');
      frontAudioLabel.innerHTML = `
        <svg class="file-upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
        </svg>
        Front Audio
      `;
      frontAudioLabel.style.color = '#6b7280';
      
      // Reset back image upload label
      const imageLabel = document.querySelector('label[for="imageUpload"]');
      imageLabel.innerHTML = `
        <svg class="file-upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19M19,5V19L14,14L11,17L7,13L5,15V5H19Z"/>
        </svg>
        Back Image
      `;
      imageLabel.style.color = '#6b7280';
      
      // Reset back audio upload label
      const audioLabel = document.querySelector('label[for="audioUpload"]');
      audioLabel.innerHTML = `
        <svg class="file-upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.85 14,18.71V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/>
        </svg>
        Back Audio
      `;
      audioLabel.style.color = '#6b7280';
      
      // Clear preview containers
      const frontPreview = document.getElementById('frontMediaPreview');
      const backPreview = document.getElementById('backMediaPreview');
      if (frontPreview) frontPreview.innerHTML = '';
      if (backPreview) backPreview.innerHTML = '';
    });
  }
});
