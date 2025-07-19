# Chrome Extension - Chat to Anki Flashcards

This folder contains the Chrome extension that converts AI conversations (ChatGPT, Claude, Perplexity) into Anki flashcards.

## Files Overview

### Core Extension Files
- `manifest.json` - Chrome extension manifest (V3)
- `content.js` - Main content script that runs on AI platforms
- `background.js` - Service worker for background tasks
- `popup.html` & `popup.js` - Extension popup interface
- `config.html` & `config.js` - Configuration page
- `styles.css` - Extension styling

### Anki Integration
- `genanki.js` - Extension wrapper for Anki package generation
- `anki-worker.js` - Web worker for Anki operations
- `anki/genanki.js` - Core genanki.js library (third-party)

### Dependencies
- `sql/sql.js` - SQLite engine for Anki database
- `jszip.min.js` - ZIP file creation
- `filesaver/FileSaver.min.js` - File download functionality

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select this `chrome-extension` folder
5. The extension will be installed and ready to use

## Usage

1. Navigate to ChatGPT, Claude.ai, or Perplexity.ai
2. Click the extension icon in the toolbar
3. Click "Export to Anki" to start the flashcard generation process
4. Configure your preferences in the settings page

## Supported Platforms

- ChatGPT (chatgpt.com)
- Claude.ai (claude.ai)
- Perplexity.ai (perplexity.ai)