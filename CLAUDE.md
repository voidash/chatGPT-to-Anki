# CLAUDE.md - Development Reference

## Project Overview
This Chrome extension converts ChatGPT conversations into Anki flashcards using the genanki-js library. This document provides essential information for maintaining and extending the codebase.

## Genanki-js Implementation

### Library Information
- **Library**: genanki-js (JavaScript port of Python genanki)
- **Repository**: https://github.com/krmanik/genanki-js
- **Documentation**: https://genanki.js.org/
- **CDN**: https://cdn.jsdelivr.net/gh/krmanik/genanki-js/dist/genanki.js
- **License**: GNU Affero General Public License v3

### Dependencies Required
The following dependencies must be loaded in order:
1. **sql.js** - SQLite database engine for browser (`js/sql/sql-wasm.js`)
2. **JSZip** - ZIP file creation (`jszip.min.js`)
3. **FileSaver.js** - File download functionality (`FileSaver.js`)
4. **genanki.js** - Main library (from CDN)

### Key Implementation Details

#### SQL.js Initialization
```javascript
const config = {
  locateFile: filename => `js/sql/sql-wasm.wasm`
};
window.SQL = await initSqlJs(config);
```

#### Model Configuration
```javascript
const model = new Model({
  id: "unique_model_id",           // Must be string
  name: "Model Name",
  flds: [                          // Fields (not 'fields')
    { name: "Front" },
    { name: "Back" }
  ],
  req: [                           // Required for card generation
    [ 0, "all", [ 0 ] ]           // [template_index, "all"|"any", [field_indices]]
  ],
  tmpls: [                         // Templates (not 'templates')
    {
      name: "Card 1",
      qfmt: "{{Front}}",           // Question format
      afmt: "{{Back}}"             // Answer format
    }
  ],
  css: "/* CSS styles */"
});
```

#### Deck and Package Creation
```javascript
const deck = new Deck(deck_id, "Deck Name");
deck.addNote(model.note(['field1', 'field2'], ['tag1', 'tag2']));

const pkg = new Package();
pkg.addDeck(deck);
pkg.writeToFile('filename.apkg');  // Automatically downloads
```

### File Structure

#### Core Files
- `genanki.js` - AnkiPackageGenerator class wrapper
- `config.html` - Configuration page with all dependencies
- `config.js` - Configuration logic and UI handling
- `manifest.json` - Extension manifest with web_accessible_resources

#### Test Files
- `test/test.html` - Comprehensive test suite interface
- `test/test.js` - Test functionality and API testing

#### Dependencies Location
```
/js/sql/
  ├── sql-wasm.js
  └── sql-wasm.wasm
/jszip.min.js
/FileSaver.js
/test/
  ├── test.html
  └── test.js
```

### AnkiPackageGenerator Class

#### Key Methods
- `initializeSQL()` - Initialize SQL.js engine
- `generateAnkiPackage(flashcardData, deckName)` - Create package
- `downloadAnkiPackage(flashcardData, deckName, filename)` - Download package
- `validateFlashcardData(flashcardData)` - Validate input data
- `testImplementation()` - Test the setup

#### Data Format
```javascript
const flashcardData = [
  {
    topic: "Topic Name",
    question: "Question text",
    answer: "Answer text"
  }
];
```

### Common Issues and Solutions

#### 1. "genanki.js library not loaded properly"
**Cause**: Dependencies not loaded in correct order
**Solution**: Ensure CDN script loads before local genanki.js

#### 2. "SQL.js not loaded"
**Cause**: SQL.js not initialized or wasm file not found
**Solution**: Check sql-wasm.wasm path and initSqlJs call

#### 3. Cards not generating
**Cause**: Missing or incorrect `req` field in model
**Solution**: Ensure req field specifies which fields must be non-empty

#### 4. Package download fails
**Cause**: FileSaver.js not loaded or package creation error
**Solution**: Check browser console for specific errors

#### 5. CORS Error in Test Suite
**Cause**: Browser blocking file:// protocol access to local files
**Solution**: 
- **Recommended**: Use CDN version (default in test.html)
- **Alternative**: Run local HTTP server (see Test Suite Usage)
- **Error example**: `Access to fetch at 'file:///.../sql-wasm.wasm' has been blocked by CORS policy`

### Testing the Implementation

#### Basic Test
```javascript
const generator = new AnkiPackageGenerator();
const result = await generator.testImplementation();
console.log('Test result:', result);
```

#### Full Test with Sample Data
```javascript
const generator = new AnkiPackageGenerator();
const testData = [
  {
    topic: 'Math',
    question: 'What is 2 + 2?',
    answer: '4'
  }
];
await generator.downloadAnkiPackage(testData, 'Test Deck');
```

#### Test Suite
A comprehensive test suite is available in the `/test` folder:

1. **Location**: `test/test.html` - standalone test page
2. **Purpose**: Test and validate all genanki-js functionality
3. **Features**:
   - **CSV Test Tab**: Test CSV parsing and Anki package generation
   - **API Test Tab**: Test core genanki-js API functionality
   - **Validation Test Tab**: Test data validation with various scenarios

#### Test Suite Usage

**Option 1: Direct Browser Access (Recommended)**
1. Open `test/test.html` directly in your browser
2. CDN dependencies automatically handle CORS issues
3. Choose a test tab and run tests

