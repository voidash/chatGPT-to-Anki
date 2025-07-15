// Genanki-js Test Suite
// Comprehensive testing for Anki flashcard generation

class TestSuite {
  constructor() {
    this.generator = null;
    this.testResults = [];
    this.init();
  }
  
  init() {
    this.setupTabs();
    this.setupEventListeners();
    this.initializeGenerator();
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
      });
    });
  }
  
  setupEventListeners() {
    // CSV Test buttons
    document.getElementById('csvTestDownload').addEventListener('click', () => {
      this.csvTestDownload();
    });
    
    document.getElementById('csvTestValidate').addEventListener('click', () => {
      this.csvTestValidate();
    });
    
    document.getElementById('csvTestClear').addEventListener('click', () => {
      this.csvTestClear();
    });
    
    // API Test buttons
    document.getElementById('testSqlInit').addEventListener('click', () => {
      this.testSqlInitialization();
    });
    
    document.getElementById('testModelCreation').addEventListener('click', () => {
      this.testModelCreation();
    });
    
    document.getElementById('testPackageGeneration').addEventListener('click', () => {
      this.testPackageGeneration();
    });
    
    document.getElementById('runAllTests').addEventListener('click', () => {
      this.runAllApiTests();
    });
    
    // Validation Test buttons
    document.getElementById('testValidData').addEventListener('click', () => {
      this.testValidationValid();
    });
    
    document.getElementById('testInvalidData').addEventListener('click', () => {
      this.testValidationInvalid();
    });
    
    document.getElementById('testEdgeCases').addEventListener('click', () => {
      this.testValidationEdgeCases();
    });
  }
  
  async initializeGenerator() {
    try {
      this.generator = new AnkiPackageGenerator();
      
      // Initialize SQL.js for test environment (CDN version)
      await this.initializeTestSQL();
      
      console.log('TestSuite: AnkiPackageGenerator initialized successfully');
    } catch (error) {
      console.error('TestSuite: Failed to initialize AnkiPackageGenerator:', error);
    }
  }
  
  async initializeTestSQL() {
    try {
      if (typeof window.SQL === 'undefined') {
        // For CDN version of SQL.js
        const config = {
          locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        };
        
        if (typeof initSqlJs !== 'undefined') {
          window.SQL = await initSqlJs(config);
          console.log('TestSuite: SQL.js initialized from CDN');
        } else {
          throw new Error('initSqlJs not available');
        }
      }
      
      // Mark generator as initialized
      if (this.generator) {
        this.generator.initialized = true;
      }
    } catch (error) {
      console.error('TestSuite: Failed to initialize SQL.js:', error);
      throw error;
    }
  }
  
  // CSV Test Methods
  async csvTestDownload() {
    try {
      const csvContent = document.getElementById('csvTestInput').value.trim();
      const deckName = document.getElementById('csvTestDeckName').value.trim() || 'CSV Test Deck';
      
      if (!csvContent) {
        this.showCsvTestStatus('Please enter CSV content', 'error');
        return;
      }
      
      if (!this.generator) {
        this.showCsvTestStatus('Generator not initialized. Please refresh the page.', 'error');
        return;
      }
      
      // Parse CSV content
      const flashcards = this.generator.parseCSVData(csvContent);
      
      if (flashcards.length === 0) {
        this.showCsvTestStatus('No valid flashcards found in CSV', 'error');
        return;
      }
      
      // Validate flashcards
      const validation = this.generator.validateFlashcardData(flashcards);
      if (!validation.valid) {
        this.showCsvTestStatus(`Validation failed: ${validation.errors.join(', ')}`, 'error');
        return;
      }
      
      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('CSV Test warnings:', validation.warnings);
      }
      
      // Download Anki package
      await this.generator.downloadAnkiPackage(flashcards, deckName);
      
      this.showCsvTestStatus(`Successfully created Anki package with ${flashcards.length} flashcards`, 'success');
      
    } catch (error) {
      console.error('Error generating Anki package from CSV:', error);
      this.showCsvTestStatus('Error generating Anki package. Check console for details.', 'error');
    }
  }
  
  csvTestValidate() {
    try {
      const csvContent = document.getElementById('csvTestInput').value.trim();
      
      if (!csvContent) {
        this.showCsvTestStatus('Please enter CSV content', 'error');
        return;
      }
      
      if (!this.generator) {
        this.showCsvTestStatus('Generator not initialized. Please refresh the page.', 'error');
        return;
      }
      
      // Parse CSV content
      const flashcards = this.generator.parseCSVData(csvContent);
      
      if (flashcards.length === 0) {
        this.showCsvTestStatus('No valid flashcards found in CSV', 'error');
        return;
      }
      
      // Validate flashcards
      const validation = this.generator.validateFlashcardData(flashcards);
      
      if (validation.valid) {
        let message = `✓ CSV is valid! Found ${flashcards.length} flashcards`;
        if (validation.warnings.length > 0) {
          message += `\nWarnings: ${validation.warnings.join(', ')}`;
        }
        this.showCsvTestStatus(message, 'success');
      } else {
        this.showCsvTestStatus(`✗ Validation failed: ${validation.errors.join(', ')}`, 'error');
      }
      
      // Get statistics
      const stats = this.generator.getStatistics(flashcards);
      console.log('CSV Test Statistics:', stats);
      
    } catch (error) {
      console.error('Error validating CSV:', error);
      this.showCsvTestStatus('Error validating CSV. Check console for details.', 'error');
    }
  }
  
  csvTestClear() {
    document.getElementById('csvTestInput').value = '';
    document.getElementById('csvTestDeckName').value = 'CSV Test Deck';
    this.showCsvTestStatus('CSV content cleared', 'info');
  }
  
  showCsvTestStatus(message, type) {
    const statusElement = document.getElementById('csvTestStatus');
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    
    // Auto-hide after 5 seconds for success/info messages
    if (type === 'success' || type === 'info') {
      setTimeout(() => {
        statusElement.style.display = 'none';
      }, 5000);
    }
  }
  
  // API Test Methods
  async testSqlInitialization() {
    const results = document.getElementById('apiTestResults');
    this.addTestResult(results, 'Testing SQL Initialization...', 'info');
    
    try {
      if (!this.generator) {
        this.generator = new AnkiPackageGenerator();
      }
      
      await this.generator.initializeSQL();
      
      // Test if SQL is available
      if (typeof window.SQL !== 'undefined') {
        this.addTestResult(results, '✓ SQL.js initialized successfully', 'success');
        
        // Test database creation
        const db = new window.SQL.Database();
        this.addTestResult(results, '✓ Database creation test passed', 'success');
        
        db.close();
      } else {
        this.addTestResult(results, '✗ SQL.js not available', 'error');
      }
      
    } catch (error) {
      this.addTestResult(results, `✗ SQL initialization failed: ${error.message}`, 'error');
    }
  }
  
  async testModelCreation() {
    const results = document.getElementById('apiTestResults');
    this.addTestResult(results, 'Testing Model Creation...', 'info');
    
    try {
      if (!this.generator) {
        this.addTestResult(results, '✗ Generator not initialized', 'error');
        return;
      }
      
      // Test if Model class is available
      if (typeof Model !== 'undefined') {
        this.addTestResult(results, '✓ Model class is available', 'success');
        
        // Test model creation
        const model = new Model({
          id: Date.now().toString(),
          name: 'Test Model',
          flds: [
            { name: 'Front' },
            { name: 'Back' }
          ],
          req: [
            [ 0, "all", [ 0 ] ]
          ],
          tmpls: [
            {
              name: 'Card 1',
              qfmt: '{{Front}}',
              afmt: '{{Back}}'
            }
          ]
        });
        
        this.addTestResult(results, '✓ Model creation test passed', 'success');
        
        // Test note creation
        const note = model.note(['Test Front', 'Test Back']);
        this.addTestResult(results, '✓ Note creation test passed', 'success');
        
      } else {
        this.addTestResult(results, '✗ Model class not available', 'error');
      }
      
    } catch (error) {
      this.addTestResult(results, `✗ Model creation failed: ${error.message}`, 'error');
    }
  }
  
  async testPackageGeneration() {
    const results = document.getElementById('apiTestResults');
    this.addTestResult(results, 'Testing Package Generation...', 'info');
    
    try {
      if (!this.generator) {
        this.addTestResult(results, '✗ Generator not initialized', 'error');
        return;
      }
      
      // Test data
      const testData = [
        {
          topic: 'Math',
          question: 'What is 2 + 2?',
          answer: '4'
        },
        {
          topic: 'Science',
          question: 'What is H2O?',
          answer: 'Water'
        }
      ];
      
      // Test validation
      const validation = this.generator.validateFlashcardData(testData);
      if (validation.valid) {
        this.addTestResult(results, '✓ Data validation test passed', 'success');
      } else {
        this.addTestResult(results, `✗ Data validation failed: ${validation.errors.join(', ')}`, 'error');
        return;
      }
      
      // Test package generation (without download)
      if (typeof Package !== 'undefined' && typeof Deck !== 'undefined') {
        const deck = new Deck(Date.now(), 'Test Deck');
        const pkg = new Package();
        pkg.addDeck(deck);
        
        this.addTestResult(results, '✓ Package generation test passed', 'success');
      } else {
        this.addTestResult(results, '✗ Package/Deck classes not available', 'error');
      }
      
    } catch (error) {
      this.addTestResult(results, `✗ Package generation failed: ${error.message}`, 'error');
    }
  }
  
  async runAllApiTests() {
    const results = document.getElementById('apiTestResults');
    results.innerHTML = '';
    
    this.addTestResult(results, '=== Running All API Tests ===', 'info');
    
    await this.testSqlInitialization();
    await this.testModelCreation();
    await this.testPackageGeneration();
    
    this.addTestResult(results, '=== All API Tests Completed ===', 'info');
  }
  
  // Validation Test Methods
  testValidationValid() {
    const results = document.getElementById('validationTestResults');
    this.addTestResult(results, 'Testing Valid Data...', 'info');
    
    try {
      if (!this.generator) {
        this.addTestResult(results, '✗ Generator not initialized', 'error');
        return;
      }
      
      const validData = [
        {
          topic: 'Math',
          question: 'What is 2 + 2?',
          answer: '4'
        },
        {
          topic: 'Science',
          question: 'What is the chemical formula for water?',
          answer: 'H2O'
        },
        {
          topic: 'History',
          question: 'When did World War II end?',
          answer: '1945'
        }
      ];
      
      const validation = this.generator.validateFlashcardData(validData);
      
      if (validation.valid) {
        this.addTestResult(results, '✓ Valid data test passed', 'success');
        this.addTestResult(results, `Found ${validData.length} valid flashcards`, 'success');
        
        if (validation.warnings.length > 0) {
          this.addTestResult(results, `Warnings: ${validation.warnings.join(', ')}`, 'info');
        }
        
        const stats = this.generator.getStatistics(validData);
        this.addTestResult(results, `Statistics: ${stats.totalCards} cards, ${stats.topics.length} topics`, 'info');
      } else {
        this.addTestResult(results, `✗ Valid data test failed: ${validation.errors.join(', ')}`, 'error');
      }
      
    } catch (error) {
      this.addTestResult(results, `✗ Valid data test error: ${error.message}`, 'error');
    }
  }
  
  testValidationInvalid() {
    const results = document.getElementById('validationTestResults');
    this.addTestResult(results, 'Testing Invalid Data...', 'info');
    
    try {
      if (!this.generator) {
        this.addTestResult(results, '✗ Generator not initialized', 'error');
        return;
      }
      
      const invalidData = [
        {
          topic: 'Math',
          question: '', // Empty question
          answer: '4'
        },
        {
          topic: 'Science',
          question: 'What is water?',
          answer: '' // Empty answer
        },
        {
          // Missing required fields
          topic: 'History'
        }
      ];
      
      const validation = this.generator.validateFlashcardData(invalidData);
      
      if (!validation.valid) {
        this.addTestResult(results, '✓ Invalid data test passed (correctly detected invalid data)', 'success');
        this.addTestResult(results, `Errors found: ${validation.errors.join(', ')}`, 'info');
      } else {
        this.addTestResult(results, '✗ Invalid data test failed (should have detected errors)', 'error');
      }
      
    } catch (error) {
      this.addTestResult(results, `✗ Invalid data test error: ${error.message}`, 'error');
    }
  }
  
  testValidationEdgeCases() {
    const results = document.getElementById('validationTestResults');
    this.addTestResult(results, 'Testing Edge Cases...', 'info');
    
    try {
      if (!this.generator) {
        this.addTestResult(results, '✗ Generator not initialized', 'error');
        return;
      }
      
      // Test 1: Empty array
      let validation = this.generator.validateFlashcardData([]);
      if (!validation.valid) {
        this.addTestResult(results, '✓ Empty array test passed', 'success');
      } else {
        this.addTestResult(results, '✗ Empty array test failed', 'error');
      }
      
      // Test 2: Non-array input
      validation = this.generator.validateFlashcardData('not an array');
      if (!validation.valid) {
        this.addTestResult(results, '✓ Non-array input test passed', 'success');
      } else {
        this.addTestResult(results, '✗ Non-array input test failed', 'error');
      }
      
      // Test 3: Very long content
      const longContent = 'A'.repeat(3000);
      validation = this.generator.validateFlashcardData([{
        topic: 'Test',
        question: 'Short question',
        answer: longContent
      }]);
      
      if (validation.valid && validation.warnings.length > 0) {
        this.addTestResult(results, '✓ Long content test passed (with warnings)', 'success');
      } else {
        this.addTestResult(results, '✗ Long content test failed', 'error');
      }
      
      // Test 4: Missing topic (should use default)
      validation = this.generator.validateFlashcardData([{
        question: 'What is this?',
        answer: 'A test'
      }]);
      
      if (validation.valid) {
        this.addTestResult(results, '✓ Missing topic test passed', 'success');
      } else {
        this.addTestResult(results, '✗ Missing topic test failed', 'error');
      }
      
    } catch (error) {
      this.addTestResult(results, `✗ Edge cases test error: ${error.message}`, 'error');
    }
  }
  
  // Helper Methods
  addTestResult(container, message, type) {
    const div = document.createElement('div');
    div.className = `test-result ${type}`;
    div.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    
    // Add color coding
    if (type === 'success') {
      div.style.color = '#065f46';
    } else if (type === 'error') {
      div.style.color = '#991b1b';
    } else if (type === 'info') {
      div.style.color = '#1e40af';
    }
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }
}

// Initialize the test suite when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TestSuite();
});