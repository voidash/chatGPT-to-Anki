"""
ChatGPT Anki Sync - Automatic Import (Crash-Safe)
Automatically imports .apkg files from Downloads folder
"""

# Global variables
timer = None
processed_files = set()
last_check_time = 0

def safe_import():
    """Safely import .apkg files"""
    try:
        from pathlib import Path
        import time
        
        # Avoid rapid repeated imports
        global last_check_time
        current_time = time.time()
        if current_time - last_check_time < 5:  # Wait 5 seconds between checks
            return
        last_check_time = current_time
        
        downloads_folder = Path.home() / "Downloads"
        if not downloads_folder.exists():
            return
        
        # Find .apkg files with hash-timestamp pattern
        signed_files = []
        for file_path in downloads_folder.glob("*.apkg"):
            filename = file_path.name
            if filename in processed_files:
                continue
                
            # Check for hash-timestamp pattern
            if '-' in filename and filename.count('-') == 1:
                parts = filename[:-5].split('-')  # Remove .apkg
                if len(parts) == 2 and len(parts[0]) == 10:
                    signed_files.append(file_path)
        
        if not signed_files:
            return
        
        # Get the newest file
        newest_file = max(signed_files, key=lambda x: x.stat().st_mtime)
        
        # Import the file
        from anki.importing import AnkiPackageImporter
        from aqt import mw
        from aqt.utils import showInfo
        
        importer = AnkiPackageImporter(mw.col, str(newest_file))
        importer.run()
        
        # Refresh the collection and UI
        mw.col.save()
        mw.reset()  # This refreshes the main window
        
        # Mark as processed
        processed_files.add(newest_file.name)
        
        # Move to processed folder
        processed_folder = downloads_folder / "processed"
        processed_folder.mkdir(exist_ok=True)
        newest_file.rename(processed_folder / newest_file.name)
        
        # Show success notification
        showInfo(f"ChatGPT flashcards imported: {newest_file.name}\nDecks refreshed automatically!")
        
    except Exception as e:
        print(f"Import error: {e}")

def start_monitoring():
    """Start automatic monitoring"""
    global timer
    try:
        from aqt.qt import QTimer
        from aqt.utils import showInfo
        
        if timer is not None:
            return
        
        timer = QTimer()
        timer.timeout.connect(safe_import)
        timer.start(8000)  # Check every 8 seconds
        
        print("ChatGPT Anki Sync: Timer started")
        
    except Exception as e:
        print(f"Error starting monitoring: {e}")

def stop_monitoring():
    """Stop automatic monitoring"""
    global timer
    try:
        if timer is not None:
            timer.stop()
            timer = None
            print("ChatGPT Anki Sync: Timer stopped")
    except Exception as e:
        print(f"Error stopping monitoring: {e}")

def show_status():
    """Show current status"""
    try:
        from aqt.utils import showInfo
        from pathlib import Path
        
        downloads_folder = Path.home() / "Downloads"
        apkg_count = len(list(downloads_folder.glob("*.apkg")))
        
        message = f"""ChatGPT Anki Sync Status:
        
Downloads folder: {downloads_folder}
Current .apkg files: {apkg_count}
Processed files: {len(processed_files)}
Auto-import: {'Running' if timer else 'Stopped'}

Files processed: {', '.join(processed_files) if processed_files else 'None'}
        """
        showInfo(message)
        
    except Exception as e:
        print(f"Status error: {e}")

# Initialize when profile loads
def on_profile_loaded():
    """Called when Anki profile loads"""
    try:
        start_monitoring()
        
        # Add status menu
        from aqt import mw
        from aqt.qt import QAction
        
        # Find Tools menu
        tools_menu = None
        for action in mw.menuBar().actions():
            if "Tools" in action.text():
                tools_menu = action.menu()
                break
        
        if tools_menu:
            status_action = QAction("ChatGPT Sync Status", mw)
            status_action.triggered.connect(show_status)
            tools_menu.addAction(status_action)
            
    except Exception as e:
        print(f"Profile load error: {e}")

def on_profile_closing():
    """Called when profile closes"""
    try:
        stop_monitoring()
    except Exception as e:
        print(f"Profile close error: {e}")

# Register hooks with error handling
try:
    from anki.hooks import addHook
    addHook("profileLoaded", on_profile_loaded)
    addHook("unloadProfile", on_profile_closing)
    print("ChatGPT Anki Sync: Hooks registered successfully")
except Exception as e:
    print(f"Hook registration error: {e}")