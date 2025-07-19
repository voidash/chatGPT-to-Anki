// Chat to Anki Flashcards - Genanki Integration
// This file provides integration with genanki.js for creating Anki packages

class AnkiPackageGenerator {
  constructor() {
    this.modelId = Date.now(); // Unique model ID
    this.deckId = Date.now() + 1; // Unique deck ID
    this.initialized = false;
    
    // Basic model template for flashcards
    this.cardTemplate = {
      name: 'ChatGPT Flashcard',
      flds: [
        { name: 'Topic' },
        { name: 'Question' },
        { name: 'Answer' }
      ],
      req: [
        [ 0, "all", [ 1 ] ] // Card will be generated if Question field is non-empty
      ],
      tmpls: [
        {
          name: 'Card 1',
          qfmt: `
            <div class="card">
              <div class="topic">{{Topic}}</div>
              <div class="question">{{Question}}</div>
            </div>
          `,
          afmt: `
            <div class="card">
              <div class="topic">{{Topic}}</div>
              <div class="question">{{Question}}</div>
              <hr>
              <div class="answer">{{Answer}}</div>
            </div>
          `
        }
      ],
      css: `
        .card {
          font-family: Arial, sans-serif;
          font-size: 20px;
          text-align: center;
          color: black;
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .topic {
          font-size: 14px;
          color: #10a37f;
          font-weight: bold;
          margin-bottom: 15px;
          padding: 5px 10px;
          background-color: #f0f9ff;
          border-radius: 5px;
          display: inline-block;
        }
        
        .question {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          line-height: 1.4;
        }
        
        .answer {
          font-size: 16px;
          line-height: 1.5;
          text-align: left;
          margin-top: 20px;
          padding: 15px;
          background-color: #f9fafb;
          border-left: 4px solid #10a37f;
          border-radius: 5px;
        }
        
        hr {
          border: none;
          height: 1px;
          background-color: #e5e7eb;
          margin: 20px 0;
        }
        
        .cloze {
          font-weight: bold;
          color: #10a37f;
        }
      `
    };
  }
  
