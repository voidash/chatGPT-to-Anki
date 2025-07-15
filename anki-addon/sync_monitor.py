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
            print("[DEBUG] Monitor already running")
            return
        
        print(f"[DEBUG] Starting monitor - Downloads folder: {self.config.downloads_folder}")
        print(f"[DEBUG] Check interval: {self.config.check_interval} seconds")
        print(f"[DEBUG] Show notifications: {self.config.show_notifications}")
        
        self.running = True
        self.thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.thread.start()
        
        print("[DEBUG] Monitor thread started")
        
        if self.config.show_notifications:
            showInfo("ChatGPT Anki Sync started monitoring Downloads folder")
    
    def stop(self):
        """Stop monitoring"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
    
    def _monitor_loop(self):
        """Main monitoring loop"""
        print("[DEBUG] Monitor loop started")
        while self.running:
            try:
                print(f"[DEBUG] Monitor loop iteration at {datetime.now().strftime('%H:%M:%S')}")
                self._check_for_new_files()
                self.last_check = datetime.now().strftime("%H:%M:%S")
            except Exception as e:
                print(f"Error in monitor loop: {e}")
                import traceback
                traceback.print_exc()
            
            print(f"[DEBUG] Sleeping for {self.config.check_interval} seconds")
            time.sleep(self.config.check_interval)
        
        print("[DEBUG] Monitor loop stopped")
    
    def _check_for_new_files(self):
        """Check for new signed .apkg files"""
        downloads_folder = self.config.downloads_folder
        
        print(f"[DEBUG] Checking folder: {downloads_folder}")
        
        if not downloads_folder.exists():
            print(f"[DEBUG] Downloads folder does not exist: {downloads_folder}")
            return
        
        # Find all .apkg files
        apkg_files = list(downloads_folder.glob("*.apkg"))
        print(f"[DEBUG] Found {len(apkg_files)} .apkg files: {[f.name for f in apkg_files]}")
        
        # Filter for signed files and get the latest one
        signed_files = []
        for file_path in apkg_files:
            print(f"[DEBUG] Checking file: {file_path.name}")
            if self._is_valid_signed_file(file_path):
                timestamp = self._extract_timestamp(file_path.name)
                if timestamp:
                    signed_files.append((file_path, timestamp))
                    print(f"[DEBUG] Valid signed file found: {file_path.name} with timestamp {timestamp}")
            else:
                print(f"[DEBUG] Invalid signed file: {file_path.name}")
        
        if not signed_files:
            print("[DEBUG] No valid signed files found")
            return
        
        # Sort by timestamp (newest first)
        signed_files.sort(key=lambda x: x[1], reverse=True)
        latest_file, latest_timestamp = signed_files[0]
        
        print(f"[DEBUG] Latest file: {latest_file.name} with timestamp {latest_timestamp}")
        print(f"[DEBUG] Already processed files: {self.processed_files}")
        print(f"[DEBUG] Last processed timestamp: {self.last_processed_timestamp}")
        
        # Only process if this is newer than the last processed file
        if (latest_file.name not in self.processed_files and 
            (self.last_processed_timestamp is None or latest_timestamp > self.last_processed_timestamp)):
            
            print(f"[DEBUG] Processing file: {latest_file.name}")
            self._process_file(latest_file, latest_timestamp)
        else:
            print(f"[DEBUG] File already processed or not newer: {latest_file.name}")
    
    def _is_valid_signed_file(self, file_path):
        """Check if file has valid signature"""
        filename = file_path.name
        
        print(f"[DEBUG] Validating file: {filename}")
        
        if not filename.endswith('.apkg'):
            print(f"[DEBUG] Not an .apkg file: {filename}")
            return False
        
        # Parse filename: hash-timestamp.apkg
        name_without_ext = filename[:-5]  # Remove .apkg
        parts = name_without_ext.split('-')
        
        print(f"[DEBUG] Filename parts: {parts}")
        
        if len(parts) != 2:
            print(f"[DEBUG] Invalid filename format (expected hash-timestamp): {filename}")
            return False
        
        file_hash, timestamp = parts
        
        # Verify hash
        expected_hash = self._calculate_hash(timestamp)
        print(f"[DEBUG] File hash: {file_hash}")
        print(f"[DEBUG] Expected hash: {expected_hash}")
        print(f"[DEBUG] Timestamp: {timestamp}")
        print(f"[DEBUG] Secret key: {self.config.secret_key}")
        print(f"[DEBUG] Hash match: {file_hash == expected_hash}")
        
        return file_hash == expected_hash
    
    def _calculate_hash(self, timestamp):
        """Calculate hash for timestamp - matches JavaScript implementation"""
        payload = self.config.secret_key + timestamp
        
        print(f"[DEBUG] Hash calculation - payload: {payload}")
        
        # Use the same simple hash function as the extension (JavaScript version)
        hash_value = 0
        for char in payload:
            char_code = ord(char)
            hash_value = ((hash_value << 5) - hash_value) + char_code
            hash_value = hash_value & 0xFFFFFFFF
            # Convert to signed 32-bit integer (JavaScript behavior)
            if hash_value > 0x7FFFFFFF:
                hash_value -= 0x100000000
        
        abs_hash = abs(hash_value)
        hex_hash = format(abs_hash, 'x')
        final_hash = hex_hash[:10].zfill(10)
        
        print(f"[DEBUG] Hash calculation - final hash_value: {hash_value}")
        print(f"[DEBUG] Hash calculation - abs_hash: {abs_hash}")
        print(f"[DEBUG] Hash calculation - hex_hash: {hex_hash}")
        print(f"[DEBUG] Hash calculation - final_hash: {final_hash}")
        
        return final_hash
    
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