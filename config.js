// Chat to Anki Flashcards - Configuration Page Script

class ConfigManager {
  constructor() {
    this.flashcardData = [];
    this.settings = {
      maxFlashcards: 20,
      defaultTopic: 'General',
      detectionStrategy: 'auto',
      defaultExportFormat: 'csv',
      ankiDeckName: 'ChatGPT Flashcards'
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
      // Load flashcard data
      const result = await this.getStorageData(['flashcardData', 'settings']);
      
      if (result.flashcardData) {
        this.flashcardData = result.flashcardData;
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
    
    if (totalChats > 0) {
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
          <button class="button button-secondary" onclick="configManager.showAllFlashcards()" style="padding: 5px 10px; font-size: 12px;">
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
  }
  
  showAllFlashcards() {
    // Reset to normal flashcard view
    this.currentChatView = null;
    
    // Show topic sidebar and reset flashcard content width
    const topicSidebar = document.querySelector('.topic-sidebar');
    const flashcardContent = document.querySelector('.flashcard-content');
    
    if (topicSidebar) topicSidebar.style.display = 'block';
    if (flashcardContent) flashcardContent.style.width = '';
    
    // Reset header
    const flashcardHeader = document.querySelector('.flashcard-header');
    if (flashcardHeader) {
      flashcardHeader.innerHTML = `
        <h3 id="selectedTopicTitle">All Flashcards</h3>
        <div class="flashcard-count" id="flashcardCount">0 flashcards</div>
      `;
    }
    
    // Load normal flashcard view
    this.loadFlashcards();
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
  }
  
  parseFlashcards() {
    const flashcards = [];
    
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
              answer: parts[2] // Use only the third part
            });
          }
        });
      }
    });
    
    return flashcards;
  }
  
  parseFlashcardsWithIndex() {
    const flashcards = [];
    
    this.flashcardData.forEach((data, chatIndex) => {
      if (data.csvData) {
        // Try both \n and \\n for line splitting
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
              answer: parts[2], // Use only the third part
              chatIndex: chatIndex,
              lineIndex: lineIndex
            });
          }
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
        
        const chatIndex = parseInt(button.getAttribute('data-chat-index'));
        const lineIndex = parseInt(button.getAttribute('data-line-index'));
        
        console.log('Delete button clicked:', { chatIndex, lineIndex });
        
        // Show confirmation dialog
        if (confirm('Are you sure you want to delete this flashcard?')) {
          this.deleteFlashcard(chatIndex, lineIndex);
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
        
        const chatIndex = parseInt(button.getAttribute('data-chat-index'));
        const lineIndex = parseInt(button.getAttribute('data-line-index'));
        
        console.log('Edit button clicked:', { chatIndex, lineIndex });
        
        this.openEditModal(chatIndex, lineIndex);
      });
    });
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
    
    document.getElementById('syncAnkiWeb').addEventListener('click', () => {
      this.syncToAnkiWeb();
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
  }
  
  async clearAllFlashcards() {
    try {
      await this.setStorageData({ flashcardData: [] });
      this.flashcardData = [];
      this.loadData();
      this.showAlert('All flashcards cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing flashcards:', error);
      this.showAlert('Error clearing flashcards', 'error');
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
    console.log('Opening edit modal for:', { chatIndex, lineIndex });
    
    try {
      // Get the flashcard data
      const flashcard = this.getFlashcardByIndex(chatIndex, lineIndex);
      if (!flashcard) {
        this.showAlert('Flashcard not found', 'error');
        return;
      }
      
      // Store the current edit context
      this.currentEditContext = { chatIndex, lineIndex, originalTopic: flashcard.topic };
      
      // Populate the form
      document.getElementById('editTopic').value = flashcard.topic;
      document.getElementById('editQuestion').value = flashcard.question;
      document.getElementById('editAnswer').value = flashcard.answer;
      
      // Show the modal
      document.getElementById('editModal').classList.add('active');
      
      // Set up modal event listeners if not already set up
      this.setupEditModalListeners();
      
    } catch (error) {
      console.error('Error opening edit modal:', error);
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
    
    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveFlashcardEdit();
    });
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
                answer: parts[2] // Use only the third part
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
  
  async saveFlashcardEdit() {
    if (!this.currentEditContext) {
      this.showAlert('No edit context available', 'error');
      return;
    }
    
    try {
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
      
      // Update the flashcard data
      const success = await this.updateFlashcard(chatIndex, lineIndex, newTopic, newQuestion, newAnswer);
      
      if (success) {
        // Close modal
        document.getElementById('editModal').classList.remove('active');
        this.currentEditContext = null;
        
        // Check if topic changed
        const topicChanged = originalTopic !== newTopic;
        
        // Reload data and update display
        await this.loadData();
        
        if (topicChanged) {
          // If topic changed, reload topics and reset to "All Topics" view
          this.loadTopics();
          this.selectTopic('all');
        } else {
          // If topic didn't change, maintain current topic view
          this.loadFlashcardsByTopic(this.selectedTopic);
        }
        
        this.showAlert('Flashcard updated successfully', 'success');
      }
      
    } catch (error) {
      console.error('Error saving flashcard edit:', error);
      this.showAlert('Error saving changes', 'error');
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
      
      // Parse flashcard data
      const flashcards = this.parseFlashcards();
      
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
  
  async syncToAnkiWeb() {
    const username = document.getElementById('ankiUsername').value;
    const password = document.getElementById('ankiPassword').value;
    
    if (!username || !password) {
      this.showAlert('Please enter both username and password', 'error');
      return;
    }
    
    try {
      // Note: Direct AnkiWeb API sync would require a backend service
      // For now, we'll create an Anki package and provide instructions
      
      if (this.flashcardData.length === 0) {
        this.showAlert('No flashcards to sync', 'error');
        return;
      }
      
      // Generate Anki package first
      const generator = new AnkiPackageGenerator();
      
      // Initialize SQL.js
      await generator.initializeSQL();
      
      const flashcards = this.parseFlashcards();
      const deckName = this.settings.ankiDeckName || 'ChatGPT Flashcards';
      
      await generator.downloadAnkiPackage(flashcards, deckName);
      
      // Show instructions for manual sync
      this.showAlert('Anki package downloaded! Import it in Anki Desktop, then sync to AnkiWeb.', 'info');
      
      // Future implementation would include:
      // 1. Backend service for AnkiWeb authentication
      // 2. API calls to AnkiWeb
      // 3. Direct deck upload
      
    } catch (error) {
      console.error('Error syncing to AnkiWeb:', error);
      this.showAlert('Error preparing AnkiWeb sync', 'error');
    }
  }
  
  async saveSettings() {
    try {
      this.settings = {
        maxFlashcards: parseInt(document.getElementById('maxFlashcards').value),
        defaultTopic: document.getElementById('defaultTopic').value,
        detectionStrategy: document.getElementById('detectionStrategy').value,
        defaultExportFormat: document.getElementById('defaultExportFormat').value,
        ankiDeckName: document.getElementById('ankiDeckName').value
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
        ankiDeckName: 'ChatGPT Flashcards'
      };
      
      await this.setStorageData({ settings: this.settings });
      this.loadSettings();
      this.showAlert('Settings reset to defaults', 'success');
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showAlert('Error resetting settings', 'error');
    }
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
});