  /**
   * Initialize SQL.js using separate worker script to avoid CSP restrictions
   */
  async initializeSQL() {
    if (this.initialized) return;
    
    try {
      // Inject worker script if not already present
      if (!document.querySelector('script[src*="anki-worker.js"]')) {
        await this.injectWorkerScript();
      }
      
      // Wait for worker to be ready
      await this.waitForWorker();
      
      // Initialize SQL.js through worker
      const result = await this.callWorkerMethod('initializeSQL', {});
      
      if (result.success) {
        this.initialized = true;
        console.log('SQL.js initialized successfully through worker');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error initializing SQL.js through worker:', error);
      throw error;
    }
  }
  
  /**
   * Inject the worker script into the page
   */
  async injectWorkerScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('anki-worker.js');
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  
  /**
   * Wait for worker to be ready
   */
  async waitForWorker() {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (event.source === window && event.data && event.data.type === 'ANKI_WORKER_READY') {
          window.removeEventListener('message', handler);
          resolve();
        }
      };
      
      window.addEventListener('message', handler);
    });
  }
  
  /**
   * Call a method on the worker
   */
  async callWorkerMethod(method, params) {
    return new Promise((resolve, reject) => {
      const requestId = Date.now() + Math.random();
      let timeoutId;
      
      const handler = (event) => {
        if (event.source === window && event.data && 
            event.data.type === 'ANKI_WORKER_RESPONSE' && 
            event.data.requestId === requestId) {
          window.removeEventListener('message', handler);
          if (timeoutId) clearTimeout(timeoutId);
          
          if (event.data.success) {
            resolve(event.data.result);
          } else {
            reject(new Error(event.data.error));
          }
        }
      };
      
      // Add timeout to prevent hanging
      timeoutId = setTimeout(() => {
        window.removeEventListener('message', handler);
        reject(new Error(`Worker method '${method}' timed out after 30 seconds`));
      }, 30000);
      
      window.addEventListener('message', handler);
      
      // Send request to worker
      window.postMessage({
        type: 'ANKI_WORKER_REQUEST',
        requestId,
        method,
        params
      }, '*');
    });
  }
  
  /**
   * Generate an Anki package from flashcard data
   * @param {Array} flashcardData - Array of flashcard objects
   * @param {string} deckName - Name of the Anki deck
   * @returns {Promise<Blob>} - Promise resolving to Anki package blob
   */
  async generateAnkiPackage(flashcardData, deckName = 'ChatGPT Flashcards') {
    try {
      // Initialize SQL.js if not already done
      await this.initializeSQL();
      
      // Generate package through worker to avoid CSP restrictions
      const result = await this.callWorkerMethod('generateAnkiPackage', {
        flashcardData,
        deckName,
        modelId: this.modelId,
        deckId: this.deckId,
        cardTemplate: this.cardTemplate
      });
      
      if (result.success) {
        return true;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error generating Anki package:', error);
      throw error;
    }
  }
  
  /**
   * Parse CSV data into flashcard objects
   * @param {string} csvData - CSV string with Topic,Question,Answer format
   * @returns {Array} - Array of flashcard objects
   */
  parseCSVData(csvData) {
    const flashcards = [];
    const lines = csvData.split('\n').filter(line => line.trim());
    
    // Skip header if present
    const startIndex = lines[0] && lines[0].toLowerCase().includes('topic') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handle quoted fields)
      const parts = this.parseCSVLine(line);
      
      if (parts.length >= 3) {
        flashcards.push({
          topic: parts[0].trim(),
          question: parts[1].trim(),
          answer: parts.slice(2).join(',').trim()
        });
      }
    }
    
    return flashcards;
  }
  
  /**
   * Parse a single CSV line handling quoted fields
   * @param {string} line - CSV line
   * @returns {Array} - Array of field values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        if (line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
      
      i++;
    }
    
    // Add the last field
    result.push(current);
    
    return result;
  }
  
  /**
   * Create a downloadable Anki package
   * @param {Array} flashcardData - Array of flashcard objects
   * @param {string} deckName - Name of the Anki deck
   * @param {string} filename - Download filename
   */
  async downloadAnkiPackage(flashcardData, deckName = 'ChatGPT Flashcards', filename = null) {
    try {
      if (!filename) {
        filename = `${deckName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.apkg`;
      }
      
      // Initialize SQL.js if not already done
      await this.initializeSQL();
      
      // Generate and download package through worker to avoid CSP restrictions
      const result = await this.callWorkerMethod('generateAnkiPackage', {
        flashcardData,
        deckName,
        filename,
        modelId: this.modelId,
        deckId: this.deckId,
        cardTemplate: this.cardTemplate
      });
      
      if (result.success) {
        return true;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('Error downloading Anki package:', error);
      throw error;
    }
  }
  
  /**
   * Fallback CSV download when Anki package generation fails
   */
  fallbackCSVDownload(flashcardData, filename) {
    try {
      // Convert to CSV format
      const csvHeader = 'Topic,Question,Answer\n';
      const csvRows = flashcardData.map(card => 
        `"${(card.topic || 'General').replace(/"/g, '""')}","${(card.question || '').replace(/"/g, '""')}","${(card.answer || '').replace(/"/g, '""')}"`
      ).join('\n');
      
      const csvData = csvHeader + csvRows;
      
      // Download CSV file
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename.replace('.apkg', '.csv'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('CSV file downloaded as fallback');
      return true;
    } catch (error) {
      console.error('Error in fallback CSV download:', error);
      throw error;
    }
  }
  
  /**
   * Validate flashcard data
   * @param {Array} flashcardData - Array of flashcard objects
   * @returns {Object} - Validation result
   */
  validateFlashcardData(flashcardData) {
    const errors = [];
    const warnings = [];
    
    if (!Array.isArray(flashcardData)) {
      errors.push('Flashcard data must be an array');
      return { valid: false, errors, warnings };
    }
    
    if (flashcardData.length === 0) {
      errors.push('No flashcard data provided');
      return { valid: false, errors, warnings };
    }
    
    flashcardData.forEach((card, index) => {
      if (!card.question || card.question.trim() === '') {
        errors.push(`Card ${index + 1}: Question is required`);
      }
      
      if (!card.answer || card.answer.trim() === '') {
        errors.push(`Card ${index + 1}: Answer is required`);
      }
      
      if (!card.topic || card.topic.trim() === '') {
        warnings.push(`Card ${index + 1}: Topic is empty, will use 'General'`);
      }
      
      if (card.question && card.question.length > 500) {
        warnings.push(`Card ${index + 1}: Question is very long (${card.question.length} characters)`);
      }
      
      if (card.answer && card.answer.length > 2000) {
        warnings.push(`Card ${index + 1}: Answer is very long (${card.answer.length} characters)`);
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
  
  /**
   * Get statistics about flashcard data
   * @param {Array} flashcardData - Array of flashcard objects
   * @returns {Object} - Statistics object
   */
  getStatistics(flashcardData) {
    if (!Array.isArray(flashcardData) || flashcardData.length === 0) {
      return {
        totalCards: 0,
        topics: [],
        topicCounts: {},
        averageQuestionLength: 0,
        averageAnswerLength: 0
      };
    }
    
    const topics = {};
    let totalQuestionLength = 0;
    let totalAnswerLength = 0;
    
    flashcardData.forEach(card => {
      const topic = card.topic || 'General';
      topics[topic] = (topics[topic] || 0) + 1;
      
      if (card.question) {
        totalQuestionLength += card.question.length;
      }
      
      if (card.answer) {
        totalAnswerLength += card.answer.length;
      }
    });
    
    return {
      totalCards: flashcardData.length,
      topics: Object.keys(topics),
      topicCounts: topics,
      averageQuestionLength: Math.round(totalQuestionLength / flashcardData.length),
      averageAnswerLength: Math.round(totalAnswerLength / flashcardData.length)
    };
  }
  
  /**
   * Test the genanki-js implementation
   */
  async testImplementation() {
    try {
      await this.initializeSQL();
      console.log('SQL initialized successfully');
      
      // Test data
      const testFlashcards = [
        {
          topic: 'Test Topic',
          question: 'What is 2 + 2?',
          answer: '4'
        },
        {
          topic: 'Test Topic',
          question: 'What is the capital of France?',
          answer: 'Paris'
        }
      ];
      
      console.log('Testing with flashcards:', testFlashcards);
      
      // Test validation
      const validation = this.validateFlashcardData(testFlashcards);
      console.log('Validation result:', validation);
      
      if (validation.valid) {
        console.log('✓ Validation passed');
        
        // Test through worker
        const result = await this.callWorkerMethod('testImplementation', {});
        
        if (result.success) {
          console.log('✓ Worker test passed');
          return true;
        } else {
          console.error('✗ Worker test failed:', result.error);
          return false;
        }
      } else {
        console.error('✗ Validation failed:', validation.errors);
        return false;
      }
    } catch (error) {
      console.error('Test failed:', error);
      return false;
    }
  }
}

// Create global instance
window.AnkiPackageGenerator = AnkiPackageGenerator;