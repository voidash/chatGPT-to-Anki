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
        const lines = data.csvData.split('\n').filter(line => line.trim());
        totalFlashcards += lines.length;
        
        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 3) {
            topics.add(parts[0].trim());
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
    const activityHtml = recentItems.map(item => {
      const flashcardCount = item.csvData ? item.csvData.split('\n').filter(line => line.trim()).length : 0;
      return `
        <div class="flashcard-item">
          <div class="flashcard-topic">Chat ${item.chatId}</div>
          <div class="flashcard-question">${flashcardCount} flashcards generated</div>
          <div class="flashcard-answer">Last updated: ${new Date().toLocaleDateString()}</div>
        </div>
      `;
    }).join('');
    
    activityContainer.innerHTML = `<div class="flashcard-grid">${activityHtml}</div>`;
  }
  
  loadFlashcards() {
    const container = document.getElementById('flashcardContainer');
    
    if (this.flashcardData.length === 0) {
      container.innerHTML = `
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
      return;
    }
    
    const flashcards = this.parseFlashcards();
    const flashcardHtml = flashcards.map(card => `
      <div class="flashcard-item">
        <div class="flashcard-topic">${this.escapeHtml(card.topic)}</div>
        <div class="flashcard-question">${this.escapeHtml(card.question)}</div>
        <div class="flashcard-answer">${this.escapeHtml(card.answer)}</div>
      </div>
    `).join('');
    
    container.innerHTML = `<div class="flashcard-grid">${flashcardHtml}</div>`;
  }
  
  parseFlashcards() {
    const flashcards = [];
    
    this.flashcardData.forEach(data => {
      if (data.csvData) {
        const lines = data.csvData.split('\n').filter(line => line.trim());
        
        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 3) {
            flashcards.push({
              topic: parts[0].trim(),
              question: parts[1].trim(),
              answer: parts.slice(2).join(',').trim()
            });
          }
        });
      }
    });
    
    return flashcards;
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
      `"${card.topic}","${card.question}","${card.answer}"`
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
}

// Initialize the configuration manager
document.addEventListener('DOMContentLoaded', () => {
  new ConfigManager();
});