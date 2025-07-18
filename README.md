# Chat to Anki Flashcards

Convert AI conversations from ChatGPT, Claude, and Perplexity into Anki flashcards automatically.

## Project Structure

This project has been organized into two main components:

### 📁 `chrome-extension/`
Contains the Chrome browser extension that:
- Runs on ChatGPT, Claude.ai, and Perplexity.ai
- Extracts conversations and generates flashcards
- Provides customizable prompt templates
- Exports flashcards as CSV or Anki packages

### 📁 `anki-addon-moved/`
Contains the Anki Desktop addon that:
- Monitors Downloads folder for new flashcard packages
- Automatically imports flashcards into Anki
- Provides seamless integration between extension and Anki

## Quick Start

1. **Install Chrome Extension:**
   ```bash
   cd chrome-extension/
   # Load unpacked extension in Chrome
   ```

2. **Install Anki Addon:**
   ```bash
   cd anki-addon-moved/
   python build_addon.py
   # Install the generated .ankiaddon file in Anki
   ```

3. **Use the System:**
   - Browse to ChatGPT, Claude, or Perplexity
   - Click the extension icon
   - Generate flashcards from your conversations
   - Flashcards automatically appear in Anki

## Features

- ✅ **Multi-Platform Support**: ChatGPT, Claude.ai, Perplexity.ai
- ✅ **Customizable Prompts**: Configure how flashcards are generated
- ✅ **Automatic Import**: Seamless Anki integration
- ✅ **CSV Export**: Manual export option available
- ✅ **AnkiWeb Sync**: Full compatibility with Anki ecosystem

## Documentation

- See `chrome-extension/README.md` for extension details
- See `anki-addon-moved/README.md` for addon details

## Version

Current version: 1.0.0