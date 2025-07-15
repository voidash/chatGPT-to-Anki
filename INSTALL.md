# Installation Guide

## Quick Start

1. **Download the extension files** (all files in this directory)
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top right)
4. **Click "Load unpacked"** and select this folder
5. **Go to ChatGPT** (chatgpt.com) and start using the extension!

## Detailed Installation Steps

### Step 1: Prepare the Extension

If you downloaded the source code:
```bash
# Install dependencies (optional, for development)
npm install

# Copy genanki library (if available)
npm run build
```

### Step 2: Load Extension in Chrome

1. Open Google Chrome
2. Type `chrome://extensions/` in the address bar
3. Enable "Developer mode" using the toggle in the top right corner
4. Click "Load unpacked" button
5. Navigate to and select the `chat-to-flashcards` folder
6. The extension should now appear in your extensions list

### Step 3: Verify Installation

1. Look for the extension icon in your Chrome toolbar
2. Go to [chatgpt.com](https://chatgpt.com)
3. Look for the "Export to Anki" button in the sidebar
4. Click the extension icon to access the popup

## Dependencies

The extension requires:
- **Chrome 88+** (for Manifest V3 support)
- **genanki.js** (for Anki package generation)
- Active internet connection to ChatGPT

## File Structure

Make sure all these files are in the same directory:
```
chat-to-flashcards/
├── manifest.json          # Extension configuration
├── content.js             # Main functionality
├── background.js          # Background script
├── popup.html             # Extension popup
├── popup.js               # Popup functionality
├── config.html            # Configuration page
├── config.js              # Configuration logic
├── styles.css             # Styling
├── genanki.js             # Anki package generator
├── package.json           # Dependencies
├── README.md              # Documentation
└── INSTALL.md             # This file
```

## Troubleshooting

### Extension Not Loading

**Issue**: Extension fails to load in Chrome
**Solution**: 
- Check that all files are present
- Ensure manifest.json is valid
- Check Chrome console for errors

### Permission Errors

**Issue**: Extension can't access ChatGPT
**Solution**:
- Verify `host_permissions` in manifest.json
- Reload the extension after making changes
- Check Chrome's site permissions

### Anki Export Not Working

**Issue**: Cannot create Anki packages
**Solution**:
- Make sure genanki.js is included
- Check browser console for JavaScript errors
- Try CSV export as fallback

### Chat Detection Issues

**Issue**: Extension doesn't find chats
**Solution**:
- Refresh the ChatGPT page
- Try different detection strategies in settings
- Check if you have chat history

## Development Setup

For developers who want to modify the extension:

### Prerequisites
- Node.js 14+ (for package management)
- Chrome browser
- Text editor (VS Code recommended)

### Development Commands
```bash
# Install dependencies
npm install

# Build for development
npm run dev

# Package for distribution
npm run package
```

### Testing
1. Make changes to source files
2. Reload extension in Chrome (`chrome://extensions/`)
3. Test on ChatGPT
4. Check browser console for errors

## Configuration

### Default Settings
- Max flashcards per chat: 20
- Default topic: "General"
- Detection strategy: Auto
- Export format: CSV
- Deck name: "ChatGPT Flashcards"

### Customization
Access settings through:
1. Extension popup → Configuration
2. Or directly after flashcard generation

## Security & Privacy

The extension:
- ✅ Only accesses chatgpt.com
- ✅ Stores data locally in browser
- ✅ Does not send data to external servers
- ✅ Open source and auditable

## Support

If you encounter issues:

1. **Check the console**: Open Chrome DevTools (F12) and look for errors
2. **Try incognito mode**: Test if the issue persists in incognito
3. **Reload the extension**: Go to chrome://extensions/ and click reload
4. **Update Chrome**: Make sure you're running the latest version

## Next Steps

After installation:
1. Go to ChatGPT and have some conversations
2. Use the "Export to Anki" button to generate flashcards
3. Review and configure your flashcards
4. Export to Anki and start studying!

---

**Note**: This is a development version. Report issues on GitHub.