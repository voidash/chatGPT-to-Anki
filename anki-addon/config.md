# ChatGPT Anki Sync - Configuration

## Settings

- **check_interval**: How often to check Downloads folder (seconds)
- **processed_action**: What to do with files after import ("keep", "move", "delete")  
- **show_notifications**: Show notifications when importing
- **processed_folder**: Folder name for processed files (when using "move")
- **secret_key**: Secret key for file verification
- **downloads_folder**: Path to Downloads folder (null = auto-detect)

## Values

- check_interval: 1-60 (default: 5)
- processed_action: "keep", "move", "delete" (default: "move")
- show_notifications: true/false (default: true)
- processed_folder: string (default: "processed")
- secret_key: string (default: "chatgpt-anki-extension-2024")
- downloads_folder: string path or null (default: null)