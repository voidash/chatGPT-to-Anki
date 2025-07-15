"""
Simple configuration interface for ChatGPT Anki Sync addon
Use this if the GUI config dialog isn't working
"""

from pathlib import Path
from .config import Config

def show_simple_config():
    """Show simple configuration using text dialogs"""
    try:
        from aqt.utils import getText, showInfo, showCritical
        
        config = Config()
        
        # Get current settings
        current_settings = config.get_all()
        
        # Show current settings
        settings_text = f"""Current Settings:
        
Check Interval: {current_settings['check_interval']} seconds
Downloads Folder: {current_settings['downloads_folder']}
Processed Action: {current_settings['processed_action']}
Show Notifications: {current_settings['show_notifications']}
Processed Folder: {current_settings['processed_folder']}
        """
        
        showInfo(settings_text)
        
        # Ask if user wants to change settings
        change_settings = True
        
        while change_settings:
            options = """What would you like to change?
            
1. Check interval (currently: {})
2. Processed action (currently: {})
3. Show notifications (currently: {})
4. Downloads folder (currently: {})
5. Done
            """.format(
                current_settings['check_interval'],
                current_settings['processed_action'],
                current_settings['show_notifications'],
                current_settings['downloads_folder']
            )
            
            choice, ok = getText("Configuration", options)
            
            if not ok or choice == "5":
                change_settings = False
                continue
            
            if choice == "1":
                # Check interval
                new_interval, ok = getText("Check Interval", "Enter check interval (1-60 seconds):")
                if ok:
                    try:
                        interval = int(new_interval)
                        if 1 <= interval <= 60:
                            config.set("check_interval", interval)
                            showInfo(f"Check interval set to {interval} seconds")
                        else:
                            showCritical("Interval must be between 1 and 60 seconds")
                    except ValueError:
                        showCritical("Please enter a valid number")
            
            elif choice == "2":
                # Processed action
                action_text = """Enter processed action:
                
1. keep - Keep files in Downloads
2. move - Move to processed folder
3. delete - Delete after import
                """
                new_action, ok = getText("Processed Action", action_text)
                if ok and new_action in ["keep", "move", "delete"]:
                    config.set("processed_action", new_action)
                    showInfo(f"Processed action set to: {new_action}")
                elif ok:
                    showCritical("Please enter: keep, move, or delete")
            
            elif choice == "3":
                # Show notifications
                notif_text = "Show notifications? (true/false):"
                new_notif, ok = getText("Notifications", notif_text)
                if ok:
                    if new_notif.lower() in ["true", "yes", "1"]:
                        config.set("show_notifications", True)
                        showInfo("Notifications enabled")
                    elif new_notif.lower() in ["false", "no", "0"]:
                        config.set("show_notifications", False)
                        showInfo("Notifications disabled")
                    else:
                        showCritical("Please enter: true or false")
            
            elif choice == "4":
                # Downloads folder
                folder_text = f"Enter Downloads folder path (current: {current_settings['downloads_folder']}):"
                new_folder, ok = getText("Downloads Folder", folder_text)
                if ok:
                    if Path(new_folder).exists():
                        config.set("downloads_folder", new_folder)
                        showInfo(f"Downloads folder set to: {new_folder}")
                    else:
                        showCritical("Folder does not exist")
            
            # Refresh current settings
            current_settings = config.get_all()
        
        showInfo("Configuration complete! Restart monitoring to apply changes.")
        
    except Exception as e:
        from aqt.utils import showCritical
        showCritical(f"Error in simple config: {e}")

if __name__ == "__main__":
    show_simple_config()