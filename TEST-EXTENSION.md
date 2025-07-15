# Chrome Extension Testing Guide

## Quick Test Instructions

### 1. Load the Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select this folder
4. The extension should appear in your extensions list

### 2. Test on ChatGPT
1. Go to [ChatGPT](https://chatgpt.com)
2. Look for the "Export to Anki" button in the sidebar
3. If you don't see it, refresh the page and wait 2-3 seconds

### 3. Debug the Extension
Open the browser console (F12) and run this command:

```javascript
// Copy and paste this entire script into the ChatGPT console
console.log('=== Chrome Extension Debug Test ===');

if (window.chatToAnki) {
    console.log('✓ Extension loaded successfully');
    
    // Test input box detection
    console.log('\n--- Testing Input Box Detection ---');
    const inputBox = window.chatToAnki.debugFindInputBox();
    
    if (inputBox) {
        console.log('✓ Input box found:', inputBox.id);
        
        // Test text insertion
        console.log('\n--- Testing Text Insertion ---');
        window.chatToAnki.debugTestTyping('Hello, this is a test message!');
        
        // Test send button detection
        console.log('\n--- Testing Send Button Detection ---');
        const sendButton = window.chatToAnki.debugFindSendButton();
        
        if (sendButton) {
            console.log('✓ Send button found');
        } else {
            console.log('✗ Send button not found');
        }
        
        // Manual text insertion test
        console.log('\n--- Manual Text Insertion Test ---');
        setTimeout(() => {
            const testText = 'Manual insertion test - this should appear in the input box';
            window.chatToAnki.insertTextIntoContentEditable(inputBox, testText);
            console.log('Text inserted, check input box for:', testText);
        }, 2000);
        
    } else {
        console.log('✗ Input box not found');
        console.log('Available input elements:');
        document.querySelectorAll('input, textarea, [contenteditable="true"]').forEach((el, i) => {
            console.log(`${i + 1}. ${el.tagName} - ID: ${el.id}, Class: ${el.className}`);
        });
    }
    
} else {
    console.log('✗ Extension not loaded');
    console.log('Available window properties:', Object.keys(window).filter(k => k.includes('anki') || k.includes('chat')));
}

console.log('\n=== Debug Test Complete ===');
```

## Expected Results

### ✓ Working Extension
- Extension loads successfully
- Input box is detected (ID: `prompt-textarea`)
- Text can be inserted into the input box
- Send button is found and functional
- No console errors

### ✗ Common Issues

#### Extension Not Loading
- Check if the extension is enabled in `chrome://extensions/`
- Look for any error messages in the extension details
- Refresh the ChatGPT page

#### Input Box Not Found
- The page may not be fully loaded
- Try refreshing and waiting a few seconds
- Check if ChatGPT's interface has changed

#### Text Not Inserting
- This is the main issue we've been fixing
- The debug script will test multiple insertion methods
- Check console for which method is being used

#### Page Reloads After Text Insertion (FIXED)
- **Issue**: ChatGPT page was reloading after text insertion
- **Fix**: Implemented gentle text insertion with minimal event triggering
- **Solution**: The extension now uses:
  - Gentle clearing methods
  - Minimal event triggering
  - Better navigation handling
  - Only essential DOM events

#### Premature Navigation to Config Page (FIXED)
- **Issue**: Extension was navigating to config page before ChatGPT response was complete
- **Fix**: Improved response waiting logic and delayed config page opening
- **Solution**: The extension now:
  - Waits for response streaming to complete (detects stable response length)
  - Adds delays before opening config page
  - Opens config page in new tab to avoid navigation interruption
  - Only opens config page if data was successfully generated

#### Prompt Customization Not Working (FIXED)
- **Issue**: Customization options weren't being applied to the actual prompt
- **Fix**: Enhanced form reading and debugging for prompt generation
- **Solution**: The extension now:
  - Properly reads form values when generating prompts
  - Includes comprehensive debugging for prompt generation
  - Shows console logs for troubleshooting customization issues
  - Validates form elements before reading values

#### Preview Modal Button Issues (FIXED)
- **Issue**: Close and copy buttons in preview modal weren't working
- **Fix**: Replaced inline event handlers with proper event listeners
- **Solution**: The preview modal now:
  - Uses proper event listeners for all buttons
  - Provides visual feedback for copy operations
  - Includes fallback clipboard functionality
  - Properly closes when clicking outside or on buttons

## Advanced Debugging

### Check Extension Status
```javascript
// Check if extension is properly loaded
console.log('Extension object:', window.chatToAnki);
console.log('Extension methods:', Object.getOwnPropertyNames(window.chatToAnki));
```

### Test Input Box Detection
```javascript
// Test all input selectors
const selectors = [
    '#prompt-textarea',
    'div[contenteditable="true"]#prompt-textarea',
    'div.ProseMirror[contenteditable="true"]',
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="Message"]',
    '[contenteditable="true"]',
    'textarea',
    'input[type="text"]'
];

selectors.forEach(selector => {
    const element = document.querySelector(selector);
    console.log(`${selector}: ${element ? 'Found' : 'Not found'}`);
});
```

### Test Send Button Detection
```javascript
// Test send button detection
const sendButton = window.chatToAnki.debugFindSendButton();
console.log('Send button:', sendButton);
if (sendButton) {
    console.log('Button properties:', {
        tagName: sendButton.tagName,
        textContent: sendButton.textContent,
        ariaLabel: sendButton.ariaLabel,
        className: sendButton.className,
        type: sendButton.type
    });
}
```

### Test Prompt Customization
```javascript
// Test prompt generation and customization
window.chatToAnki.debugTestPromptGeneration();

// Test preview modal
window.chatToAnki.previewPrompt();

// Test with custom settings (after opening modal)
// 1. Open the extension modal
// 2. Fill in some customization options
// 3. Run this test
const settings = window.chatToAnki.getUserPromptSettings();
console.log('Current settings:', settings);
const customPrompt = window.chatToAnki.generateCustomPrompt();
console.log('Custom prompt:', customPrompt);
```

## Troubleshooting

### Issue: Extension button not visible
**Solution:** Refresh the page and wait for the sidebar to load

### Issue: Text not inserting into input box
**Solution:** This is what we've been fixing. The new implementation includes:
- ProseMirror-specific handling
- Multiple fallback methods
- Better event triggering
- Clipboard API support

### Issue: Send button not working
**Solution:** The extension now has improved send button detection with multiple strategies

### Issue: Console errors
**Solution:** Check the specific error messages and ensure all permissions are granted

### Issue: Prompt customization not working
**Solution:** 
1. Open browser console and look for debugging messages
2. Check if form elements are being read properly
3. Run `window.chatToAnki.debugTestPromptGeneration()` to diagnose
4. Verify the modal is properly loaded before generating prompts
5. Check console for "generateCustomPrompt called" and related messages

### Issue: Preview modal buttons not working
**Solution:** 
1. Ensure the modal is fully loaded before clicking buttons
2. Check browser console for JavaScript errors
3. The copy button should show "Copied!" feedback when successful
4. Click outside the modal or use the close button to dismiss it

## Files Updated

The main fixes have been implemented in:
- `content.js` - Enhanced contenteditable handling
- `debug-extension.js` - Testing utilities
- `TEST-EXTENSION.md` - This testing guide

## Next Steps

1. Test the extension using the debug script above
2. If text insertion still doesn't work, check the console logs to see which method is being used
3. The extension now has multiple fallback methods for text insertion
4. Report any specific error messages for further debugging

## Technical Details

The extension now handles ChatGPT's contenteditable div with:
- **ProseMirror detection**: Specifically handles ProseMirror editor elements
- **Multiple insertion methods**: Clipboard API, execCommand, direct DOM manipulation
- **Gentle event triggering**: Minimal events to prevent page reloads
- **Improved debugging**: Comprehensive logging and debug functions
- **Robust send button detection**: Multiple strategies to find the send button
- **Anti-reload protection**: Prevents aggressive event triggering that causes page reloads

The key improvements are:
1. **Gentle text insertion**: Uses minimal event triggering to prevent page reloads
2. **Better navigation handling**: Prevents unnecessary navigation that causes reloads
3. **ProseMirror compatibility**: Specifically handles ChatGPT's ProseMirror editor
4. **Multiple fallback methods**: If one method fails, gracefully tries alternatives
5. **Event optimization**: Only triggers essential DOM events