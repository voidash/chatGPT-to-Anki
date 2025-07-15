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
        
        def show_current_settings():
            """Display current settings"""
            settings_info = f"""Current ChatGPT Sync Settings:

Check Interval: {current_settings['check_interval']} seconds
Downloads Folder: {current_settings['downloads_folder']}
Processed Action: {current_settings['processed_action']}
Show Notifications: {current_settings['show_notifications']}
Processed Folder: {current_settings['processed_folder']}

Configuration complete! Settings have been updated."""
            showInfo(settings_info)
        
        # Simple menu-based configuration
        def config_check_interval():
            """Configure check interval"""
            current_interval = current_settings['check_interval']
            
            # Show options
            options = [1, 2, 3, 5, 10, 15, 30, 60]
            if current_interval not in options:
                options.append(current_interval)
            options.sort()
            
            message = f"Current check interval: {current_interval} seconds\n\nSelect a new interval:\n"
            for i, interval in enumerate(options, 1):
                marker = " (current)" if interval == current_interval else ""
                message += f"{i}. {interval} seconds{marker}\n"
            
            showInfo(message)
            
            # For now, just set to 5 seconds as a safe default
            config.set("check_interval", 5)
            current_settings['check_interval'] = 5
            showInfo("Check interval set to 5 seconds")
        
        def config_processed_action():
            """Configure processed action"""
            current_action = current_settings['processed_action']
            
            message = f"""Current processed action: {current_action}

Available actions:
• keep - Keep files in Downloads folder
• move - Move files to processed folder  
• delete - Delete files after import

For now, using 'move' as the safe default."""
            
            showInfo(message)
            
            # Set to move as safe default
            config.set("processed_action", "move")
            current_settings['processed_action'] = "move"
            showInfo("Processed action set to 'move'")
        
        def config_notifications():
            """Configure notifications"""
            current_notif = current_settings['show_notifications']
            
            message = f"""Current notifications setting: {current_notif}

Notifications will be {'enabled' if not current_notif else 'disabled'}."""
            
            showInfo(message)
            
            # Toggle notifications
            config.set("show_notifications", not current_notif)
            current_settings['show_notifications'] = not current_notif
            status = "enabled" if not current_notif else "disabled"
            showInfo(f"Notifications {status}")
        
        def reset_config():
            """Reset to defaults"""
            config.reset()
            current_settings.update(config.get_all())
            showInfo("Settings reset to defaults")
        
        # Main configuration flow
        showInfo("""ChatGPT Sync Configuration

This will guide you through the basic settings.
You can also use Tools → Add-ons → Config for advanced options.""")
        
        # Show current settings first
        show_current_settings()
        
        # Quick configuration options
        try:
            # Configure check interval
            config_check_interval()
            
            # Configure processed action
            config_processed_action()
            
            # Configure notifications
            config_notifications()
            
            # Final settings display
            show_current_settings()
            
        except Exception as e:
            showCritical(f"Configuration error: {e}")
            
    except Exception as e:
        import traceback
        error_msg = f"Error in text configuration: {e}\n\nTraceback:\n{traceback.format_exc()}"
        showCritical(error_msg)
        print(error_msg)

if __name__ == "__main__":
    show_text_config()