# Firefox Extension Compatibility Guide

This guide explains how to publish the Chat to Anki Flashcards extension on Firefox Add-ons (AMO).

## Quick Start

### Building Firefox Version
```bash
# Run the build script to create Firefox-compatible version
./build-firefox.sh
```

This creates a `firefox-build/` directory with all Firefox-compatible files.

### Testing Locally
1. Open Firefox
2. Go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select `manifest.json` from the `firefox-build/` directory

## Key Differences from Chrome

### 1. Manifest Format
- **Chrome**: Manifest V3
- **Firefox**: Manifest V2

### 2. Background Scripts
- **Chrome**: Service Worker (`background.service_worker`)
- **Firefox**: Background Scripts (`background.scripts`)

### 3. API Names
- **Chrome**: `chrome.*` APIs
- **Firefox**: `browser.*` APIs (with `chrome.*` fallback)

### 4. Extension Actions
- **Chrome**: `action` (Manifest V3)
- **Firefox**: `browser_action` (Manifest V2)

### 5. Script Execution
- **Chrome**: `chrome.scripting.executeScript()`
- **Firefox**: `browser.tabs.executeScript()` (Manifest V2)

## Files Modified for Firefox

### Core Firefox Files
- `manifest-firefox.json` → `manifest.json`
- `background-firefox.js` → `background.js`
- `popup-firefox.js` → `popup.js`
- `config-firefox.js` → `config.js`

### Cross-Browser API Pattern
All Firefox files use this pattern:
```javascript
// Use browser API if available, fallback to chrome API
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
```

## Publishing to Firefox Add-ons (AMO)

### 1. Prepare Extension Package
```bash
# Build Firefox version
./build-firefox.sh

# Create zip package
cd firefox-build
zip -r ../chat-to-anki-firefox.zip . -x "*.DS_Store"
```

### 2. Firefox Add-ons Developer Account
1. Create account at [addons.mozilla.org](https://addons.mozilla.org/developers/)
2. Verify your email address
3. Complete developer profile

### 3. Submit Extension
1. Go to [Developer Hub](https://addons.mozilla.org/developers/addon/submit/)
2. Upload `chat-to-anki-firefox.zip`
3. Fill out extension details:
   - **Name**: Chat to Anki Flashcards
   - **Summary**: Convert AI conversations (ChatGPT, Claude, Perplexity) into Anki flashcards
   - **Description**: [Copy from Chrome Web Store listing]
   - **Category**: Education & Reference
   - **Tags**: anki, flashcards, chatgpt, claude, ai, education

### 4. Review Process
- **Automatic Review**: Simple extensions (like ours) usually get automatic approval
- **Manual Review**: May take 1-7 days if flagged for manual review
- **Common Issues**: Check for any console errors or permission warnings

## Permission Differences

### Chrome Permissions
```json
"permissions": ["storage", "downloads", "activeTab", "scripting", "contextMenus", "notifications"],
"host_permissions": ["https://chatgpt.com/*", ...]
```

### Firefox Permissions
```json
"permissions": [
  "storage", "downloads", "activeTab", "contextMenus", "notifications",
  "https://chatgpt.com/*", "https://chat.openai.com/*", 
  "https://claude.ai/*", "https://perplexity.ai/*"
]
```

## Testing Checklist

### Core Functionality
- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Context menu appears when selecting text
- [ ] Context collection works
- [ ] Flashcard generation automation works
- [ ] Configuration page opens and functions
- [ ] Export functionality works
- [ ] Settings save/load correctly

### Firefox-Specific Tests
- [ ] Notifications display correctly
- [ ] Downloads work properly
- [ ] Context menu integration functions
- [ ] Cross-browser API detection works
- [ ] No console errors related to undefined APIs

## Troubleshooting

### Common Issues

1. **API Not Defined Errors**
   - Ensure `browserAPI` detection is working
   - Check for `browser` vs `chrome` API usage

2. **Manifest Validation Errors**
   - Verify Manifest V2 format
   - Check permission formatting
   - Validate web_accessible_resources format

3. **Script Injection Failures**
   - Use `tabs.executeScript` instead of `scripting.executeScript`
   - Check content script permissions

### Debug Steps
1. Check Browser Console (`Ctrl+Shift+J`)
2. Check Extension Console (about:debugging → Inspect)
3. Verify manifest.json loads correctly
4. Test each feature individually

## Version Management

### Keeping Chrome and Firefox in Sync
1. Make changes to main Chrome version first
2. Copy changes to Firefox-specific files
3. Test both versions
4. Update version numbers in both manifests
5. Build and package for both stores

### Release Process
1. **Chrome**: Upload to Chrome Web Store
2. **Firefox**: Run `./build-firefox.sh` and upload to AMO
3. **Anki Addon**: Update addon if needed
4. **Documentation**: Update README with new features

## Support and Maintenance

### User Support
- Firefox users may report different issues
- Test on both Firefox stable and Developer Edition
- Monitor AMO reviews and feedback

### Updates
- Firefox add-ons have same update mechanism as Chrome
- Automatic updates work the same way
- Version number management important for updates

## Resources

- [Firefox Extension Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- [Porting Chrome Extensions to Firefox](https://extensionworkshop.com/documentation/develop/porting-a-google-chrome-extension/)
- [Firefox Add-ons Developer Hub](https://addons.mozilla.org/developers/)
- [Web Extensions API Compatibility](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Browser_support_for_JavaScript_APIs)