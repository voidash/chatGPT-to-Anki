// Anki Worker - Handles WebAssembly operations in page context
// This file is injected into the page context to bypass CSP restrictions

class AnkiWorker {
  constructor() {
    this.initialized = false;
    this.requestId = 0;
    this.pendingRequests = new Map();
    
    // Listen for messages from extension
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data || event.data.type !== 'ANKI_WORKER_REQUEST') {
        return;
      }
      
      this.handleRequest(event.data);
    });
    
    // Signal that worker is ready
    window.postMessage({
      type: 'ANKI_WORKER_READY',
      ready: true
    }, '*');
  }
  
  async handleRequest(data) {
    const { requestId, method, params } = data;
    
    try {
      let result;
      
      switch (method) {
        case 'initializeSQL':
          result = await this.initializeSQL(params);
          break;
        case 'generateAnkiPackage':
          result = await this.generateAnkiPackage(params);
          break;
        case 'testImplementation':
          result = await this.testImplementation(params);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      
      // Send success response
      window.postMessage({
        type: 'ANKI_WORKER_RESPONSE',
        requestId,
        success: true,
        result
      }, '*');
      
    } catch (error) {
      // Send error response
      window.postMessage({
        type: 'ANKI_WORKER_RESPONSE',
        requestId,
        success: false,
        error: error.message
      }, '*');
    }
  }
  
  async initializeSQL(params) {
    if (this.initialized) {
      return { success: true, message: 'Already initialized' };
    }
    
    try {
      console.log('Initializing SQL.js with genanki-js sample files...');
      
      // Check if initSqlJs function is available
      if (typeof initSqlJs === 'undefined') {
        throw new Error('initSqlJs function not available');
      }
      
      console.log('Using simplified SQL.js initialization from genanki-js sample...');
      
      // Use the simple initialization pattern from genanki-js samples
      window.SQL = await initSqlJs();
      
      console.log('SQL.js initialized successfully with genanki-js sample files!');
      this.initialized = true;
      
      return { success: true, message: 'SQL.js initialized with genanki-js sample files' };
    } catch (error) {
      console.error('Error initializing SQL.js:', error);
      return { success: false, error: error.message };
    }
  }
  
  async generateAnkiPackage(params) {
    if (!this.initialized) {
      throw new Error('SQL.js not initialized');
    }
    
    try {
      const { flashcardData, deckName, filename, modelId, deckId, cardTemplate } = params;
      
      // Check if genanki classes are available
      if (typeof Model === 'undefined' || typeof Deck === 'undefined' || typeof Package === 'undefined') {
        throw new Error('genanki-js library not loaded properly');
      }
      
      console.log('Creating Anki package with topic-based decks...');
      
      // Create model with all required fields
      const model = new Model({
        id: modelId.toString(),
        name: cardTemplate.name,
        flds: cardTemplate.flds,
        req: cardTemplate.req,
        tmpls: cardTemplate.tmpls,
        css: cardTemplate.css
      });
      
      // Group flashcards by topic
      const topicGroups = {};
      flashcardData.forEach((flashcard, index) => {
        const topic = flashcard.topic || 'General';
        if (!topicGroups[topic]) {
          topicGroups[topic] = [];
        }
        topicGroups[topic].push(flashcard);
      });
      
      // Create package
      const pkg = new Package();
      
      // Create separate deck for each topic
      Object.keys(topicGroups).forEach((topic, index) => {
        const topicDeckName = topic; // Use topic name directly without prefix
        const topicDeckId = deckId + index + 1; // Unique deck ID for each topic
        const topicDeck = new Deck(topicDeckId, topicDeckName);
        
        // Add cards to this topic's deck
        topicGroups[topic].forEach((flashcard) => {
          const note = model.note([
            flashcard.topic || 'General',
            flashcard.question || '',
            flashcard.answer || ''
          ], ['chatgpt', 'flashcard', topic.toLowerCase()]);
          
          topicDeck.addNote(note);
        });
        
        pkg.addDeck(topicDeck);
        console.log(`Created deck "${topicDeckName}" with ${topicGroups[topic].length} cards`);
      });
      
      // Download the file
      const downloadFilename = filename || `${deckName.replace(/[^a-zA-Z0-9]/g, '_')}.apkg`;
      
      console.log('Generating .apkg file with topic-based decks:', downloadFilename);
      pkg.writeToFile(downloadFilename);
      
      return { success: true, message: `Package generated with ${Object.keys(topicGroups).length} topic-based decks` };
    } catch (error) {
      console.error('Error generating package:', error);
      return { success: false, error: error.message };
    }
  }
  
  
  async testImplementation(params) {
    try {
      // Check if genanki classes are available
      if (typeof Model === 'undefined' || typeof Deck === 'undefined' || typeof Package === 'undefined') {
        throw new Error('genanki-js library not loaded properly');
      }
      
      if (!this.initialized) {
        throw new Error('SQL.js not initialized');
      }
      
      return { success: true, message: 'All components available and ready' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Initialize worker
new AnkiWorker();