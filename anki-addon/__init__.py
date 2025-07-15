"""
ChatGPT Anki Sync Addon
Automatically imports flashcards from ChatGPT Chrome Extension
"""

import os
import sys
import threading
import time
from pathlib import Path

try:
    from aqt import mw
    from aqt.utils import showInfo, showCritical
    from anki.hooks import addHook
    from aqt.qt import QAction
    
    # Add the addon directory to the path
    addon_dir = Path(__file__).parent
    if str(addon_dir) not in sys.path:
        sys.path.insert(0, str(addon_dir))
    
    # Import with error handling
    try:
        from .sync_monitor import ChatGPTSyncMonitor
        from .config import Config
        IMPORTS_OK = True
    except ImportError as e:
        print(f"Import error: {e}")
        IMPORTS_OK = False
    
except Exception as e:
    print(f"Critical addon error: {e}")
    IMPORTS_OK = False

# Global monitor instance
monitor = None

def start_monitor():
    """Start the sync monitor"""
    global monitor
    if not IMPORTS_OK:
        showCritical("Addon imports failed. Please reinstall the addon.")
        return
    
    if monitor is None:
        try:
            config = Config()
            monitor = ChatGPTSyncMonitor(config)
            monitor.start()
        except Exception as e:
            showCritical(f"Error starting monitor: {e}")

def stop_monitor():
    """Stop the sync monitor"""
    global monitor
    if monitor is not None:
        try:
            monitor.stop()
            monitor = None
        except Exception as e:
            print(f"Error stopping monitor: {e}")

def on_profile_loaded():
    """Called when Anki profile is loaded"""
    if IMPORTS_OK:
        start_monitor()

def on_profile_will_close():
    """Called when Anki profile is about to close"""
    stop_monitor()

def on_main_window_should_close():
    """Called when main window is closing"""
    stop_monitor()

# Register hooks only if imports are OK
if IMPORTS_OK:
    try:
        addHook("profileLoaded", on_profile_loaded)
        addHook("unloadProfile", on_profile_will_close)
        addHook("mainWindowShouldClose", on_main_window_should_close)
        print("ChatGPT Anki Sync hooks registered successfully")
    except Exception as e:
        print(f"Error registering hooks: {e}")
        IMPORTS_OK = False

# Menu items
def show_config():
    """Show configuration dialog"""
    try:
        # Try text-based config first (most compatible)
        from .text_config import show_text_config
        show_text_config()
    except Exception as e:
        try:
            # Fallback to simple config dialog
            from .simple_config_dialog import show_simple_config_dialog
            show_simple_config_dialog()
        except Exception as e2:
            from aqt.utils import showCritical
            showCritical(f"Error opening config dialog: {e}\n\nFallback error: {e2}\n\nPlease use Tools → Add-ons → Config instead.")

def show_simple_config():
    """Show simple configuration using text dialogs"""
    try:
        from .simple_config import show_simple_config
        show_simple_config()
    except Exception as e:
        from aqt.utils import showCritical
        showCritical(f"Error opening simple config: {e}")

def on_config_updated():
    """Called when config is updated through Anki's config system"""
    global monitor
    if monitor:
        # Restart monitor with new config
        monitor.stop()
        from .config import Config
        config = Config()
        monitor = ChatGPTSyncMonitor(config)
        monitor.start()

def show_status():
    """Show addon status"""
    global monitor
    if monitor is None:
        showInfo("Monitor is not running")
    else:
        stats = monitor.get_stats()
        message = f"""
ChatGPT Anki Sync Status:

Monitoring: {stats['downloads_folder']}
Files processed: {stats['processed_count']}
Last check: {stats['last_check']}
Status: {'Running' if stats['running'] else 'Stopped'}

Settings:
- Check interval: {stats['check_interval']}s
- Processed file action: {stats['processed_action']}
- Show notifications: {stats['show_notifications']}
        """
        showInfo(message)

# Add menu items
from aqt import mw
from aqt.qt import QAction

def setup_menu():
    """Setup addon menu"""
    try:
        from aqt.utils import showInfo
        
        # Don't create menu if it already exists
        if hasattr(mw, 'chatgpt_sync_menu'):
            return
            
        # Find Tools menu
        tools_menu = None
        for action in mw.menuBar().actions():
            if "Tools" in action.text():
                tools_menu = action.menu()
                break
        
        if not tools_menu:
            showInfo("Could not find Tools menu")
            return
            
        # Add separator
        tools_menu.addSeparator()
        
        # Create ChatGPT Sync submenu
        chatgpt_menu = tools_menu.addMenu("ChatGPT Sync")
        
        # Add Settings action
        settings_action = QAction("Settings...", mw)
        settings_action.triggered.connect(show_config)
        chatgpt_menu.addAction(settings_action)
        
        # Add Simple Config action
        simple_config_action = QAction("Simple Config...", mw)
        simple_config_action.triggered.connect(show_simple_config)
        chatgpt_menu.addAction(simple_config_action)
        
        # Add Status action
        status_action = QAction("Status", mw)
        status_action.triggered.connect(show_status)
        chatgpt_menu.addAction(status_action)
        
        # Add separator
        chatgpt_menu.addSeparator()
        
        # Add quick actions
        start_action = QAction("Start Monitoring", mw)
        start_action.triggered.connect(lambda: start_monitor() or showInfo("Monitoring started"))
        chatgpt_menu.addAction(start_action)
        
        stop_action = QAction("Stop Monitoring", mw)
        stop_action.triggered.connect(lambda: stop_monitor() or showInfo("Monitoring stopped"))
        chatgpt_menu.addAction(stop_action)
        
        # Store reference
        mw.chatgpt_sync_menu = chatgpt_menu
        
        print("ChatGPT Sync menu created successfully")
        
    except Exception as e:
        print(f"Error setting up menu: {e}")
        from aqt.utils import showCritical
        showCritical(f"ChatGPT Sync menu setup error: {e}")

def toggle_notifications_setting():
    """Quick toggle for notifications"""
    try:
        from .config import Config
        config = Config()
        current = config.get("show_notifications", True)
        config.set("show_notifications", not current)
        
        from aqt.utils import showInfo
        status = "enabled" if not current else "disabled"
        showInfo(f"Notifications {status}")
        
        # Restart monitor if needed
        on_config_updated()
    except Exception as e:
        from aqt.utils import showCritical
        showCritical(f"Error toggling notifications: {e}")

# Setup menu when addon loads
if IMPORTS_OK:
    try:
        # Delay menu setup to ensure main window is ready
        def delayed_setup():
            try:
                setup_menu()
            except Exception as e:
                print(f"Error during delayed menu setup: {e}")
        
        # Use a timer to delay menu setup
        from aqt.qt import QTimer
        timer = QTimer()
        timer.timeout.connect(delayed_setup)
        timer.setSingleShot(True)
        timer.start(1000)  # 1 second delay
        
        print("ChatGPT Anki Sync menu setup scheduled")
    except Exception as e:
        print(f"Error scheduling menu setup: {e}")