**Option 2: Local Server (Alternative)**
If you prefer local files, run a simple HTTP server:
```bash
# Python (built-in)
python -m http.server 8000

# Node.js (if installed)
npx http-server -p 8000

# PHP (if installed)
php -S localhost:8000
```
Then open: `http://localhost:8000/test/test.html`

**Test Tabs:**
- **CSV Test**: Paste CSV content and generate Anki packages
- **API Test**: Test SQL initialization, model creation, package generation
- **Validation Test**: Test data validation with valid/invalid/edge cases

#### CSV Test Format
```csv
Math,What is 2 + 2?,4
Science,What is H2O?,Water
History,When did WWII end?,1945
```

#### Test Suite Structure
- `test/test.html` - Main test interface with tabs and styling
- `test/test.js` - Test functionality and API testing methods
- Dependencies loaded from parent directory via relative paths

#### Key Test Methods
- `csvTestDownload()` - Parse CSV and generate Anki package
- `csvTestValidate()` - Validate CSV format and content
- `testSqlInitialization()` - Test SQL.js initialization
- `testModelCreation()` - Test Model/Note creation
- `testPackageGeneration()` - Test Package/Deck creation
- `testValidationValid()` - Test with valid data
- `testValidationInvalid()` - Test with invalid data
- `testValidationEdgeCases()` - Test edge cases

### Build Process

#### No NPM Package
- genanki-js is not available as NPM package
- Use CDN version: `https://cdn.jsdelivr.net/gh/krmanik/genanki-js/dist/genanki.js`
- Remove any npm dependencies for genanki

#### Package.json Updates
```json
{
  "scripts": {
    "build": "echo 'Using CDN version of genanki-js'",
    "dev": "echo 'Extension ready for development'"
  }
}
```

### Extension Integration

#### Manifest.json Requirements
```json
{
  "web_accessible_resources": [
    {
      "resources": [
        "genanki.js",
        "js/sql/sql-wasm.js",
        "js/sql/sql-wasm.wasm",
        "jszip.min.js",
        "FileSaver.js"
      ],
      "matches": ["https://chatgpt.com/*", "https://chat.openai.com/*"]
    }
  ]
}
```

#### Content Security Policy
- CDN loading requires appropriate CSP headers
- Use https://cdn.jsdelivr.net for reliable CDN access

### Future Maintenance

#### Library Updates
- Check https://github.com/krmanik/genanki-js for updates
- Update CDN URL if needed
- Test with new versions before deploying

#### API Changes
- genanki-js API is stable but monitor for changes
- Key areas to watch: Model creation, Package generation
- Test all functionality after updates

#### Browser Compatibility
- Ensure sql-wasm.wasm loads correctly in all browsers
- Test FileSaver.js functionality
- Verify JSZip compatibility

### Performance Considerations

#### Memory Usage
- SQL.js loads entire SQLite engine in memory
- Large decks may cause memory issues
- Consider chunking large datasets

#### File Size
- WASM files add significant size to extension
- Monitor total extension size
- Consider lazy loading for large dependencies

### Security Notes

#### Web Assembly
- sql-wasm.wasm is loaded from local files
- Ensure file integrity and source verification
- Monitor for security updates

#### CDN Dependencies
- Using external CDN introduces trust dependency
- Consider hosting genanki.js locally for production
- Implement integrity checks where possible

### Debugging Tips

#### Console Logging
```javascript
// Enable debug logging
window.GENANKI_DEBUG = true;

// Check SQL initialization
console.log('SQL available:', typeof window.SQL);

// Verify model creation
console.log('Model classes:', typeof Model, typeof Deck, typeof Package);
```

#### Common Debug Commands
```javascript
// Test SQL
const db = new window.SQL.Database();
console.log('SQL working:', db);

// Test model creation
const testModel = new Model({
  id: "test123",
  name: "Test",
  flds: [{ name: "Front" }],
  req: [[ 0, "all", [ 0 ] ]],
  tmpls: [{ name: "Card", qfmt: "{{Front}}", afmt: "{{Front}}" }]
});
console.log('Model created:', testModel);
```

#### Chrome Extension Debugging
For debugging the Chrome extension content script:

```javascript
// Debug input box detection
chatToAnki.debugFindInputBox();

// Test typing into ChatGPT input
chatToAnki.debugTestTyping('Test message');

// Debug send button detection
chatToAnki.debugFindSendButton();

// Test the full flashcard generation process
chatToAnki.openChatSelectionModal();
```

#### Common Extension Issues
1. **ContentEditable not working**: Check if input box is properly detected
2. **Text not inserting**: Verify ProseMirror compatibility
3. **Send button not clicking**: Check button detection logic
4. **Chat not loading**: Verify URL patterns and selectors

### Version History

#### Current Implementation
- **Version**: Based on genanki-js CDN
- **Date**: 2024-07-15
- **Changes**: Updated from npm package to CDN, fixed API usage
- **Status**: Working and tested

#### Previous Issues
- Attempted to use non-existent npm package
- Incorrect API usage (genanki.Model vs Model)
- Missing required fields in model configuration
- Improper SQL.js initialization

---

## Development Commands

### Testing
```bash
# No build required - uses CDN
# Test in browser console:
# const generator = new AnkiPackageGenerator();
# generator.testImplementation();
```

### Deployment
```bash
# Package extension
npm run package
# Creates chat-to-flashcards.zip
```

---

*This file should be updated whenever the genanki-js implementation changes or new issues are discovered.*