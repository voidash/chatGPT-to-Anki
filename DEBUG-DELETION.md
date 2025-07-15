# Debug Individual Flashcard Deletion

## Quick Test Steps

### 1. **Refresh Extension**
- Go to `chrome://extensions/`
- Click refresh icon (🔄) next to "Chat to Anki Flashcards"
- Open the config page

### 2. **Generate Test Data**
If you don't have flashcards yet:
- Go to ChatGPT and use the extension to generate some flashcards
- Or create test data manually in browser console

### 3. **Open Browser Console**
- In config page, press F12
- Go to Console tab

### 4. **Run Debug Function**
```javascript
// Test the deletion system
configManager.debugDeleteSystem();
```

### 5. **Check Debug Output**
You should see:
- Current flashcard data
- Parsed flashcards with indices
- Delete buttons found
- Button attributes for each button

### 6. **Test Delete Button Click**
- Look for delete buttons (red X that appears on hover)
- Click one and watch console for logs
- Should see: "Delete button clicked: {chatIndex: X, lineIndex: Y}"

## Expected Console Output

### Working System:
```
=== Debug Delete System ===
Current flashcard data: [{chatId: "abc123", csvData: "Topic,Question,Answer\nMath,What is 2+2?,4"}]
Parsed flashcards with indices: [{topic: "Math", question: "What is 2+2?", answer: "4", chatIndex: 0, lineIndex: 0}]
Delete buttons found: 1
Button 0: {chatIndex: "0", lineIndex: "0"}
```

### On Button Click:
```
Delete button clicked: {chatIndex: 0, lineIndex: 0}
deleteFlashcard called with: {chatIndex: 0, lineIndex: 0}
Current flashcardData: [...]
Chat data: {chatId: "abc123", csvData: "..."}
Lines before deletion: ["Topic,Question,Answer", "Math,What is 2+2?,4"]
Deleting line: Math,What is 2+2?,4
Lines after deletion: ["Topic,Question,Answer"]
Saving updated data: [...]
```

## Common Issues & Solutions

### Issue 1: "Delete buttons found: 0"
**Problem**: No delete buttons are being created
**Solution**: Check if flashcards are loading properly

### Issue 2: "configManager is not defined"
**Problem**: Config manager not initialized
**Solution**: Wait for page to load completely, then try again

### Issue 3: Button click does nothing
**Problem**: Event listeners not attached properly
**Solution**: Check console for JavaScript errors

### Issue 4: "Invalid chat index" or "Invalid line index"
**Problem**: Index mismatch between display and data
**Solution**: The indices are being calculated incorrectly

## Manual Test

If debug function doesn't work, try manual deletion:
```javascript
// Test manual deletion
configManager.deleteFlashcard(0, 0);  // Delete first flashcard
```

## Force Re-index

If indices seem wrong:
```javascript
// Force reload flashcards
configManager.loadFlashcards();
```

## Check Data Structure

```javascript
// Check raw storage data
chrome.storage.local.get(['flashcardData'], (result) => {
  console.log('Raw storage data:', result.flashcardData);
});
```

## Expected Behavior

1. **Hover over flashcard** → Red X button appears
2. **Click X button** → Confirmation dialog appears
3. **Click OK** → Flashcard disappears immediately
4. **Success message** → Green alert shows "Flashcard deleted successfully"
5. **Stats update** → Total count decreases by 1

## Files to Check

- **config.js**: Contains deletion logic
- **config.html**: Contains button styling
- Browser console: Shows debugging information

## Next Steps

1. Run the debug function
2. Check console output
3. Try clicking delete buttons
4. Report specific error messages if any
5. Check if the issue is with button visibility, click detection, or deletion logic