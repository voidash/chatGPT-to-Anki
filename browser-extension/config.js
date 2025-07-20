// Chat to Anki Flashcards - Configuration Page Script

class ConfigManager {
  constructor() {
    this.flashcardData = [];
    this.customDecks = [];
    this.settings = {
      maxFlashcards: 20,
      defaultTopic: 'General',
      detectionStrategy: 'auto',
      defaultExportFormat: 'csv',
      ankiDeckName: 'ChatGPT Flashcards',
      customPrompt: `Based on the following conversation, create educational flashcards in CSV format. Each flashcard should have a clear question and a concise answer. Focus on key concepts, definitions, and important facts.

Please format your response as a CSV with the following columns:
- Topic (category/subject)
- Question (front of flashcard)
- Answer (back of flashcard)

Generate 10-15 high-quality flashcards that capture the most important information from this conversation.`,
      contextPrompt: `Create educational flashcards from the following context information. Return ONLY CSV data with no markdown, explanations, or code blocks.

Context Information:
{CONTEXT}

Format: Topic,Question,Answer
Generate 10-15 flashcards. Begin output immediately with CSV data:`
    };
    
    this.init();
  }
  
  init() {
    this.setupTabs();
    this.loadData();
    this.setupEventListeners();
  }
  
  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        tab.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        
        // Load specific tab data
        this.loadTabData(targetTab);
      });
    });
  }
  
  async loadData() {
    try {
      // Load flashcard data and custom decks
      const result = await this.getStorageData(['flashcardData', 'customDecks', 'settings']);
      
      if (result.flashcardData) {
        this.flashcardData = result.flashcardData;
      }
      
      if (result.customDecks) {
        this.customDecks = result.customDecks;
      } else {
        this.customDecks = [];
      }
      
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
      
      this.updateOverviewStats();
      this.loadFlashcards();
      this.loadSettings();
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.showAlert('Error loading data', 'error');
    }
  }
  
  loadTabData(tabName) {
    switch (tabName) {
      case 'overview':
        this.updateOverviewStats();
        break;
      case 'flashcards':
        this.loadFlashcards();
        break;
      case 'export':
        this.updateCSVPreview();
        break;
      case 'settings':
        this.loadSettings();
        break;
    }
  }
  
  updateOverviewStats() {
    let totalFlashcards = 0;
    let totalChats = this.flashcardData.length;
    let topics = new Set();
    let lastUpdated = 'Never';
    
    // Count flashcards from chat exports
    this.flashcardData.forEach(data => {
      if (data.csvData) {
        // Try both \n and \\n for line splitting
        let lines = data.csvData.split('\n').filter(line => line.trim());
        if (lines.length <= 1) {
          lines = data.csvData.split('\\n').filter(line => line.trim());
        }
        totalFlashcards += lines.length;
        
        lines.forEach(line => {
          const parts = this.parseCSVLine(line);
          if (parts.length >= 3) {
            topics.add(parts[0]);
          }
        });
      }
    });
    
    // Count flashcards from custom decks
    this.customDecks.forEach(deck => {
      if (deck.cards && Array.isArray(deck.cards)) {
        totalFlashcards += deck.cards.length;
        topics.add(deck.name);
      }
    });
    
    if (totalChats > 0 || this.customDecks.length > 0) {
      lastUpdated = new Date().toLocaleDateString();
    }
    
    document.getElementById('totalFlashcards').textContent = totalFlashcards;
    document.getElementById('totalChats').textContent = totalChats;
    document.getElementById('totalTopics').textContent = topics.size;
    document.getElementById('lastUpdated').textContent = lastUpdated;
    
    this.updateRecentActivity();
  }
  
  updateRecentActivity() {
    const activityContainer = document.getElementById('recentActivity');
    
    if (this.flashcardData.length === 0) {
      activityContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19M18,18V6H6V18H18Z"/>
          </svg>
          <h3>No recent activity</h3>
          <p>Export some chats from ChatGPT to get started</p>
        </div>
      `;
      return;
    }
    
    const recentItems = this.flashcardData.slice(-5).reverse();
    const activityHtml = recentItems.map((item, index) => {
      const flashcardCount = item.flashcardCount || (item.csvData ? item.csvData.split('\n').filter(line => line.trim()).length : 0);
      const chatName = item.chatName || `Chat ${item.chatId}`;
      const timestamp = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recently';
      const originalIndex = this.flashcardData.findIndex(data => data.chatId === item.chatId);
      
      return `
        <div class="flashcard-item chat-item" data-chat-id="${item.chatId}" data-chat-index="${originalIndex}">
          <div class="flashcard-topic">${this.escapeHtml(chatName)}</div>
          <div class="flashcard-question">${flashcardCount} flashcards generated</div>
          <div class="flashcard-answer">Exported: ${timestamp}</div>
          <div class="chat-actions">
            <button class="chat-action-btn" onclick="window.open('${item.chatUrl}', '_blank')" title="Open chat">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    activityContainer.innerHTML = `<div class="flashcard-grid">${activityHtml}</div>`;
    
    // Add click handlers for chat items
    this.setupChatItemHandlers();
  }
  
  setupChatItemHandlers() {
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
      item.addEventListener('click', (e) => {
        // Don't trigger if clicking on the action button
        if (e.target.closest('.chat-action-btn')) return;
        
        const chatId = item.getAttribute('data-chat-id');
        const chatIndex = parseInt(item.getAttribute('data-chat-index'));
        
        this.showChatFlashcards(chatId, chatIndex);
      });
    });
  }
  
  showChatFlashcards(chatId, chatIndex) {
    // Switch to flashcards tab
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector('[data-tab="flashcards"]').classList.add('active');
    document.getElementById('flashcards').classList.add('active');
    
    // Set up chat-specific view
    this.currentChatView = { chatId, chatIndex };
    this.loadChatSpecificFlashcards(chatIndex);
  }
  
  loadChatSpecificFlashcards(chatIndex) {
    const chatData = this.flashcardData[chatIndex];
    if (!chatData) return;
    
    // Update the flashcard header to show we're viewing a specific chat
    const flashcardHeader = document.querySelector('.flashcard-header');
    if (flashcardHeader) {
      const chatName = chatData.chatName || `Chat ${chatData.chatId}`;
      flashcardHeader.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <h3>${this.escapeHtml(chatName)}</h3>
          <button class="button button-secondary show-all-flashcards-btn" style="padding: 5px 10px; font-size: 12px;">
            Show All Flashcards
          </button>
        </div>
        <div class="flashcard-count" id="flashcardCount">Loading...</div>
      `;
    }
    
    // Parse flashcards for this specific chat
    const flashcards = [];
    if (chatData.csvData) {
      // Try both \n and \\n for line splitting
      let lines = chatData.csvData.split('\n').filter(line => line.trim());
      if (lines.length <= 1) {
        lines = chatData.csvData.split('\\n').filter(line => line.trim());
      }
      
      lines.forEach((line, lineIndex) => {
        const parts = this.parseCSVLine(line);
        if (parts.length >= 3) {
          flashcards.push({
            topic: parts[0],
            question: parts[1],
            answer: parts[2],
            chatIndex: chatIndex,
            lineIndex: lineIndex
          });
        }
      });
    }
    
    // Update count
    const countElement = document.getElementById('flashcardCount');
    if (countElement) {
      countElement.textContent = `${flashcards.length} flashcard${flashcards.length === 1 ? '' : 's'}`;
    }
    
    // Hide topic sidebar and show flashcards in full width
    const topicSidebar = document.querySelector('.topic-sidebar');
    const flashcardContent = document.querySelector('.flashcard-content');
    
    if (topicSidebar) topicSidebar.style.display = 'none';
    if (flashcardContent) flashcardContent.style.width = '100%';
    
    // Display flashcards
    const container = document.getElementById('flashcardContainer');
    if (flashcards.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No flashcards found in this chat</p>
        </div>
      `;
      return;
    }
    
    const flashcardHtml = flashcards.map((card, index) => `
      <div class="flashcard-item" data-card-index="${index}">
        <button class="edit-card-btn" data-chat-index="${card.chatIndex}" data-line-index="${card.lineIndex}" title="Edit flashcard">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
          </svg>
        </button>
        <button class="delete-card-btn" data-chat-index="${card.chatIndex}" data-line-index="${card.lineIndex}" title="Delete flashcard">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
        <div class="flashcard-topic">${this.escapeHtml(card.topic)}</div>
        <div class="flashcard-question">${this.escapeHtml(card.question)}</div>
        <div class="flashcard-answer">${this.escapeHtml(card.answer)}</div>
      </div>
    `).join('');
    
    container.innerHTML = `<div class="flashcard-grid">${flashcardHtml}</div>`;
    
    // Add event listeners for delete and edit buttons
    this.setupDeleteButtons();
    this.setupEditButtons();
    
    // Set up the "Show All Flashcards" button with a small delay to ensure DOM is ready
    setTimeout(() => {
      this.setupShowAllFlashcardsButton();
    }, 100);
  }
  
  showAllFlashcards() {
    try {
      console.log('showAllFlashcards called');
      
      // Reset to normal flashcard view
      this.currentChatView = null;
      
      // Show topic sidebar and reset flashcard content width
      const topicSidebar = document.querySelector('.topic-sidebar');
      const flashcardContent = document.querySelector('.flashcard-content');
      
      if (topicSidebar) {
        topicSidebar.style.display = 'block';
        console.log('Topic sidebar shown');
      } else {
        console.warn('Topic sidebar not found');
      }
      
      if (flashcardContent) {
        flashcardContent.style.width = '';
        console.log('Flashcard content width reset');
      } else {
        console.warn('Flashcard content not found');
      }
      
      // Reset header
      const flashcardHeader = document.querySelector('.flashcard-header');
      if (flashcardHeader) {
        flashcardHeader.innerHTML = `
          <h3 id="selectedTopicTitle">All Flashcards</h3>
          <div class="flashcard-count" id="flashcardCount">0 flashcards</div>
        `;
        console.log('Header reset');
      } else {
        console.warn('Flashcard header not found');
      }
      
      // Load normal flashcard view
      this.loadFlashcards();
      console.log('showAllFlashcards completed successfully');
      
    } catch (error) {
      console.error('Error in showAllFlashcards:', error);
      this.showAlert('Error switching to all flashcards view', 'error');
    }
  }
  
  loadFlashcards() {
    if (this.flashcardData.length === 0) {
      this.showEmptyFlashcards();
      return;
    }
    
    // Load topics and flashcards
    this.loadTopics();
    this.loadFlashcardsByTopic();
  }
  
  showEmptyFlashcards() {
    const topicContainer = document.getElementById('topicList');
    const flashcardContainer = document.getElementById('flashcardContainer');
    
    topicContainer.innerHTML = `
      <div class="empty-state">
        <p>No topics yet</p>
      </div>
    `;
    
    flashcardContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19M18,18V6H6V18H18Z"/>
        </svg>
        <h3>No flashcards yet</h3>
        <p>Go to ChatGPT and use the extension to generate flashcards from your conversations</p>
        <button class="button button-primary" onclick="window.open('https://chatgpt.com', '_blank')">
          Go to ChatGPT
        </button>
      </div>
    `;
  }
  
  loadTopics() {
    const topicContainer = document.getElementById('topicList');
    const flashcards = this.parseFlashcardsWithIndex();
    
    // Group flashcards by topic
    const topicGroups = {};
    flashcards.forEach(card => {
      const topic = card.topic || 'General';
      if (!topicGroups[topic]) {
        topicGroups[topic] = [];
      }
      topicGroups[topic].push(card);
    });
    
    // Create topic items
    const topics = Object.keys(topicGroups).sort();
    const totalFlashcards = flashcards.length;
    
    let topicHtml = `
      <div class="topic-item active" data-topic="all">
        <span class="topic-name">All Topics</span>
        <span class="topic-count">${totalFlashcards}</span>
      </div>
    `;
    
    topics.forEach(topic => {
      const count = topicGroups[topic].length;
      topicHtml += `
        <div class="topic-item" data-topic="${this.escapeHtml(topic)}">
          <span class="topic-name">${this.escapeHtml(topic)}</span>
          <span class="topic-count">${count}</span>
        </div>
      `;
    });
    
    topicContainer.innerHTML = topicHtml;
    
    // Add event listeners for topic selection
    this.setupTopicSelection();
    
    // Store topic groups for filtering
    this.topicGroups = topicGroups;
    this.selectedTopic = 'all';
  }
  
  setupTopicSelection() {
    const topicItems = document.querySelectorAll('.topic-item');
    
    topicItems.forEach(item => {
      item.addEventListener('click', () => {
        const topic = item.getAttribute('data-topic');
        this.selectTopic(topic);
      });
    });
  }
  
  selectTopic(topic) {
    this.selectedTopic = topic;
    
    // Update active state
    document.querySelectorAll('.topic-item').forEach(item => {
      item.classList.remove('active');
    });
    
    document.querySelector(`[data-topic="${topic}"]`).classList.add('active');
    
    // Update header
    const titleElement = document.getElementById('selectedTopicTitle');
    titleElement.textContent = topic === 'all' ? 'All Flashcards' : topic;
    
    // Load flashcards for selected topic
    this.loadFlashcardsByTopic(topic);
  }
  
  loadFlashcardsByTopic(topic = 'all') {
    const container = document.getElementById('flashcardContainer');
    const countElement = document.getElementById('flashcardCount');
    
    let flashcards;
    if (topic === 'all') {
      flashcards = this.parseFlashcardsWithIndex();
    } else {
      flashcards = this.topicGroups[topic] || [];
    }
    
    // Update count
    countElement.textContent = `${flashcards.length} flashcard${flashcards.length === 1 ? '' : 's'}`;
    
    if (flashcards.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No flashcards in this topic</p>
        </div>
      `;
      return;
    }
    
    const flashcardHtml = flashcards.map((card, index) => {
      const isCustomDeck = card.source === 'deck';
      const editBtnData = isCustomDeck ? 
        `data-deck-index="${card.deckIndex}" data-card-index="${card.cardIndex}" data-source="deck"` :
        `data-chat-index="${card.chatIndex}" data-line-index="${card.lineIndex}" data-source="chat"`;
      const deleteBtnData = editBtnData;
      
      let mediaContent = '';
      
      
      // Front media (shown with question)
      if (card.frontImage) {
        mediaContent += `<div class="card-media front-media"><img src="${card.frontImage.data}" alt="Question image" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px; margin-top: 8px;"></div>`;
      }
      if (card.frontAudio) {
        mediaContent += `<div class="card-media front-media"><audio controls style="width: 100%; margin-top: 8px;"><source src="${card.frontAudio.data}" type="${card.frontAudio.type}"></audio></div>`;
      }
      
      // Back media (shown with answer)
      if (card.image) {
        mediaContent += `<div class="card-media back-media"><img src="${card.image.data}" alt="Answer image" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px; margin-top: 8px;"></div>`;
      }
      if (card.audio) {
        mediaContent += `<div class="card-media back-media"><audio controls style="width: 100%; margin-top: 8px;"><source src="${card.audio.data}" type="${card.audio.type}"></audio></div>`;
      }
      
      return `
        <div class="flashcard-item" data-card-index="${index}">
          <button class="edit-card-btn" ${editBtnData} title="Edit flashcard">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/>
            </svg>
          </button>
          <button class="delete-card-btn" ${deleteBtnData} title="Delete flashcard">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
            </svg>
          </button>
          <div class="flashcard-topic">${this.escapeHtml(card.topic)}${isCustomDeck ? ' <span style="font-size: 10px; opacity: 0.7;">(Custom)</span>' : ''}</div>
          <div class="flashcard-question">${this.escapeHtml(card.question)}</div>
          <div class="flashcard-answer">${this.escapeHtml(card.answer)}</div>
          ${mediaContent}
        </div>
      `;
    }).join('');
    
    container.innerHTML = `<div class="flashcard-grid">${flashcardHtml}</div>`;
    
    // Add event listeners for delete and edit buttons
    this.setupDeleteButtons();
    this.setupEditButtons();
  }
  
  parseFlashcards() {
    const flashcards = [];
    
    // Parse flashcards from chat exports
    this.flashcardData.forEach(data => {
      if (data.csvData) {
        // Try both \n and \\n for line splitting
        let lines = data.csvData.split('\n').filter(line => line.trim());
        if (lines.length <= 1) {
          lines = data.csvData.split('\\n').filter(line => line.trim());
        }
        
        lines.forEach(line => {
          const parts = this.parseCSVLine(line);
          if (parts.length >= 3) {
            flashcards.push({
              topic: parts[0],
              question: parts[1],
              answer: parts[2]
            });
          }
        });
      }
    });
    
    // Parse flashcards from custom decks
    this.customDecks.forEach(deck => {
      if (deck.cards && Array.isArray(deck.cards)) {
        deck.cards.forEach(card => {
          flashcards.push({
            topic: deck.name,
            question: card.front,
            answer: card.back
          });
        });
      }
    });
    
    return flashcards;
  }
  
  parseFlashcardsWithIndex() {
    const flashcards = [];
    
    // Parse flashcards from chat exports
    this.flashcardData.forEach((data, chatIndex) => {
      // Check if we have structured cards with media support
      if (data.structuredCards && Array.isArray(data.structuredCards)) {
        data.structuredCards.forEach((card, lineIndex) => {
          flashcards.push({
            topic: card.topic,
            question: card.question,
            answer: card.answer,
            chatIndex: chatIndex,
            lineIndex: lineIndex,
            source: 'chat',
            frontImage: card.frontImage,
            frontAudio: card.frontAudio,
            image: card.image,
            audio: card.audio
          });
        });
      } else if (data.csvData) {
        // Fallback to CSV parsing for backward compatibility
        let lines = data.csvData.split('\n').filter(line => line.trim());
        if (lines.length <= 1) {
          lines = data.csvData.split('\\n').filter(line => line.trim());
        }
        
        lines.forEach((line, lineIndex) => {
          const parts = this.parseCSVLine(line);
          if (parts.length >= 3) {
            flashcards.push({
              topic: parts[0],
              question: parts[1],
              answer: parts[2],
              chatIndex: chatIndex,
              lineIndex: lineIndex,
              source: 'chat'
            });
          }
        });
      }
    });
    
    // Parse flashcards from custom decks
    this.customDecks.forEach((deck, deckIndex) => {
      if (deck.cards && Array.isArray(deck.cards)) {
        deck.cards.forEach((card, cardIndex) => {
          const flashcard = {
            topic: deck.name,
            question: card.front,
            answer: card.back,
            deckIndex: deckIndex,
            cardIndex: cardIndex,
            source: 'deck',
            frontImage: card.frontImage,
            frontAudio: card.frontAudio,
            image: card.image,
            audio: card.audio
          };
          
          
          flashcards.push(flashcard);
        });
      }
    });
    
    return flashcards;
  }
  
  setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll('.delete-card-btn');
    console.log('Setting up delete buttons, found:', deleteButtons.length);
    
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const source = button.getAttribute('data-source');
        
        if (source === 'deck') {
          const deckIndex = parseInt(button.getAttribute('data-deck-index'));
          const cardIndex = parseInt(button.getAttribute('data-card-index'));
          console.log('Delete deck card button clicked:', { deckIndex, cardIndex });
          
          if (confirm('Are you sure you want to delete this flashcard?')) {
            this.deleteDeckCard(deckIndex, cardIndex);
          }
        } else {
          const chatIndex = parseInt(button.getAttribute('data-chat-index'));
          const lineIndex = parseInt(button.getAttribute('data-line-index'));
          console.log('Delete chat card button clicked:', { chatIndex, lineIndex });
          
          if (confirm('Are you sure you want to delete this flashcard?')) {
            this.deleteFlashcard(chatIndex, lineIndex);
          }
        }
      });
    });
  }
  
  setupEditButtons() {
    const editButtons = document.querySelectorAll('.edit-card-btn');
    console.log('Setting up edit buttons, found:', editButtons.length);
    
    editButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const source = button.getAttribute('data-source');
        
        if (source === 'deck') {
          const deckIndex = parseInt(button.getAttribute('data-deck-index'));
          const cardIndex = parseInt(button.getAttribute('data-card-index'));
          console.log('Edit deck card button clicked:', { deckIndex, cardIndex });
          
          this.openEditModalForDeckCard(deckIndex, cardIndex);
        } else {
          const chatIndex = parseInt(button.getAttribute('data-chat-index'));
          const lineIndex = parseInt(button.getAttribute('data-line-index'));
          console.log('Edit chat card button clicked:', { chatIndex, lineIndex });
          
          this.openEditModal(chatIndex, lineIndex);
        }
      });
    });
  }
  
  setupShowAllFlashcardsButton() {
    const showAllButton = document.querySelector('.show-all-flashcards-btn');
    if (showAllButton) {
      // Remove any existing event listeners
      showAllButton.replaceWith(showAllButton.cloneNode(true));
      const newButton = document.querySelector('.show-all-flashcards-btn');
      
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Show All Flashcards button clicked');
        this.showAllFlashcards();
      });
      
      console.log('Show All Flashcards button event listener attached');
    } else {
      console.warn('Show All Flashcards button not found');
    }
    
    // Also set up event delegation as backup
    document.removeEventListener('click', this.showAllFlashcardsHandler);
    this.showAllFlashcardsHandler = (e) => {
      if (e.target.matches('.show-all-flashcards-btn') || e.target.closest('.show-all-flashcards-btn')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Show All Flashcards button clicked via delegation');
        this.showAllFlashcards();
      }
    };
    document.addEventListener('click', this.showAllFlashcardsHandler);
  }
  
  updateCSVPreview() {
    const preview = document.getElementById('csvPreview');
    
    if (this.flashcardData.length === 0) {
      preview.textContent = 'No data available. Process some chats first.';
      return;
    }
    
    const csvData = this.generateCSV();
    preview.textContent = csvData;
  }
  
  generateCSV() {
    const flashcards = this.parseFlashcards();
    const csvHeader = 'Topic,Question,Answer\n';
    const csvRows = flashcards.map(card => 
      `"${card.topic.replace(/"/g, '""')}","${card.question.replace(/"/g, '""')}","${card.answer.replace(/"/g, '""')}"`
    ).join('\n');
    
    return csvHeader + csvRows;
  }
  
  loadSettings() {
    document.getElementById('maxFlashcards').value = this.settings.maxFlashcards;
    document.getElementById('defaultTopic').value = this.settings.defaultTopic;
    document.getElementById('detectionStrategy').value = this.settings.detectionStrategy;
    document.getElementById('defaultExportFormat').value = this.settings.defaultExportFormat;
    document.getElementById('ankiDeckName').value = this.settings.ankiDeckName;
    document.getElementById('customPrompt').value = this.settings.customPrompt;
    document.getElementById('contextPrompt').value = this.settings.contextPrompt;
  }
  
  setupEventListeners() {
    // Flashcard management
    document.getElementById('refreshFlashcards').addEventListener('click', () => {
      this.loadData();
    });
    
    document.getElementById('clearFlashcards').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all flashcards? This action cannot be undone.')) {
        this.clearAllFlashcards();
      }
    });
    
    // Export buttons
    document.getElementById('exportCSV').addEventListener('click', () => {
      this.exportCSV();
    });
    
    document.getElementById('exportAnki').addEventListener('click', () => {
      this.exportAnkiPackage();
    });
    
    document.getElementById('exportForAnkiAddon').addEventListener('click', () => {
      this.exportForAnkiAddon();
    });
    
    document.getElementById('addonInstructions').addEventListener('click', (e) => {
      e.preventDefault();
      this.showAddonInstructions();
    });
    
    // Settings buttons
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });
    
    document.getElementById('resetSettings').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all settings to defaults?')) {
        this.resetSettings();
      }
    });
    
    // Prompt customization
    document.getElementById('resetPrompt').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the prompt to the default template?')) {
        this.resetPrompt();
      }
    });
    
    document.getElementById('testPrompt').addEventListener('click', () => {
      this.testPrompt();
    });
    
    // Context prompt customization
    document.getElementById('resetContextPrompt').addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the context prompt to the default template?')) {
        this.resetContextPrompt();
      }
    });
    
    document.getElementById('testContextPrompt').addEventListener('click', () => {
      this.testContextPrompt();
    });
  }
  
  async clearAllFlashcards() {
    try {
      // Clear all flashcard-related data
      await this.setStorageData({ 
        flashcardData: [],
        customDecks: [],
        structuredCards: []
      });
      this.flashcardData = [];
      this.customDecks = [];
      this.loadData();
      this.showAlert('All flashcards and custom decks cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing flashcards:', error);
      this.showAlert('Error clearing flashcards', 'error');
    }
  }
  
  async deleteDeckCard(deckIndex, cardIndex) {
    console.log('deleteDeckCard called with:', { deckIndex, cardIndex });
    console.log('Current customDecks:', this.customDecks);
    
    try {
      if (deckIndex >= 0 && deckIndex < this.customDecks.length) {
        const deck = this.customDecks[deckIndex];
        console.log('Deck data:', deck);
        
        if (deck.cards && Array.isArray(deck.cards)) {
          console.log('Cards before deletion:', deck.cards);
          
          if (cardIndex >= 0 && cardIndex < deck.cards.length) {
            console.log('Deleting card:', deck.cards[cardIndex]);
            
            // Remove the specific card
            deck.cards.splice(cardIndex, 1);
            
            console.log('Cards after deletion:', deck.cards);
            
            // If no cards left, remove the entire deck
            if (deck.cards.length === 0) {
              console.log('No cards left, removing entire deck');
              this.customDecks.splice(deckIndex, 1);
            }
            
            // Save updated data
            console.log('Saving updated customDecks:', this.customDecks);
            await this.setStorageData({ customDecks: this.customDecks });
            
            // Reload the display
            this.loadData();
            this.showAlert('Flashcard deleted successfully', 'success');
          } else {
            console.error('Invalid card index:', cardIndex, 'for cards:', deck.cards);
            this.showAlert('Invalid flashcard index', 'error');
          }
        } else {
          console.error('No cards found for deck:', deckIndex);
          this.showAlert('No flashcard data found', 'error');
        }
      } else {
        console.error('Invalid deck index:', deckIndex, 'for customDecks length:', this.customDecks.length);
        this.showAlert('Invalid deck index', 'error');
      }
    } catch (error) {
      console.error('Error deleting deck card:', error);
      this.showAlert('Error deleting flashcard', 'error');
    }
  }

  async deleteFlashcard(chatIndex, lineIndex) {
    console.log('deleteFlashcard called with:', { chatIndex, lineIndex });
    console.log('Current flashcardData:', this.flashcardData);
    
    try {
      if (chatIndex >= 0 && chatIndex < this.flashcardData.length) {
        const data = this.flashcardData[chatIndex];
        console.log('Chat data:', data);
        
        if (data.csvData) {
          // Try both \n and \\n for line splitting
          let lines = data.csvData.split('\n').filter(line => line.trim());
          if (lines.length <= 1) {
            lines = data.csvData.split('\\n').filter(line => line.trim());
          }
          console.log('Lines before deletion:', lines);
          
          if (lineIndex >= 0 && lineIndex < lines.length) {
            console.log('Deleting line:', lines[lineIndex]);
            
            // Remove the specific line
            lines.splice(lineIndex, 1);
            
            // Update the CSV data
            data.csvData = lines.join('\n');
            
            console.log('Lines after deletion:', lines);
            
            // If no lines left, remove the entire chat data
            if (lines.length === 0) {
              console.log('No lines left, removing entire chat data');
              this.flashcardData.splice(chatIndex, 1);
            }
            
            // Save updated data
            console.log('Saving updated data:', this.flashcardData);
            await this.setStorageData({ flashcardData: this.flashcardData });
            
            // Reload the display
            this.loadData();
            this.showAlert('Flashcard deleted successfully', 'success');
          } else {
            console.error('Invalid line index:', lineIndex, 'for lines:', lines);
            this.showAlert('Invalid flashcard index', 'error');
          }
        } else {
          console.error('No CSV data found for chat:', chatIndex);
          this.showAlert('No flashcard data found', 'error');
        }
      } else {
        console.error('Invalid chat index:', chatIndex, 'for flashcardData length:', this.flashcardData.length);
        this.showAlert('Invalid chat index', 'error');
      }
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      this.showAlert('Error deleting flashcard', 'error');
    }
  }
  
  openEditModal(chatIndex, lineIndex) {
    console.log('Opening edit modal for chat card:', { chatIndex, lineIndex });
    
    try {
      // Get the flashcard data
      const flashcard = this.getFlashcardByIndex(chatIndex, lineIndex);
      if (!flashcard) {
        this.showAlert('Flashcard not found', 'error');
        return;
      }
      
      // Store the current edit context
      this.currentEditContext = { 
        type: 'chat',
        chatIndex, 
        lineIndex, 
        originalTopic: flashcard.topic 
      };
      
      // Show topic field for chat cards
      document.getElementById('editTopicGroup').style.display = 'block';
      
      // Populate the form
      document.getElementById('editTopic').value = flashcard.topic;
      document.getElementById('editQuestion').value = flashcard.question;
      document.getElementById('editAnswer').value = flashcard.answer;
      
      // Clear and setup media fields for chat cards too
      this.clearEditMediaFields();
      // Note: Chat cards don't have existing media, but we can add media through editing
      this.populateEditMediaFields(flashcard);
      
      // Show the modal
      document.getElementById('editModal').classList.add('active');
      
      // Set up modal event listeners if not already set up
      this.setupEditModalListeners();
      
    } catch (error) {
      console.error('Error opening edit modal:', error);
      this.showAlert('Error opening edit modal', 'error');
    }
  }

  openEditModalForDeckCard(deckIndex, cardIndex) {
    console.log('Opening edit modal for deck card:', { deckIndex, cardIndex });
    
    try {
      // Get the deck card data
      const card = this.getDeckCardByIndex(deckIndex, cardIndex);
      if (!card) {
        this.showAlert('Deck card not found', 'error');
        return;
      }
      
      // Store the current edit context
      this.currentEditContext = { 
        type: 'deck',
        deckIndex, 
        cardIndex 
      };
      
      // Hide topic field for deck cards (deck name is used as topic)
      document.getElementById('editTopicGroup').style.display = 'none';
      
      // Populate the form
      document.getElementById('editQuestion').value = card.front || '';
      document.getElementById('editAnswer').value = card.back || '';
      
      // Clear and setup media fields
      this.clearEditMediaFields();
      this.populateEditMediaFields(card);
      
      // Show the modal
      document.getElementById('editModal').classList.add('active');
      
      // Set up modal event listeners if not already set up
      this.setupEditModalListeners();
      
    } catch (error) {
      console.error('Error opening edit modal for deck card:', error);
      this.showAlert('Error opening edit modal', 'error');
    }
  }
  
  setupEditModalListeners() {
    // Prevent multiple event listeners
    if (this.editModalListenersSetup) return;
    this.editModalListenersSetup = true;
    
    const modal = document.getElementById('editModal');
    const closeBtn = document.getElementById('editModalClose');
    const cancelBtn = document.getElementById('editCancel');
    const form = document.getElementById('editForm');
    
    // Close modal events
    const closeModal = () => {
      modal.classList.remove('active');
      this.currentEditContext = null;
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
    
    // File upload handlers
    this.setupEditFileUploadHandlers();
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveFlashcardEdit();
    });
  }

  setupEditFileUploadHandlers() {
    // Front image upload
    document.getElementById('editFrontImage').addEventListener('change', (e) => {
      this.handleEditFileUpload(e, 'editFrontImage', 'Front Image');
    });
    
    // Front audio upload
    document.getElementById('editFrontAudio').addEventListener('change', (e) => {
      this.handleEditFileUpload(e, 'editFrontAudio', 'Front Audio');
    });
    
    // Back image upload
    document.getElementById('editBackImage').addEventListener('change', (e) => {
      this.handleEditFileUpload(e, 'editBackImage', 'Back Image');
    });
    
    // Back audio upload
    document.getElementById('editBackAudio').addEventListener('change', (e) => {
      this.handleEditFileUpload(e, 'editBackAudio', 'Back Audio');
    });
  }

  handleEditFileUpload(event, inputId, defaultText) {
    const file = event.target.files[0];
    const label = document.querySelector(`label[for="${inputId}"]`);
    
    if (file && label) {
      // Update label to show file selected
      label.innerHTML = `
        <svg class="file-upload-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z"/>
        </svg>
        ${file.name}
      `;
      label.style.color = '#10a37f';
      
      // Show preview based on file type
      this.showEditFilePreview(file, inputId);
    } else if (label) {
      this.resetFileUploadLabel(inputId, defaultText);
      this.clearEditFilePreview(inputId);
    }
  }
  
  showEditFilePreview(file, inputId) {
    const fileReader = new FileReader();
    const isImage = file.type.startsWith('image/');
    const isAudio = file.type.startsWith('audio/');
    
    // Determine preview container based on input ID
    let previewContainer;
    if (inputId.includes('Front')) {
      previewContainer = document.getElementById('editFrontMediaPreview');
    } else {
      previewContainer = document.getElementById('editBackMediaPreview');
    }
    
    if (!previewContainer) return;
    
    fileReader.onload = (e) => {
      const result = e.target.result;
      
      if (isImage) {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'edit-file-preview';
        previewDiv.style.marginTop = '8px';
        previewDiv.innerHTML = `
          <small style="color: #6b7280;">New ${inputId.includes('Front') ? 'front' : 'back'} image:</small><br>
          <img src="${result}" alt="Preview" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid #10a37f;">
        `;
        
        // Clear any existing preview for this input and add new one
        this.clearEditFilePreview(inputId);
        previewContainer.appendChild(previewDiv);
        
      } else if (isAudio) {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'edit-file-preview';
        previewDiv.style.marginTop = '8px';
        previewDiv.innerHTML = `
          <small style="color: #6b7280;">New ${inputId.includes('Front') ? 'front' : 'back'} audio:</small><br>
          <audio controls style="width: 100%; max-width: 200px; border: 2px solid #10a37f; border-radius: 4px;">
            <source src="${result}" type="${file.type}">
          </audio>
        `;
        
        // Clear any existing preview for this input and add new one
        this.clearEditFilePreview(inputId);
        previewContainer.appendChild(previewDiv);
      }
    };
    
    fileReader.readAsDataURL(file);
  }
  
  clearEditFilePreview(inputId) {
    // Find the preview container
    let previewContainer;
    if (inputId.includes('Front')) {
      previewContainer = document.getElementById('editFrontMediaPreview');
    } else {
      previewContainer = document.getElementById('editBackMediaPreview');
    }
    
    if (previewContainer) {
      // Remove only the new preview elements, keep existing media previews
      const newPreviews = previewContainer.querySelectorAll('.edit-file-preview');
      newPreviews.forEach(preview => preview.remove());
    }
  }
  
  getFlashcardByIndex(chatIndex, lineIndex) {
    try {
      if (chatIndex >= 0 && chatIndex < this.flashcardData.length) {
        const data = this.flashcardData[chatIndex];
        
        if (data.csvData) {
          // Try both \n and \\n for line splitting
          let lines = data.csvData.split('\n').filter(line => line.trim());
          if (lines.length <= 1) {
            lines = data.csvData.split('\\n').filter(line => line.trim());
          }
          
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const line = lines[lineIndex];
            const parts = this.parseCSVLine(line);
            
            if (parts.length >= 3) {
              return {
                topic: parts[0],
                question: parts[1],
                answer: parts[2]
              };
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting flashcard by index:', error);
      return null;
    }
  }

  getDeckCardByIndex(deckIndex, cardIndex) {
    try {
      if (deckIndex >= 0 && deckIndex < this.customDecks.length) {
        const deck = this.customDecks[deckIndex];
        
        if (deck.cards && Array.isArray(deck.cards)) {
          if (cardIndex >= 0 && cardIndex < deck.cards.length) {
            return deck.cards[cardIndex];
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting deck card by index:', error);
      return null;
    }
  }

  clearEditMediaFields() {
    // Clear file inputs
    document.getElementById('editFrontImage').value = '';
    document.getElementById('editFrontAudio').value = '';
    document.getElementById('editBackImage').value = '';
    document.getElementById('editBackAudio').value = '';
    
    // Reset labels
    this.resetFileUploadLabel('editFrontImage', 'Front Image');
    this.resetFileUploadLabel('editFrontAudio', 'Front Audio');
    this.resetFileUploadLabel('editBackImage', 'Back Image');
    this.resetFileUploadLabel('editBackAudio', 'Back Audio');
    
    // Clear previews
    document.getElementById('editFrontMediaPreview').innerHTML = '';
    document.getElementById('editBackMediaPreview').innerHTML = '';
  }

  populateEditMediaFields(card) {
    // Show existing media in previews
    if (card.frontImage) {
      document.getElementById('editFrontMediaPreview').innerHTML = `
        <div style="margin-top: 4px;">
          <small style="color: #6b7280;">Current front image:</small><br>
          <img src="${card.frontImage.data}" alt="Front image" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;">
        </div>
      `;
    }
    
    if (card.frontAudio) {
      document.getElementById('editFrontMediaPreview').innerHTML += `
        <div style="margin-top: 4px;">
          <small style="color: #6b7280;">Current front audio:</small><br>
          <audio controls style="width: 100%; max-width: 200px;">
            <source src="${card.frontAudio.data}" type="${card.frontAudio.type}">
          </audio>
        </div>
      `;
    }
    
    if (card.image) {
      document.getElementById('editBackMediaPreview').innerHTML = `
        <div style="margin-top: 4px;">
          <small style="color: #6b7280;">Current back image:</small><br>
          <img src="${card.image.data}" alt="Back image" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 4px;">
        </div>
      `;
    }
    
    if (card.audio) {
      document.getElementById('editBackMediaPreview').innerHTML += `
        <div style="margin-top: 4px;">
          <small style="color: #6b7280;">Current back audio:</small><br>
          <audio controls style="width: 100%; max-width: 200px;">
            <source src="${card.audio.data}" type="${card.audio.type}">
          </audio>
        </div>
      `;
    }
  }

  resetFileUploadLabel(inputId, defaultText) {
    const label = document.querySelector(`label[for="${inputId}"]`);
    if (label) {
      const icon = label.querySelector('.file-upload-icon');
      label.innerHTML = '';
      if (icon) label.appendChild(icon.cloneNode(true));
      label.appendChild(document.createTextNode(defaultText));
      label.style.color = '#6b7280';
    }
  }
  
  async saveFlashcardEdit() {
    if (!this.currentEditContext) {
      this.showAlert('No edit context available', 'error');
      return;
    }
    
    try {
      if (this.currentEditContext.type === 'chat') {
        await this.saveChatCardEdit();
      } else if (this.currentEditContext.type === 'deck') {
        await this.saveDeckCardEdit();
      }
      
    } catch (error) {
      console.error('Error saving flashcard edit:', error);
      this.showAlert('Error saving changes', 'error');
    }
  }

  async saveChatCardEdit() {
    const { chatIndex, lineIndex, originalTopic } = this.currentEditContext;
    
    // Get form values
    const newTopic = document.getElementById('editTopic').value.trim();
    const newQuestion = document.getElementById('editQuestion').value.trim();
    const newAnswer = document.getElementById('editAnswer').value.trim();
    
    // Validate input
    if (!newTopic || !newQuestion || !newAnswer) {
      this.showAlert('All fields are required', 'error');
      return;
    }
    
    // Get current chat flashcard data to preserve existing media
    const currentCard = this.getFlashcardByIndex(chatIndex, lineIndex);
    if (!currentCard) {
      this.showAlert('Card not found', 'error');
      return;
    }
    
    // Process media files (only updates if new files are selected)
    const newMediaData = await this.processEditMediaFiles();
    
    // Merge with existing media data (chat cards may not have existing media)
    const mediaData = {
      frontImage: newMediaData.frontImage || currentCard.frontImage,
      frontAudio: newMediaData.frontAudio || currentCard.frontAudio,
      image: newMediaData.image || currentCard.image,
      audio: newMediaData.audio || currentCard.audio
    };
    
    console.log('Chat card final media data for save:', mediaData);
    
    // Update the flashcard data with media support
    const success = await this.updateFlashcardWithMedia(chatIndex, lineIndex, newTopic, newQuestion, newAnswer, mediaData);
    
    if (success) {
      // Close modal
      document.getElementById('editModal').classList.remove('active');
      this.currentEditContext = null;
      
      // Check if topic changed
      const topicChanged = originalTopic !== newTopic;
      
      // Reload data and update display
      await this.loadData();
      
      if (topicChanged) {
        this.loadTopics();
        this.selectTopic('all');
      } else {
        this.loadFlashcardsByTopic(this.selectedTopic);
      }
      
      this.showAlert('Flashcard updated successfully', 'success');
    }
  }

  async saveDeckCardEdit() {
    const { deckIndex, cardIndex } = this.currentEditContext;
    
    // Get form values
    const newFront = document.getElementById('editQuestion').value.trim();
    const newBack = document.getElementById('editAnswer').value.trim();
    
    // Validate input
    if (!newFront || !newBack) {
      this.showAlert('Front and back text are required', 'error');
      return;
    }
    
    // Get the current card to preserve existing media
    const currentCard = this.getDeckCardByIndex(deckIndex, cardIndex);
    if (!currentCard) {
      this.showAlert('Card not found', 'error');
      return;
    }
    
    // Process media files (only updates if new files are selected)
    const newMediaData = await this.processEditMediaFiles();
    
    // Merge with existing media data
    const mediaData = {
      frontImage: newMediaData.frontImage || currentCard.frontImage,
      frontAudio: newMediaData.frontAudio || currentCard.frontAudio,
      image: newMediaData.image || currentCard.image,
      audio: newMediaData.audio || currentCard.audio
    };
    
    console.log('Final media data for save:', mediaData);
    
    // Update the deck card data
    const success = await this.updateDeckCard(deckIndex, cardIndex, newFront, newBack, mediaData);
    
    if (success) {
      // Close modal
      document.getElementById('editModal').classList.remove('active');
      this.currentEditContext = null;
      
      // Reload data and update display
      await this.loadData();
      console.log('Data reloaded, custom decks:', this.customDecks);
      
      // Force rebuild of topic groups
      this.loadTopics();
      this.loadFlashcardsByTopic(this.selectedTopic);
      
      this.showAlert('Deck card updated successfully', 'success');
    }
  }

  async processEditMediaFiles() {
    const frontImageFile = document.getElementById('editFrontImage').files[0];
    const frontAudioFile = document.getElementById('editFrontAudio').files[0];
    const backImageFile = document.getElementById('editBackImage').files[0];
    const backAudioFile = document.getElementById('editBackAudio').files[0];
    
    console.log('Processing edit media files:', {
      frontImageFile: frontImageFile ? frontImageFile.name : 'none',
      frontAudioFile: frontAudioFile ? frontAudioFile.name : 'none',
      backImageFile: backImageFile ? backImageFile.name : 'none',
      backAudioFile: backAudioFile ? backAudioFile.name : 'none'
    });
    
    const mediaData = {};
    
    if (frontImageFile) {
      mediaData.frontImage = await this.fileToBase64(frontImageFile);
      console.log('Processed front image:', mediaData.frontImage.name);
    }
    
    if (frontAudioFile) {
      mediaData.frontAudio = await this.fileToBase64(frontAudioFile);
      console.log('Processed front audio:', mediaData.frontAudio.name);
    }
    
    if (backImageFile) {
      mediaData.image = await this.fileToBase64(backImageFile);
      console.log('Processed back image:', mediaData.image.name);
    }
    
    if (backAudioFile) {
      mediaData.audio = await this.fileToBase64(backAudioFile);
      console.log('Processed back audio:', mediaData.audio.name);
    }
    
    console.log('Final media data:', Object.keys(mediaData));
    return mediaData;
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          type: file.type,
          data: reader.result
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  
  async updateDeckCard(deckIndex, cardIndex, newFront, newBack, mediaData) {
    console.log('Updating deck card:', { deckIndex, cardIndex, newFront, newBack, mediaData });
    
    try {
      if (deckIndex >= 0 && deckIndex < this.customDecks.length) {
        const deck = this.customDecks[deckIndex];
        
        if (deck.cards && Array.isArray(deck.cards)) {
          if (cardIndex >= 0 && cardIndex < deck.cards.length) {
            const card = deck.cards[cardIndex];
            
            console.log('Before update - card data:', {
              front: card.front,
              back: card.back,
              frontImage: card.frontImage ? 'present' : 'none',
              frontAudio: card.frontAudio ? 'present' : 'none',
              image: card.image ? 'present' : 'none',
              audio: card.audio ? 'present' : 'none'
            });
            
            // Update card data
            card.front = newFront;
            card.back = newBack;
            
            // Update all media data (includes existing media preservation)
            card.frontImage = mediaData.frontImage;
            card.frontAudio = mediaData.frontAudio;
            card.image = mediaData.image;
            card.audio = mediaData.audio;
            
            console.log('After update - card data:', {
              front: card.front,
              back: card.back,
              frontImage: card.frontImage ? 'present' : 'none',
              frontAudio: card.frontAudio ? 'present' : 'none',
              image: card.image ? 'present' : 'none',
              audio: card.audio ? 'present' : 'none'
            });
            
            // Save updated data
            await this.setStorageData({ customDecks: this.customDecks });
            
            console.log('Deck card updated successfully and saved to storage');
            return true;
          }
        }
      }
      
      console.error('Invalid deck card indices or data structure');
      return false;
      
    } catch (error) {
      console.error('Error updating deck card:', error);
      return false;
    }
  }

  async updateFlashcard(chatIndex, lineIndex, newTopic, newQuestion, newAnswer) {
    console.log('Updating flashcard:', { chatIndex, lineIndex, newTopic, newQuestion, newAnswer });
    
    try {
      if (chatIndex >= 0 && chatIndex < this.flashcardData.length) {
        const data = this.flashcardData[chatIndex];
        
        if (data.csvData) {
          // Try both \n and \\n for line splitting
          let lines = data.csvData.split('\n').filter(line => line.trim());
          if (lines.length <= 1) {
            lines = data.csvData.split('\\n').filter(line => line.trim());
          }
          
          if (lineIndex >= 0 && lineIndex < lines.length) {
            // Create new CSV line with updated data (properly quoted)
            const newLine = `"${newTopic.replace(/"/g, '""')}","${newQuestion.replace(/"/g, '""')}","${newAnswer.replace(/"/g, '""')}"`;
            
            // Update the line
            lines[lineIndex] = newLine;
            
            // Update the CSV data (use the same separator that was used to split)
            data.csvData = lines.join('\n');
            
            // Save updated data
            await this.setStorageData({ flashcardData: this.flashcardData });
            
            console.log('Flashcard updated successfully');
            return true;
          }
        }
      }
      
      console.error('Invalid flashcard indices or data structure');
      return false;
      
    } catch (error) {
      console.error('Error updating flashcard:', error);
      return false;
    }
  }
  
  async updateFlashcardWithMedia(chatIndex, lineIndex, newTopic, newQuestion, newAnswer, mediaData) {
    console.log('Updating chat flashcard with media:', { chatIndex, lineIndex, newTopic, newQuestion, newAnswer, mediaData });
    
    try {
      if (chatIndex >= 0 && chatIndex < this.flashcardData.length) {
        const chatData = this.flashcardData[chatIndex];
        
        // Check if this chat data already has a structured cards array
        if (!chatData.structuredCards) {
          // Convert CSV data to structured format
          chatData.structuredCards = this.convertCsvToStructuredCards(chatData.csvData);
        }
        
        // Update the specific card in the structured format
        if (lineIndex >= 0 && lineIndex < chatData.structuredCards.length) {
          const card = chatData.structuredCards[lineIndex];
          
          console.log('Before update - chat card data:', {
            topic: card.topic,
            question: card.question,
            answer: card.answer,
            frontImage: card.frontImage ? 'present' : 'none',
            frontAudio: card.frontAudio ? 'present' : 'none',
            image: card.image ? 'present' : 'none',
            audio: card.audio ? 'present' : 'none'
          });
          
          // Update card data
          card.topic = newTopic;
          card.question = newQuestion;
          card.answer = newAnswer;
          
          // Update all media data
          card.frontImage = mediaData.frontImage;
          card.frontAudio = mediaData.frontAudio;
          card.image = mediaData.image;
          card.audio = mediaData.audio;
          
          console.log('After update - chat card data:', {
            topic: card.topic,
            question: card.question,
            answer: card.answer,
            frontImage: card.frontImage ? 'present' : 'none',
            frontAudio: card.frontAudio ? 'present' : 'none',
            image: card.image ? 'present' : 'none',
            audio: card.audio ? 'present' : 'none'
          });
          
          // Update the CSV data to keep backward compatibility
          chatData.csvData = this.convertStructuredCardsToCsv(chatData.structuredCards);
          
          // Save updated data
          await this.setStorageData({ flashcardData: this.flashcardData });
          
          console.log('Chat flashcard with media updated successfully and saved to storage');
          return true;
        }
      }
      
      console.error('Invalid chat flashcard indices or data structure');
      return false;
      
    } catch (error) {
      console.error('Error updating chat flashcard with media:', error);
      return false;
    }
  }
  
  convertCsvToStructuredCards(csvData) {
    const cards = [];
    
    if (!csvData) return cards;
    
    // Try both \n and \\n for line splitting
    let lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length <= 1) {
      lines = csvData.split('\\n').filter(line => line.trim());
    }
    
    lines.forEach(line => {
      const parts = this.parseCSVLine(line);
      if (parts.length >= 3) {
        cards.push({
          topic: parts[0],
          question: parts[1],
          answer: parts[2],
          frontImage: null,
          frontAudio: null,
          image: null,
          audio: null
        });
      }
    });
    
    return cards;
  }
  
  convertStructuredCardsToCsv(structuredCards) {
    return structuredCards.map(card => {
      // Create CSV line with properly quoted text (ignore media for CSV export)
      return `"${card.topic.replace(/"/g, '""')}","${card.question.replace(/"/g, '""')}","${card.answer.replace(/"/g, '""')}"`;
    }).join('\n');
  }
  
  exportCSV() {
    if (this.flashcardData.length === 0) {
      this.showAlert('No flashcards to export', 'error');
      return;
    }
    
    const csvData = this.generateCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `chatgpt-flashcards-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showAlert('CSV exported successfully', 'success');
  }
  
  async exportAnkiPackage() {
    if (this.flashcardData.length === 0) {
      this.showAlert('No flashcards to export', 'error');
      return;
    }
    
    try {
      // Initialize Anki package generator
      const generator = new AnkiPackageGenerator();
      
      // Initialize SQL.js
      await generator.initializeSQL();
      
      // Parse flashcard data with media support
      const flashcards = this.parseFlashcardsWithIndex();
      
      // Validate flashcard data
      const validation = generator.validateFlashcardData(flashcards);
      if (!validation.valid) {
        this.showAlert(`Validation failed: ${validation.errors.join(', ')}`, 'error');
        return;
      }
      
      if (validation.warnings.length > 0) {
        console.warn('Flashcard warnings:', validation.warnings);
      }
      
      // Generate and download Anki package
      const deckName = this.settings.ankiDeckName || 'ChatGPT Flashcards';
      await generator.downloadAnkiPackage(flashcards, deckName);
      
      this.showAlert('Anki package exported successfully!', 'success');
      
    } catch (error) {
      console.error('Error exporting Anki package:', error);
      this.showAlert('Error creating Anki package. Make sure genanki.js is loaded.', 'error');
    }
  }
  
  // Generate signed filename for Anki addon
  generateSignedFilename() {
    const now = new Date();
    const timestamp = now.toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}Z$/, '')
      .slice(0, 15); // Format: 20240115103045
    
    const secretKey = "chatgpt-anki-extension-2024";
    const payload = secretKey + timestamp;
    
    // Simple hash function (we'll use a basic implementation since crypto.subtle might not be available)
    const hash = this.simpleHash(payload).substring(0, 10);
    
    return `${hash}-${timestamp}.apkg`;
  }
  
  // Simple hash function for filename signing
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(10, '0');
  }
  
  async exportForAnkiAddon() {
    if (this.flashcardData.length === 0) {
      this.showAlert('No flashcards to export', 'error');
      return;
    }
    
    try {
      // Generate signed filename
      const filename = this.generateSignedFilename();
      console.log('Generated signed filename:', filename);
      
      // Initialize Anki package generator
      const generator = new AnkiPackageGenerator();
      console.log('Initializing SQL.js for Anki addon export...');
      await generator.initializeSQL();
      console.log('SQL.js initialized successfully for Anki addon export');
      
      // Parse flashcard data with media support
      const flashcards = this.parseFlashcardsWithIndex();
      console.log('Parsed flashcards for Anki addon:', flashcards.length);
      
      // Validate flashcard data
      const validation = generator.validateFlashcardData(flashcards);
      if (!validation.valid) {
        console.error('Validation failed:', validation.errors);
        this.showAlert(`Validation failed: ${validation.errors.join(', ')}`, 'error');
        return;
      }
      console.log('Validation passed for Anki addon export');
      
      // Generate and download Anki package with signed filename
      const deckName = this.settings.ankiDeckName || 'ChatGPT Flashcards';
      console.log('Creating Anki package with signed filename:', filename);
      await generator.downloadAnkiPackage(flashcards, deckName, filename);
      
      this.showAlert('Anki package exported to Downloads! The Anki addon will automatically import it.', 'success');
      
    } catch (error) {
      console.error('Error exporting for Anki addon:', error);
      this.showAlert(`Error creating Anki package for addon: ${error.message}`, 'error');
    }
  }
  
  showAddonInstructions() {
    const instructions = `
      <div style="max-width: 600px; line-height: 1.6;">
        <h3 style="margin-top: 0;">ChatGPT Anki Sync Addon Installation</h3>
        
        <h4>Step 1: Download the Addon</h4>
        <p>Download the addon files from the extension folder and install in Anki.</p>
        
        <h4>Step 2: Install in Anki</h4>
        <ol>
          <li>Open Anki Desktop</li>
          <li>Go to Tools → Add-ons</li>
          <li>Click "Install from file..."</li>
          <li>Select the addon .ankiaddon file</li>
          <li>Restart Anki</li>
        </ol>
        
        <h4>Step 3: Usage</h4>
        <ol>
          <li>Make sure Anki is running</li>
          <li>Use "Export for Anki Addon" button in this extension</li>
          <li>The addon will automatically import new flashcards</li>
          <li>Sync to AnkiWeb using Anki's built-in sync</li>
        </ol>
        
        <h4>Addon Settings</h4>
        <p>Configure the addon behavior in Tools → Add-ons → ChatGPT Anki Sync → Config</p>
        
        <p style="color: #10a37f; font-weight: 500;">
          The addon monitors your Downloads folder and automatically imports .apkg files created by this extension.
        </p>
      </div>
    `;
    
    // Create a modal to show instructions
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 80%;
      max-height: 80%;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;
    
    content.innerHTML = instructions + `
      <div style="text-align: right; margin-top: 20px;">
        <button class="button button-primary" onclick="this.closest('.modal').remove()">
          Close
        </button>
      </div>
    `;
    
    modal.className = 'modal';
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  async saveSettings() {
    try {
      this.settings = {
        maxFlashcards: parseInt(document.getElementById('maxFlashcards').value),
        defaultTopic: document.getElementById('defaultTopic').value,
        detectionStrategy: document.getElementById('detectionStrategy').value,
        defaultExportFormat: document.getElementById('defaultExportFormat').value,
        ankiDeckName: document.getElementById('ankiDeckName').value,
        customPrompt: document.getElementById('customPrompt').value,
        contextPrompt: document.getElementById('contextPrompt').value
      };
      
      await this.setStorageData({ settings: this.settings });
      this.showAlert('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showAlert('Error saving settings', 'error');
    }
  }
  
  async resetSettings() {
    try {
      this.settings = {
        maxFlashcards: 20,
        defaultTopic: 'General',
        detectionStrategy: 'auto',
        defaultExportFormat: 'csv',
        ankiDeckName: 'ChatGPT Flashcards',
        customPrompt: `Based on the following conversation, create educational flashcards in CSV format. Each flashcard should have a clear question and a concise answer. Focus on key concepts, definitions, and important facts.

Please format your response as a CSV with the following columns:
- Topic (category/subject)
- Question (front of flashcard)
- Answer (back of flashcard)

Generate 10-15 high-quality flashcards that capture the most important information from this conversation.`,
        contextPrompt: `Create educational flashcards from the following context information. Return ONLY CSV data with no markdown, explanations, or code blocks.

Context Information:
{CONTEXT}

Format: Topic,Question,Answer
Generate 10-15 flashcards. Begin output immediately with CSV data:`
      };
      
      await this.setStorageData({ settings: this.settings });
      this.loadSettings();
      this.showAlert('Settings reset to defaults', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showAlert('Error resetting settings', 'error');
    }
  }
  
  resetPrompt() {
    const defaultPrompt = `Based on the following conversation, create educational flashcards in CSV format. Each flashcard should have a clear question and a concise answer. Focus on key concepts, definitions, and important facts.

Please format your response as a CSV with the following columns:
- Topic (category/subject)
- Question (front of flashcard)
- Answer (back of flashcard)

Generate 10-15 high-quality flashcards that capture the most important information from this conversation.`;
    
    document.getElementById('customPrompt').value = defaultPrompt;
    this.showAlert('Prompt reset to default', 'success');
  }
  
  testPrompt() {
    const prompt = document.getElementById('customPrompt').value;
    
    if (!prompt.trim()) {
      this.showAlert('Please enter a prompt template first', 'error');
      return;
    }
    
    // Replace variables with sample data
    const sampleConversation = `User: What is machine learning?
AI: Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.

User: How does it work?
AI: Machine learning works by using algorithms to analyze data, identify patterns, and make predictions or decisions based on that analysis.`;
    
    const testPrompt = prompt
      .replace('{CONVERSATION}', sampleConversation)
      .replace('{PLATFORM}', 'ChatGPT')
      .replace('{TIMESTAMP}', new Date().toISOString())
      .replace('{CHAT_TITLE}', 'Machine Learning Discussion');
    
    // Add sample modal customization to show integration
    const sampleModalCustomization = `
Additional Instructions:
Topic Focus: Programming concepts
Question Type: Definition and explanation
Difficulty Level: Beginner
Card Count: 10
Custom Instructions: Focus on simple explanations and practical examples`;
    
    const finalTestPrompt = testPrompt + sampleModalCustomization;
    
    // Create a modal or alert to show the test prompt
    const testModal = document.createElement('div');
    testModal.className = 'edit-modal active';
    testModal.innerHTML = `
      <div class="edit-modal-content" style="max-width: 700px;">
        <div class="edit-modal-header">
          <h3>Test Prompt Preview</h3>
          <button class="edit-modal-close" onclick="this.closest('.edit-modal').remove()">×</button>
        </div>
        <div class="edit-form-group">
          <label class="edit-form-label">Base Template (with variables replaced):</label>
          <textarea class="edit-form-input" rows="10" readonly>${testPrompt}</textarea>
        </div>
        <div class="edit-form-group">
          <label class="edit-form-label">Final Prompt (with modal integration):</label>
          <textarea class="edit-form-input" rows="15" readonly>${finalTestPrompt}</textarea>
        </div>
        <div class="edit-modal-actions">
          <button type="button" class="button button-primary" onclick="this.closest('.edit-modal').remove()">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(testModal);
  }
  
  resetContextPrompt() {
    const defaultContextPrompt = `Create educational flashcards from the following context information. Return ONLY CSV data with no markdown, explanations, or code blocks.

Context Information:
{CONTEXT}

Format: Topic,Question,Answer
Generate 10-15 flashcards. Begin output immediately with CSV data:`;
    
    document.getElementById('contextPrompt').value = defaultContextPrompt;
    this.showAlert('Context prompt reset to default', 'success');
  }
  
  testContextPrompt() {
    const prompt = document.getElementById('contextPrompt').value;
    
    if (!prompt.trim()) {
      this.showAlert('Please enter a context prompt template first', 'error');
      return;
    }
    
    // Create sample context data
    const sampleContext = `Source: Wikipedia - Machine Learning (https://en.wikipedia.org/wiki/Machine_learning)
Content: Machine learning is a method of data analysis that automates analytical model building. It is a branch of artificial intelligence based on the idea that systems can learn from data, identify patterns and make decisions with minimal human intervention.
---

Source: Stanford CS229 Course Notes (https://cs229.stanford.edu/notes/cs229-notes1.pdf)
Content: In supervised learning, we have a training set of labeled examples (x(i), y(i)) where x(i) is the input and y(i) is the output label. The goal is to learn a function h that maps from x to y such that h(x) is a good predictor for the corresponding value of y.
---

Source: Neural Networks and Deep Learning (https://neuralnetworksanddeeplearning.com/chap1.html)
Content: A neural network is a computational model inspired by the way biological neural networks in the human brain process information. It consists of interconnected nodes (neurons) that work together to solve complex problems through learning.`;
    
    // Replace the {CONTEXT} placeholder with sample data
    const testPrompt = prompt.replace('{CONTEXT}', sampleContext);
    
    // Create a modal to show the test prompt
    const testModal = document.createElement('div');
    testModal.className = 'edit-modal active';
    testModal.innerHTML = `
      <div class="edit-modal-content" style="max-width: 800px;">
        <div class="edit-modal-header">
          <h3>Context Prompt Test Preview</h3>
          <button class="edit-modal-close" onclick="this.closest('.edit-modal').remove()">×</button>
        </div>
        <div class="edit-form-group">
          <label class="edit-form-label">Context Template:</label>
          <textarea class="edit-form-input" rows="6" readonly>${this.escapeHtml(prompt)}</textarea>
        </div>
        <div class="edit-form-group">
          <label class="edit-form-label">Sample Context Data:</label>
          <textarea class="edit-form-input" rows="8" readonly>${this.escapeHtml(sampleContext)}</textarea>
        </div>
        <div class="edit-form-group">
          <label class="edit-form-label">Final Prompt (ready to paste in ChatGPT):</label>
          <textarea class="edit-form-input" rows="15" readonly>${this.escapeHtml(testPrompt)}</textarea>
        </div>
        <div class="edit-modal-actions">
          <button type="button" class="button button-secondary" onclick="this.closest('.edit-modal').remove()">Close</button>
          <button type="button" class="button button-primary" onclick="navigator.clipboard.writeText(\`${testPrompt.replace(/`/g, '\\`')}\`).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = 'Copy to Clipboard', 2000); })">Copy to Clipboard</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(testModal);
  }
  
  showAlert(message, type) {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild.nextSibling);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 5000);
  }
  
  getStorageData(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result);
      });
    });
  }
  
  setStorageData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Proper CSV parsing function that handles quoted fields
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    
    return result;
  }
  
  // Debug function to test deletion
  debugDeleteSystem() {
    console.log('=== Debug Delete System ===');
    console.log('Current flashcard data:', this.flashcardData);
    
    const flashcards = this.parseFlashcardsWithIndex();
    console.log('Parsed flashcards with indices:', flashcards);
    
    const deleteButtons = document.querySelectorAll('.delete-card-btn');
    console.log('Delete buttons found:', deleteButtons.length);
    
    deleteButtons.forEach((button, index) => {
      console.log(`Button ${index}:`, {
        chatIndex: button.getAttribute('data-chat-index'),
        lineIndex: button.getAttribute('data-line-index')
      });
    });
    
    console.log('=== End Debug ===');
  }
}

// Initialize the configuration manager
let configManager;

document.addEventListener('DOMContentLoaded', () => {
  configManager = new ConfigManager();
  
  // Make configManager globally accessible for debugging and compatibility
  window.configManager = configManager;
  
  // Add global backup function as fallback
  window.showAllFlashcards = () => {
    if (configManager) {
      configManager.showAllFlashcards();
    } else {
      console.error('ConfigManager not initialized');
    }
  };
});