"""
Debug script to help troubleshoot menu issues
Run this in Anki's Debug Console (Help → Debug Console)
"""

def debug_menu():
    """Debug menu issues"""
    try:
        from aqt import mw
        from aqt.utils import showInfo
        
        # Check if main window exists
        if not mw:
            print("Main window not found")
            return
        
        print("Main window found")
        
        # Check menubar
        menubar = mw.menuBar()
        if not menubar:
            print("Menu bar not found")
            return
        
        print("Menu bar found")
        
        # Find all menus
        menus = []
        for action in menubar.actions():
            if action.menu():
                menus.append(action.text())
        
        print(f"Available menus: {menus}")
        
        # Check if ChatGPT Sync menu exists
        if hasattr(mw, 'chatgpt_sync_menu'):
            print("ChatGPT Sync menu attribute found")
            menu = mw.chatgpt_sync_menu
            if menu:
                actions = [action.text() for action in menu.actions()]
                print(f"ChatGPT Sync menu actions: {actions}")
            else:
                print("ChatGPT Sync menu is None")
        else:
            print("ChatGPT Sync menu attribute not found")
        
        # Try to find Tools menu
        tools_menu = None
        for action in menubar.actions():
            if "Tools" in action.text():
                tools_menu = action.menu()
                break
        
        if tools_menu:
            print("Tools menu found")
            
            # Check for ChatGPT Sync submenu
            chatgpt_found = False
            for action in tools_menu.actions():
                if action.menu() and "ChatGPT" in action.text():
                    chatgpt_found = True
                    submenu = action.menu()
                    sub_actions = [a.text() for a in submenu.actions()]
                    print(f"Found ChatGPT Sync submenu with actions: {sub_actions}")
                    break
            
            if not chatgpt_found:
                print("ChatGPT Sync submenu not found in Tools menu")
                
                # Show all Tools menu items
                tools_actions = []
                for action in tools_menu.actions():
                    if action.isSeparator():
                        tools_actions.append("---")
                    else:
                        tools_actions.append(action.text())
                
                print(f"Tools menu contents: {tools_actions}")
        else:
            print("Tools menu not found")
        
        # Try to manually create menu
        print("Attempting to create menu manually...")
        try:
            # Find Tools menu again
            for action in menubar.actions():
                if "Tools" in action.text():
                    tools_menu = action.menu()
                    
                    # Add test menu item
                    from aqt.qt import QAction
                    test_action = QAction("ChatGPT Test", mw)
                    test_action.triggered.connect(lambda: showInfo("Test menu item clicked!"))
                    tools_menu.addAction(test_action)
                    
                    print("Test menu item added successfully")
                    break
        except Exception as e:
            print(f"Error creating test menu: {e}")
    
    except Exception as e:
        print(f"Debug error: {e}")
        import traceback
        traceback.print_exc()

# Run the debug
debug_menu()