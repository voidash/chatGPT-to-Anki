# Chat to Anki Flashcards

A Chrome extension that converts ChatGPT conversations into Anki flashcards automatically.

## Features

- 🤖 **Future-proof Chat Detection**: Uses multiple strategies to detect chats even when ChatGPT's UI changes
- 📝 **Automatic Flashcard Generation**: AI-powered prompt injection to generate flashcards from conversations
- 🎯 **Smart Topic Categorization**: Automatically categorizes flashcards by topic (Programming, Science, etc.)
- 📊 **CSV Export**: Export flashcards as CSV files for manual processing
- 📦 **Anki Package Generation**: Create .apkg files for direct import into Anki
- 🔄 **AnkiWeb Sync**: Sync directly to your AnkiWeb account (coming soon)
- ⚙️ **Configurable Settings**: Customize flashcard generation and export options

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The extension should now appear in your Chrome toolbar

### From Chrome Web Store

Coming soon!

## Usage

1. **Navigate to ChatGPT**: Go to [chatgpt.com](https://chatgpt.com)
2. **Find the Export Button**: Look for the "Export to Anki" button in the sidebar
3. **Select Chats**: Click the button to open a modal with all your chats
4. **Choose Conversations**: Select the chats you want to convert to flashcards
5. **Confirm Export**: Click "Export Selected" to start the process
6. **Review Results**: The extension will automatically generate flashcards and open the configuration page

## How It Works

### Future-Proof Chat Detection

The extension uses multiple detection strategies to find chats:

1. **Data Attributes**: Looks for `data-testid` attributes (most reliable)
2. **ARIA Labels**: Uses accessibility labels to identify chat elements
3. **URL Patterns**: Finds links containing `/c/` (chat URLs)
4. **Structural Patterns**: Analyzes DOM structure to find chat containers
5. **Text Content**: Fallback method using text patterns

### Flashcard Generation Process

1. **Chat Selection**: User selects which conversations to process
2. **Navigation**: Extension navigates to each selected chat
3. **Prompt Injection**: Automatically sends a detailed prompt requesting flashcards
4. **Response Processing**: Parses the AI response to extract CSV data
5. **Error Handling**: Retries with more verbose prompts if parsing fails
6. **Storage**: Saves flashcard data to extension storage

### Export Options

- **CSV Export**: Download flashcards as a CSV file
- **Anki Package**: Generate .apkg files for direct Anki import
- **AnkiWeb Sync**: Sync directly to AnkiWeb account (coming soon)

## Configuration

Access the configuration page by:
- Clicking the extension icon and selecting "Configuration"
- Or being redirected after flashcard generation

### Settings Available

- **Max Flashcards per Chat**: Limit the number of flashcards generated (5-100)
- **Default Topic Category**: Set default topic for uncategorized flashcards
- **Detection Strategy**: Choose how the extension detects chats
- **Export Format**: Set preferred export format (CSV, Anki, or both)
- **Anki Deck Name**: Customize the name of generated Anki decks

## Development

### Setup

```bash
# Install dependencies
npm install

# Copy genanki.js library
npm run build

# Development mode
npm run dev
```

### Project Structure

```
chat-to-flashcards/
├── manifest.json          # Extension manifest
├── content.js             # Main content script
├── background.js          # Background service worker
├── popup.html/js          # Extension popup
├── config.html/js         # Configuration page
├── styles.css             # Extension styles
├── genanki.js             # Anki package generator
├── package.json           # Node.js dependencies
└── README.md              # This file
```

### Key Components

- **ChatToAnkiExtension**: Main class handling chat detection and processing
- **ConfigManager**: Manages configuration page and settings
- **AnkiPackageGenerator**: Handles Anki package creation using genanki.js

## Troubleshooting

### Extension Not Working

1. **Refresh the page**: Sometimes the extension needs a page refresh to load
2. **Check permissions**: Make sure the extension has access to chatgpt.com
3. **Update Chrome**: Ensure you're running a recent version of Chrome

### No Chats Detected

1. **Make sure you're on ChatGPT**: The extension only works on chatgpt.com
2. **Check chat list**: Ensure you have conversations in your chat history
3. **Try different detection strategy**: Go to Settings and change the detection method

### Flashcard Generation Issues

1. **Check your prompt**: Make sure ChatGPT understands the flashcard request
2. **Retry with different chat**: Some conversations may not be suitable for flashcards
3. **Manual CSV editing**: You can edit the CSV data in the configuration page

### Export Problems

1. **Check browser downloads**: Make sure downloads aren't blocked
2. **Try different format**: If Anki export fails, try CSV export
3. **Clear storage**: Go to Settings and clear all flashcards to start fresh

## Privacy

This extension:
- ✅ Only accesses chatgpt.com and chat.openai.com
- ✅ Stores data locally in your browser
- ✅ Does not send data to external servers
- ✅ Does not collect personal information
- ✅ Open source and transparent

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Support

- 🐛 Report bugs: [GitHub Issues](https://github.com/yourusername/chat-to-flashcards/issues)
- 💡 Feature requests: [GitHub Discussions](https://github.com/yourusername/chat-to-flashcards/discussions)
- 📧 Contact: your.email@example.com

## Acknowledgments

- [genanki.js](https://github.com/krmanik/genanki-js) for Anki package generation
- ChatGPT for inspiration and testing conversations
- The Anki community for the amazing spaced repetition software

---

**Note**: This extension is not affiliated with OpenAI or Anki. It's an independent project designed to enhance your learning experience.