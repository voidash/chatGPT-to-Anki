"""
ChatGPT Anki Sync - Ultra Minimal Version
This is the absolute safest version possible
"""

def init_addon():
    """Initialize the addon safely"""
    try:
        from aqt.utils import showInfo
        showInfo("ChatGPT Anki Sync loaded successfully (minimal mode)")
        return True
    except:
        return False

# Only run if this specific file is imported
if __name__ != "__main__":
    try:
        success = init_addon()
        if success:
            print("ChatGPT Anki Sync: Minimal initialization successful")
        else:
            print("ChatGPT Anki Sync: Minimal initialization failed")
    except Exception as e:
        print(f"ChatGPT Anki Sync: Error during minimal init: {e}")