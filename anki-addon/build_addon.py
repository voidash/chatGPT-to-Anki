#!/usr/bin/env python3
"""
Build script for ChatGPT Anki Sync addon
Creates a .ankiaddon file for distribution
"""

import os
import shutil
import zipfile
from pathlib import Path

def build_addon():
    """Build the addon package"""
    addon_dir = Path(__file__).parent
    build_dir = addon_dir / "build"
    
    # Clean build directory
    if build_dir.exists():
        shutil.rmtree(build_dir)
    build_dir.mkdir()
    
    # Files to include in the addon
    files_to_include = [
        "__init__.py",
        "sync_monitor.py",
        "config.py",
        "config_dialog.py",
        "simple_config.py",
        "simple_config_dialog.py",
        "text_config.py",
        "manifest.json",
        "config.json",
        "config.md"
    ]
    
    # Create addon package
    addon_file = build_dir / "chatgpt_anki_sync.ankiaddon"
    
    with zipfile.ZipFile(addon_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for file_name in files_to_include:
            file_path = addon_dir / file_name
            if file_path.exists():
                zf.write(file_path, file_name)
                print(f"Added {file_name}")
            else:
                print(f"Warning: {file_name} not found")
    
    print(f"\\nAddon package created: {addon_file}")
    print(f"Size: {addon_file.stat().st_size} bytes")
    
    # Create installation instructions
    instructions_file = build_dir / "INSTALLATION.md"
    with open(instructions_file, 'w') as f:
        f.write("""# ChatGPT Anki Sync Addon Installation

## Installation Steps

1. **Download the addon file**: `chatgpt_anki_sync.ankiaddon`

2. **Install in Anki**:
   - Open Anki Desktop
   - Go to Tools → Add-ons
   - Click "Install from file..."
   - Select the `chatgpt_anki_sync.ankiaddon` file
   - Click "OK" to install
   - Restart Anki

3. **Configure the addon**:
   - Go to Tools → Add-ons
   - Find "ChatGPT Anki Sync" in the list
   - Click "Config" to configure settings
   - OR use Tools → ChatGPT Sync → Settings

## Usage

1. Make sure Anki is running
2. In the Chrome extension, use "Export for Anki Addon" button
3. The addon will automatically detect and import the flashcards
4. Sync to AnkiWeb using Anki's built-in sync (Ctrl+Y)

## Settings

- **Check interval**: How often to check for new files (default: 5 seconds)
- **Downloads folder**: Where to look for .apkg files (default: ~/Downloads)
- **After import**: What to do with processed files (keep/move/delete)
- **Processed folder**: Where to move processed files (if move is selected)
- **Show notifications**: Whether to show import notifications

## Troubleshooting

- Check Tools → ChatGPT Sync → Status for monitoring information
- Make sure the Downloads folder path is correct
- Verify that files are being created with the correct naming pattern
- Check Anki's console (Help → Debug Console) for error messages

## File Naming

The addon only processes files with this naming pattern:
`[hash]-[timestamp].apkg`

Where:
- `hash` is a 10-character verification hash
- `timestamp` is in format YYYYMMDDHHMMSS

Example: `a1b2c3d4e5-20240115103045.apkg`
""")
    
    print(f"Installation instructions created: {instructions_file}")
    print("\\nBuild complete!")

if __name__ == "__main__":
    build_addon()