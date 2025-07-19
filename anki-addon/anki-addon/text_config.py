"""
Text-based configuration system that works with any Anki version
"""

from aqt.utils import showInfo, showCritical
from pathlib import Path

def show_text_config():
    """Show configuration using only text-based dialogs"""
    try:
        from .config import Config
        config = Config()
        
        # Show current settings
        current_settings = config.get_all()
        
        # Display current settings in a nice format
        settings_info = f"""Current ChatGPT Sync Settings:

📁 Downloads Folder: {current_settings['downloads_folder']}
⏰ Check Interval: {current_settings['check_interval']} seconds
📂 Processed Action: {current_settings['processed_action']}
🔔 Show Notifications: {current_settings['show_notifications']}
📁 Processed Folder: {current_settings['processed_folder']}

The addon is monitoring your Downloads folder for signed .apkg files from the ChatGPT extension.

Configuration Info:
• Files with signed names (hash-timestamp.apkg) will be imported
• Check interval determines how often to scan for new files
• Processed action controls what happens to files after import
• Notifications show when files are imported

For detailed configuration options, use:
Tools → Add-ons → Config → ChatGPT Sync

The addon should work with these current settings!"""
        
        showInfo(settings_info)
        
        # Show quick toggle options
        toggle_info = f"""Quick Settings:

Current notification setting: {'ON' if current_settings['show_notifications'] else 'OFF'}

You can quickly toggle notifications from the ChatGPT Sync menu.
Other settings can be changed via Tools → Add-ons → Config.

The addon is ready to use with your current settings!"""
        
        showInfo(toggle_info)
        
    except Exception as e:
        import traceback
        error_msg = f"Error in text configuration: {e}\n\nTraceback:\n{traceback.format_exc()}"
        showCritical(error_msg)
        print(error_msg)

if __name__ == "__main__":
    show_text_config()