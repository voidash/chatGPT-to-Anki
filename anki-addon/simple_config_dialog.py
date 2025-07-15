"""
Simple configuration dialog that avoids Qt version issues
"""

from aqt.utils import showInfo, showCritical
from pathlib import Path
import sys

def show_simple_config_dialog():
    """Show simple configuration using Anki's built-in dialogs"""
    try:
        from .config import Config
        config = Config()
        
        # Import getText with error handling
        try:
            from aqt.utils import getText
        except ImportError:
            showCritical("getText not available. Please use Tools → Add-ons → Config instead.")
            return
        
        # Show current settings
        current_settings = config.get_all()
        settings_text = f"""Current Settings:

• Check Interval: {current_settings['check_interval']} seconds
• Downloads Folder: {current_settings['downloads_folder']}
• Processed Action: {current_settings['processed_action']}
• Show Notifications: {current_settings['show_notifications']}
• Processed Folder: {current_settings['processed_folder']}

What would you like to change?
1. Check interval
2. Processed action  
3. Show notifications
4. Downloads folder
5. Reset to defaults
6. Done
"""
        
        while True:
            try:
                # Use getText with explicit parameters to avoid Qt version issues
                choice, ok = getText(
                    prompt="ChatGPT Sync Settings",
                    default="",
                    title="ChatGPT Sync Settings",
                    help=settings_text
                )
            except TypeError:
                # Fallback for different getText signatures
                try:
                    choice, ok = getText("ChatGPT Sync Settings", settings_text)
                except:
                    showCritical("Configuration dialog not compatible with this Anki version. Please use Tools → Add-ons → Config instead.")
                    return
            
            if not ok:
                break
                
            choice = choice.strip()
            
            if choice == "1":
                # Check interval
                current_interval = current_settings['check_interval']
                try:
                    new_interval, ok = getText(
                        prompt="Check Interval",
                        default=str(current_interval),
                        title="Check Interval",
                        help=f"Enter check interval (1-60 seconds):\nCurrent: {current_interval}"
                    )
                except TypeError:
                    new_interval, ok = getText(
                        "Check Interval", 
                        f"Enter check interval (1-60 seconds):\nCurrent: {current_interval}"
                    )
                
                if ok:
                    try:
                        interval = int(new_interval)
                        if 1 <= interval <= 60:
                            config.set("check_interval", interval)
                            showInfo(f"Check interval set to {interval} seconds")
                            current_settings['check_interval'] = interval
                        else:
                            showCritical("Interval must be between 1 and 60 seconds")
                    except ValueError:
                        showCritical("Please enter a valid number")
            
            elif choice == "2":
                # Processed action
                current_action = current_settings['processed_action']
                try:
                    new_action, ok = getText(
                        prompt="Processed Action",
                        default=current_action,
                        title="Processed Action",
                        help=f"Enter processed action:\nCurrent: {current_action}\n\nOptions:\n• keep - Keep files in Downloads\n• move - Move to processed folder\n• delete - Delete after import"
                    )
                except TypeError:
                    new_action, ok = getText(
                        "Processed Action", 
                        f"Enter processed action:\nCurrent: {current_action}\n\nOptions:\n• keep - Keep files in Downloads\n• move - Move to processed folder\n• delete - Delete after import"
                    )
                
                if ok and new_action.strip() in ["keep", "move", "delete"]:
                    config.set("processed_action", new_action.strip())
                    showInfo(f"Processed action set to: {new_action.strip()}")
                    current_settings['processed_action'] = new_action.strip()
                elif ok:
                    showCritical("Please enter: keep, move, or delete")
            
            elif choice == "3":
                # Show notifications
                current_notif = current_settings['show_notifications']
                try:
                    new_notif, ok = getText(
                        prompt="Notifications",
                        default=str(current_notif).lower(),
                        title="Notifications",
                        help=f"Show notifications? (true/false)\nCurrent: {current_notif}"
                    )
                except TypeError:
                    new_notif, ok = getText(
                        "Notifications", 
                        f"Show notifications? (true/false)\nCurrent: {current_notif}"
                    )
                
                if ok:
                    if new_notif.lower() in ["true", "yes", "1", "on"]:
                        config.set("show_notifications", True)
                        showInfo("Notifications enabled")
                        current_settings['show_notifications'] = True
                    elif new_notif.lower() in ["false", "no", "0", "off"]:
                        config.set("show_notifications", False)
                        showInfo("Notifications disabled")
                        current_settings['show_notifications'] = False
                    else:
                        showCritical("Please enter: true or false")
            
            elif choice == "4":
                # Downloads folder
                current_folder = current_settings['downloads_folder']
                try:
                    new_folder, ok = getText(
                        prompt="Downloads Folder",
                        default=current_folder,
                        title="Downloads Folder",
                        help=f"Enter Downloads folder path:\nCurrent: {current_folder}"
                    )
                except TypeError:
                    new_folder, ok = getText(
                        "Downloads Folder", 
                        f"Enter Downloads folder path:\nCurrent: {current_folder}"
                    )
                
                if ok:
                    if Path(new_folder).exists():
                        config.set("downloads_folder", new_folder)
                        showInfo(f"Downloads folder set to: {new_folder}")
                        current_settings['downloads_folder'] = new_folder
                    else:
                        showCritical("Folder does not exist")
            
            elif choice == "5":
                # Reset to defaults
                config.reset()
                showInfo("Settings reset to defaults")
                current_settings = config.get_all()
            
            elif choice == "6":
                # Done
                break
            
            else:
                showCritical("Please enter a number 1-6")
            
            # Update settings display
            settings_text = f"""Current Settings:

• Check Interval: {current_settings['check_interval']} seconds
• Downloads Folder: {current_settings['downloads_folder']}
• Processed Action: {current_settings['processed_action']}
• Show Notifications: {current_settings['show_notifications']}
• Processed Folder: {current_settings['processed_folder']}

What would you like to change?
1. Check interval
2. Processed action  
3. Show notifications
4. Downloads folder
5. Reset to defaults
6. Done
"""
        
        showInfo("Configuration complete!")
        
    except Exception as e:
        import traceback
        error_msg = f"Error in configuration: {e}\n\nTraceback:\n{traceback.format_exc()}"
        showCritical(error_msg)
        print(error_msg)

if __name__ == "__main__":
    show_simple_config_dialog()