"""
Configuration management for ChatGPT Anki Sync addon
"""

import json
import os
from pathlib import Path

class Config:
    """Configuration manager"""
    
    DEFAULT_CONFIG = {
        "check_interval": 5,  # seconds
        "processed_action": "move",  # "move", "delete", "keep"
        "show_notifications": True,
        "processed_folder": "processed",
        "secret_key": "chatgpt-anki-extension-2024",
        "downloads_folder": None  # Will be set to user's Downloads folder
    }
    
    def __init__(self):
        self.addon_dir = Path(__file__).parent
        self.config_file = self.addon_dir / "config.json"
        self._config = self.DEFAULT_CONFIG.copy()
        self.load()
        
        # Set default downloads folder if not set
        if self._config["downloads_folder"] is None:
            self._config["downloads_folder"] = str(Path.home() / "Downloads")
    
    def load(self):
        """Load configuration from file"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    saved_config = json.load(f)
                    self._config.update(saved_config)
            except Exception as e:
                print(f"Error loading config: {e}")
    
    def save(self):
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(self._config, f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")
    
    def get(self, key, default=None):
        """Get configuration value"""
        return self._config.get(key, default)
    
    def set(self, key, value):
        """Set configuration value"""
        self._config[key] = value
        self.save()
    
    def get_all(self):
        """Get all configuration values"""
        return self._config.copy()
    
    def reset(self):
        """Reset configuration to defaults"""
        self._config = self.DEFAULT_CONFIG.copy()
        if self._config["downloads_folder"] is None:
            self._config["downloads_folder"] = str(Path.home() / "Downloads")
        self.save()
    
    @property
    def downloads_folder(self):
        """Get downloads folder path"""
        return Path(self._config["downloads_folder"])
    
    @property
    def processed_folder(self):
        """Get processed folder path"""
        return self.downloads_folder / self._config["processed_folder"]
    
    @property
    def check_interval(self):
        """Get check interval in seconds"""
        return self._config["check_interval"]
    
    @property
    def processed_action(self):
        """Get processed file action"""
        return self._config["processed_action"]
    
    @property
    def show_notifications(self):
        """Get show notifications setting"""
        return self._config["show_notifications"]
    
    @property
    def secret_key(self):
        """Get secret key for filename verification"""
        return self._config["secret_key"]