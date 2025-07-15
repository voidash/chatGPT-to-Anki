// Debug Extension Test Script
// Run this in ChatGPT console to test the extension functionality

console.log('=== Chrome Extension Debug Test ===');

// Test 1: Check if extension is loaded
if (window.chatToAnki) {
    console.log('✓ Extension loaded successfully');
    
    // Test 2: Debug input box detection
    console.log('\n--- Testing Input Box Detection ---');
    const inputBox = window.chatToAnki.debugFindInputBox();
    
    if (inputBox) {
        console.log('✓ Input box found:', inputBox.id);
        
        // Test 3: Debug typing functionality
        console.log('\n--- Testing Text Insertion ---');
        window.chatToAnki.debugTestTyping('Hello, this is a test message!');
        
        // Test 4: Check send button detection
        console.log('\n--- Testing Send Button Detection ---');
        const sendButton = window.chatToAnki.debugFindSendButton();
        
        if (sendButton) {
            console.log('✓ Send button found');
        } else {
            console.log('✗ Send button not found');
        }
        
        // Test 5: Manual text insertion test (gentle approach)
        console.log('\n--- Manual Text Insertion Test (Gentle) ---');
        setTimeout(() => {
            const testText = 'Manual insertion test - this should appear in the input box';
            console.log('Using gentle insertion to prevent page reload');
            window.chatToAnki.insertTextIntoContentEditable(inputBox, testText);
            console.log('Text inserted, check input box for:', testText);
            
            // Verify the page didn't reload
            setTimeout(() => {
                if (window.chatToAnki) {
                    console.log('✓ Page did not reload after text insertion');
                    
                    // Test response waiting
                    console.log('\n--- Testing Response Waiting ---');
                    console.log('You can now send a message to test response streaming...');
                    
                    // Add test for response detection
                    setTimeout(() => {
                        const response = window.chatToAnki.getCurrentResponse();
                        if (response) {
                            console.log('✓ Response detection working, current response length:', response.length);
                        } else {
                            console.log('ℹ No response detected (send a message first)');
                        }
                        
                        // Test prompt generation
                        console.log('\n--- Testing Prompt Generation ---');
                        try {
                            const prompt = window.chatToAnki.generateCustomPrompt();
                            console.log('✓ Prompt generation working');
                            console.log('Sample prompt (first 200 chars):', prompt.substring(0, 200) + '...');
                        } catch (error) {
                            console.log('✗ Prompt generation failed:', error.message);
                        }
                    }, 2000);
                } else {
                    console.log('✗ Page may have reloaded - extension not found');
                }
            }, 1000);
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