"""
File monitoring and sync logic for ChatGPT Anki Sync addon
"""

import hashlib
import os
import shutil
import threading
import time
from datetime import datetime
from pathlib import Path

from aqt import mw
from aqt.utils import showInfo, showCritical
from anki.importing import AnkiPackageImporter

class ChatGPTSyncMonitor:
    """Monitors Downloads folder for signed .apkg files"""
    
    def __init__(self, config):
        self.config = config
        self.running = False
        self.thread = None
        self.processed_files = set()
        self.last_check = "Never"
        self.processed_count = 0
        self.last_processed_timestamp = None
        
        # Ensure processed folder exists if needed
        if self.config.processed_action == "move":
            self.config.processed_folder.mkdir(exist_ok=True)
    
    def start(self):
        """Start monitoring"""
        if self.running:
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        
        if self.config.show_notifications:
            showInfo("ChatGPT Anki Sync started monitoring Downloads folder")
    
    def stop(self):
        """Stop monitoring"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        while self.running:
            try:
                self._check_for_new_files()
                self.last_check = datetime.now().strftime("%H:%M:%S")
            except Exception as e:
                print(f"Error in monitor loop: {e}")
            
            time.sleep(self.config.check_interval)
    
    def _check_for_new_files(self):
        """Check for new signed .apkg files"""
        downloads_folder = self.config.downloads_folder
        
        if not downloads_folder.exists():
            return
        
        # Find all .apkg files
        apkg_files = list(downloads_folder.glob("*.apkg"))
        
        # Filter for signed files and get the latest one
        signed_files = []
        for file_path in apkg_files:
            if self._is_valid_signed_file(file_path):
                timestamp = self._extract_timestamp(file_path.name)
                if timestamp:
                    signed_files.append((file_path, timestamp))
        
        if not signed_files:
            return
        
        # Sort by timestamp (newest first)
        signed_files.sort(key=lambda x: x[1], reverse=True)
        latest_file, latest_timestamp = signed_files[0]
        
        # Only process if this is newer than the last processed file
        if (latest_file.name not in self.processed_files and 
            (self.last_processed_timestamp is None or latest_timestamp > self.last_processed_timestamp)):
            
            self._process_file(latest_file, latest_timestamp)
    
    def _is_valid_signed_file(self, file_path):
        """Check if file has valid signature"""
        filename = file_path.name
        
        if not filename.endswith('.apkg'):
            return False
        
        # Parse filename: hash-timestamp.apkg
        name_without_ext = filename[:-5]  # Remove .apkg
        parts = name_without_ext.split('-')
        
        if len(parts) != 2:
            return False
        
        file_hash, timestamp = parts
        
        # Verify hash
        expected_hash = self._calculate_hash(timestamp)
        return file_hash == expected_hash
    
    def _calculate_hash(self, timestamp):
        """Calculate hash for timestamp"""
        payload = self.config.secret_key + timestamp
        
        # Use the same simple hash function as the extension
        hash_value = 0
        for char in payload:
            hash_value = ((hash_value << 5) - hash_value) + ord(char)
            hash_value = hash_value & 0xFFFFFFFF  # Convert to 32-bit integer
        
        return format(abs(hash_value), 'x')[:10].zfill(10)
    
    def _extract_timestamp(self, filename):
        """Extract timestamp from filename"""
        if not filename.endswith('.apkg'):
            return None
        
        name_without_ext = filename[:-5]
        parts = name_without_ext.split('-')
        
        if len(parts) != 2:
            return None
        
        _, timestamp = parts
        return timestamp
    
    def _process_file(self, file_path, timestamp):
        """Process a valid signed file"""
        try:
            # Import the file
            success = self._import_anki_package(file_path)
            
            if success:
                # Mark as processed
                self.processed_files.add(file_path.name)
                self.processed_count += 1
                self.last_processed_timestamp = timestamp
                
                # Handle the file according to settings
                self._handle_processed_file(file_path)
                
                # Show notification if enabled
                if self.config.show_notifications:
                    showInfo(f"Successfully imported flashcards from {file_path.name}")
            else:
                if self.config.show_notifications:
                    showCritical(f"Failed to import {file_path.name}")
        
        except Exception as e:
            print(f"Error processing file {file_path}: {e}")
            if self.config.show_notifications:
                showCritical(f"Error processing {file_path.name}: {str(e)}")
    
    def _import_anki_package(self, file_path):
        """Import .apkg file into Anki"""
        try:
            # Use Anki's built-in importer
            importer = AnkiPackageImporter(mw.col, str(file_path))
            importer.run()
            return True
        except Exception as e:
            print(f"Import error: {e}")
            return False
    
    def _handle_processed_file(self, file_path):
        """Handle the processed file according to settings"""
        action = self.config.processed_action
        
        if action == "delete":
            try:
                file_path.unlink()
            except Exception as e:
                print(f"Error deleting file: {e}")
        
        elif action == "move":
            try:
                processed_folder = self.config.processed_folder
                processed_folder.mkdir(exist_ok=True)
                
                destination = processed_folder / file_path.name
                shutil.move(str(file_path), str(destination))
            except Exception as e:
                print(f"Error moving file: {e}")
        
        # If action is "keep", do nothing
    
    def get_stats(self):
        """Get monitoring statistics"""
        return {
            "downloads_folder": str(self.config.downloads_folder),
            "processed_count": self.processed_count,
            "last_check": self.last_check,
            "running": self.running,
            "check_interval": self.config.check_interval,
            "processed_action": self.config.processed_action,
            "show_notifications": self.config.show_notifications
        }