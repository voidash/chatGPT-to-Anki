# Prompt Customization Guide

## Overview

The Chat to Anki extension now features a **two-level prompt system** that allows users to customize how flashcards are generated while maintaining the essential CSV formatting requirements.

## Two-Level System

### Level 1: Base CSV Formatting Template
This level ensures that ChatGPT always outputs properly formatted CSV data that can be processed by the extension. It includes:

- **Fixed CSV format requirements**: Topic,Question,Answer
- **Output constraints**: CSV data only, no extra text
- **Essential structure**: Proper formatting for Anki import
- **Example formats**: Clear examples of expected output

### Level 2: User Customization Options
This level allows users to specify their preferences for content generation:

## Customization Options

### 1. Topic Focus
- **Field**: Text input (optional)
- **Purpose**: Specify what topics to focus on from the conversation
- **Examples**: 
  - "JavaScript functions"
  - "Machine Learning concepts"
  - "History dates"
  - "Programming best practices"

### 2. Question Type
- **Field**: Dropdown selection
- **Options**:
  - **Mixed**: Definitions, examples, and applications
  - **Definitions**: "What is..." questions only
  - **Examples**: Use cases and examples
  - **Applications**: Practical "How to..." questions
  - **Comparisons**: Differences between concepts
  - **Steps**: Step-by-step processes
  - **Facts**: Specific facts and details

### 3. Difficulty Level
- **Field**: Dropdown selection
- **Options**:
  - **Mixed**: Beginner, intermediate, and advanced
  - **Beginner**: Simple language and basic concepts
  - **Intermediate**: Moderate complexity with technical terms
  - **Advanced**: Complex questions with technical depth

### 4. Number of Cards
- **Field**: Dropdown selection
- **Options**:
  - **Auto**: 5-20 cards based on content (default)
  - **Fixed numbers**: 5, 10, 15, 20, or 25 cards

### 5. Additional Instructions
- **Field**: Text area (optional)
- **Purpose**: Custom instructions for flashcard generation
- **Examples**:
  - "Focus on code examples"
  - "Include mnemonics"
  - "Use simple language"
  - "Add practical applications"

## How It Works

### Template Generation Process

1. **Base Template**: Always includes CSV formatting requirements
2. **User Settings**: Collected from modal form
3. **Customization Text**: Generated based on user preferences
4. **Final Prompt**: Base template + customization instructions

### Example Generated Prompt

```
Based on our conversation, create flashcards in CSV format. Analyze the conversation and create comprehensive flashcards covering key concepts, definitions, and important details.

CRITICAL REQUIREMENTS:
- Output ONLY CSV data, no other text or formatting
- Format: Topic,Question,Answer
- Each line must be a complete flashcard in CSV format
- Questions should test understanding, not just recall
- Answers should be concise but complete
- Topics should be categorized (e.g., "Programming", "Science", "General")

EXAMPLE FORMAT:
Programming,What is a variable in programming?,A variable is a container that stores data values that can be changed during program execution
Science,What is photosynthesis?,The process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen

CUSTOMIZATION INSTRUCTIONS:
- Focus specifically on: JavaScript functions
- Question style: Focus on practical applications and "How to..." questions
- Difficulty level: Intermediate with moderate complexity
- Create exactly 15 flashcards
- Additional instructions: Focus on code examples and include practical use cases
```

## Usage Instructions

### For Users

1. **Open Extension**: Click the "Export to Anki" button in ChatGPT sidebar
2. **Select Chats**: Choose which conversations to process
3. **Customize Settings**: 
   - Fill in topic focus if desired
   - Select question type preference
   - Choose difficulty level
   - Set number of cards
   - Add any additional instructions
4. **Preview Prompt**: Click "Preview Prompt" to see the generated prompt
5. **Generate**: Click "Generate Flashcards" to process

### Preview Feature

The "Preview Prompt" button allows users to:
- See exactly what will be sent to ChatGPT
- Understand how their settings affect the prompt
- Copy the prompt to clipboard for manual use
- Verify the prompt before processing

## Technical Implementation

### Key Methods

#### `generateCustomPrompt()`
- Main method that combines base template with user settings
- Returns complete prompt string

#### `getBasePromptTemplate()`
- Returns the fixed CSV formatting requirements
- Ensures consistent output format

#### `getCustomizationText(settings)`
- Generates customization instructions based on user input
- Translates UI selections into natural language instructions

#### `getUserPromptSettings()`
- Collects user input from modal form
- Provides defaults if modal not available

#### `previewPrompt()`
- Creates preview modal showing generated prompt
- Allows copying prompt to clipboard

### Files Modified

- **content.js**: Added prompt generation methods
- **styles.css**: Added styling for customization form
- **PROMPT-CUSTOMIZATION.md**: This documentation

## Benefits

### For Users
- **Flexibility**: Customize flashcards for specific learning needs
- **Control**: Fine-tune question types and difficulty
- **Transparency**: See exactly what prompt is being sent
- **Efficiency**: Generate targeted flashcards quickly

### For Developers
- **Maintainability**: Clean separation of base requirements and customization
- **Extensibility**: Easy to add new customization options
- **Reliability**: Base template ensures consistent CSV output
- **Debugging**: Preview feature helps troubleshoot issues

## Future Enhancements

Potential additions to the customization system:
- **Preset templates**: Save and reuse common configurations
- **Advanced formatting**: HTML formatting options for cards
- **Language settings**: Generate cards in different languages
- **Export options**: Different output formats beyond CSV
- **Batch processing**: Apply settings to multiple chats simultaneously

## Troubleshooting

### Common Issues

1. **Prompt too long**: Reduce additional instructions or topic focus
2. **Inconsistent output**: Check that base template requirements are clear
3. **Modal not responsive**: Ensure proper CSS styling is loaded
4. **Settings not saving**: Verify form field IDs match JavaScript selectors

### Debug Tips

- Use "Preview Prompt" to verify prompt generation
- Check browser console for JavaScript errors
- Test with simple settings first, then add complexity
- Verify CSV output format matches expected structure