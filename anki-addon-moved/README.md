# Anki Addon - ChatGPT Anki Sync

This folder contains the Anki addon that automatically imports flashcards created by the Chrome extension.

## Files Overview

### Core Addon Files
- `__init__.py` - Main addon initialization
- `sync_monitor.py` - Monitors Downloads folder for new .apkg files
- `config.py` - Addon configuration management
- `config_dialog.py` - Configuration dialog interface
- `debug_menu.py` - Debug tools and menu items

### Configuration Files
- `config.json` - Default addon configuration
- `config.md` - Configuration documentation
- `manifest.json` - Addon metadata

### Alternative Implementations
- `minimal_init.py` - Minimal version of the addon
- `simple_config.py` - Simplified configuration
- `simple_config_dialog.py` - Simple config dialog
- `text_config.py` - Text-based configuration

### Build System
- `build_addon.py` - Script to build the addon package
- `build/` - Built addon files

### Testing
- `test_hash.py` - Hash function testing utilities

## Installation

### Option 1: Pre-built Package
1. Run `python build_addon.py` to create the addon package
2. Open Anki Desktop
3. Go to Tools → Add-ons
4. Click "Install from file..."
5. Select the generated `.ankiaddon` file

### Option 2: Manual Installation
1. Copy all Python files to your Anki addons folder
2. Restart Anki
3. The addon will appear in Tools → Add-ons

## How It Works

1. The addon monitors your Downloads folder for .apkg files
2. When the Chrome extension creates a new flashcard package, it's automatically detected
3. The addon imports the flashcards into your Anki collection
4. You can sync to AnkiWeb as usual

## Configuration

Access addon settings through:
- Tools → Add-ons → ChatGPT Anki Sync → Config

Available settings:
- Enable/disable auto-import
- Set custom download folder path
- Configure import behavior