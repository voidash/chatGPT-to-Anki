# Genanki-js Test Suite

This test suite provides comprehensive testing for the genanki-js Anki flashcard generation functionality.

## Quick Start

### Option 1: Direct Browser Access (Recommended)
The test suite now uses CDN resources to avoid CORS issues:

1. **Open `test.html` directly in your browser**
2. **No server required** - CDN dependencies handle CORS automatically
3. **Select a test tab** and run tests

### Option 2: Local Server (Alternative)
If you prefer to use local files:

#### Using Python (built-in server):
```bash
# From the project root directory
python -m http.server 8000
# Then open: http://localhost:8000/test/test.html
```

#### Using Node.js (if you have it):
```bash
# Install a simple server
npm install -g http-server
# From the project root directory
http-server -p 8000
# Then open: http://localhost:8000/test/test.html
```

#### Using PHP (if you have it):
```bash
# From the project root directory
php -S localhost:8000
# Then open: http://localhost:8000/test/test.html
```

## Test Tabs

### 1. CSV Test
- **Purpose**: Test CSV parsing and Anki package generation
- **Usage**: Paste CSV content (Topic,Question,Answer format) and generate/validate packages
- **Example CSV**:
  ```csv
  Math,What is 2 + 2?,4
  Science,What is H2O?,Water
  History,When did WWII end?,1945
  ```

### 2. API Test
- **Purpose**: Test core genanki-js API functionality
- **Tests**:
  - SQL.js initialization
  - Model creation
  - Package generation
  - Run all tests

### 3. Validation Test
- **Purpose**: Test data validation with various scenarios
- **Tests**:
  - Valid data validation
  - Invalid data detection
  - Edge case handling

## Dependencies

The test suite loads the following dependencies from CDN:
- **SQL.js**: SQLite database engine for browser
- **JSZip**: ZIP file creation for .apkg files
- **FileSaver.js**: File download functionality
- **genanki.js**: Main Anki package generation library

## File Structure

```
test/
├── test.html     # Main test interface
├── test.js       # Test functionality
└── README.md     # This file
```

## Troubleshooting

### Common Issues

1. **CORS Error**: Use CDN version (default) or run a local server
2. **SQL.js not loading**: Check internet connection for CDN access
3. **Package generation fails**: Check browser console for detailed errors

### Browser Console
Open browser Developer Tools (F12) and check the Console tab for detailed error messages and test results.

## Test Results

- **Green text**: Tests passed
- **Red text**: Tests failed
- **Blue text**: Informational messages

All test results are logged to the browser console with timestamps for detailed debugging.