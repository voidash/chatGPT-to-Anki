"""
Configuration dialog for ChatGPT Anki Sync addon
"""

from pathlib import Path

from aqt.qt import (
    QDialog, QVBoxLayout, QHBoxLayout, QFormLayout, QLabel, QLineEdit, 
    QSpinBox, QComboBox, QCheckBox, QPushButton, QFileDialog,
    QDialogButtonBox, QGroupBox, QMessageBox
)

class ConfigDialog(QDialog):
    """Configuration dialog for the addon"""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("ChatGPT Anki Sync Settings")
        self.setModal(True)
        self.resize(400, 300)
        
        from .config import Config
        self.config = Config()
        
        self.setup_ui()
        self.load_settings()
    
    def setup_ui(self):
        """Setup the user interface"""
        layout = QVBoxLayout()
        
        # Monitoring settings
        monitoring_group = QGroupBox("Monitoring Settings")
        monitoring_layout = QFormLayout()
        
        # Check interval
        self.check_interval_spin = QSpinBox()
        self.check_interval_spin.setRange(1, 60)
        self.check_interval_spin.setSuffix(" seconds")
        monitoring_layout.addRow("Check interval:", self.check_interval_spin)
        
        # Downloads folder
        downloads_layout = QHBoxLayout()
        self.downloads_edit = QLineEdit()
        self.downloads_browse = QPushButton("Browse...")
        self.downloads_browse.clicked.connect(self.browse_downloads_folder)
        downloads_layout.addWidget(self.downloads_edit)
        downloads_layout.addWidget(self.downloads_browse)
        monitoring_layout.addRow("Downloads folder:", downloads_layout)
        
        monitoring_group.setLayout(monitoring_layout)
        layout.addWidget(monitoring_group)
        
        # File handling settings
        file_group = QGroupBox("File Handling")
        file_layout = QFormLayout()
        
        # Processed file action
        self.processed_action_combo = QComboBox()
        self.processed_action_combo.addItem("Keep in Downloads", "keep")
        self.processed_action_combo.addItem("Move to processed folder", "move")
        self.processed_action_combo.addItem("Delete after import", "delete")
        file_layout.addRow("After import:", self.processed_action_combo)
        
        # Processed folder (only shown if move is selected)
        self.processed_folder_edit = QLineEdit()
        self.processed_folder_edit.setPlaceholderText("processed")
        file_layout.addRow("Processed folder:", self.processed_folder_edit)
        
        file_group.setLayout(file_layout)
        layout.addWidget(file_group)
        
        # Notification settings
        notification_group = QGroupBox("Notifications")
        notification_layout = QFormLayout()
        
        self.show_notifications_check = QCheckBox("Show import notifications")
        notification_layout.addRow(self.show_notifications_check)
        
        notification_group.setLayout(notification_layout)
        layout.addWidget(notification_group)
        
        # Advanced settings
        advanced_group = QGroupBox("Advanced")
        advanced_layout = QFormLayout()
        
        self.secret_key_edit = QLineEdit()
        self.secret_key_edit.setPlaceholderText("Leave blank for default")
        advanced_layout.addRow("Secret key:", self.secret_key_edit)
        
        advanced_group.setLayout(advanced_layout)
        layout.addWidget(advanced_group)
        
        # Buttons
        try:
            # Try newer Qt syntax first
            button_box = QDialogButtonBox(
                QDialogButtonBox.StandardButton.Ok | 
                QDialogButtonBox.StandardButton.Cancel | 
                QDialogButtonBox.StandardButton.RestoreDefaults
            )
        except AttributeError:
            # Fallback to older syntax
            button_box = QDialogButtonBox(
                QDialogButtonBox.Ok | QDialogButtonBox.Cancel | QDialogButtonBox.RestoreDefaults
            )
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)
        
        # Get RestoreDefaults button with fallback
        try:
            restore_button = button_box.button(QDialogButtonBox.StandardButton.RestoreDefaults)
        except AttributeError:
            restore_button = button_box.button(QDialogButtonBox.RestoreDefaults)
        
        if restore_button:
            restore_button.clicked.connect(self.restore_defaults)
        
        layout.addWidget(button_box)
        
        self.setLayout(layout)
        
        # Connect signals
        self.processed_action_combo.currentTextChanged.connect(self.on_processed_action_changed)
    
    def load_settings(self):
        """Load settings from config"""
        self.check_interval_spin.setValue(self.config.get("check_interval", 5))
        self.downloads_edit.setText(self.config.get("downloads_folder", ""))
        
        # Set processed action
        action = self.config.get("processed_action", "move")
        for i in range(self.processed_action_combo.count()):
            if self.processed_action_combo.itemData(i) == action:
                self.processed_action_combo.setCurrentIndex(i)
                break
        
        self.processed_folder_edit.setText(self.config.get("processed_folder", "processed"))
        self.show_notifications_check.setChecked(self.config.get("show_notifications", True))
        
        secret_key = self.config.get("secret_key", "")
        if secret_key != "chatgpt-anki-extension-2024":
            self.secret_key_edit.setText(secret_key)
        
        self.on_processed_action_changed()
    
    def save_settings(self):
        """Save settings to config"""
        self.config.set("check_interval", self.check_interval_spin.value())
        self.config.set("downloads_folder", self.downloads_edit.text())
        
        # Get processed action
        current_index = self.processed_action_combo.currentIndex()
        action = self.processed_action_combo.itemData(current_index) or "move"
        self.config.set("processed_action", action)
        
        self.config.set("processed_folder", self.processed_folder_edit.text())
        self.config.set("show_notifications", self.show_notifications_check.isChecked())
        
        secret_key = self.secret_key_edit.text().strip()
        if not secret_key:
            secret_key = "chatgpt-anki-extension-2024"
        self.config.set("secret_key", secret_key)
    
    def browse_downloads_folder(self):
        """Browse for downloads folder"""
        current_folder = self.downloads_edit.text()
        if not current_folder:
            current_folder = str(Path.home() / "Downloads")
        
        folder = QFileDialog.getExistingDirectory(
            self, "Select Downloads Folder", current_folder
        )
        
        if folder:
            self.downloads_edit.setText(folder)
    
    def on_processed_action_changed(self):
        """Handle processed action change"""
        current_index = self.processed_action_combo.currentIndex()
        action = self.processed_action_combo.itemData(current_index) or "move"
        
        # Show/hide processed folder setting
        self.processed_folder_edit.setEnabled(action == "move")
    
    def restore_defaults(self):
        """Restore default settings"""
        try:
            # Try newer Qt syntax
            reply = QMessageBox.question(
                self, "Restore Defaults", 
                "Are you sure you want to restore default settings?",
                QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
            )
            yes_button = QMessageBox.StandardButton.Yes
        except AttributeError:
            # Fallback to older syntax
            reply = QMessageBox.question(
                self, "Restore Defaults", 
                "Are you sure you want to restore default settings?",
                QMessageBox.Yes | QMessageBox.No
            )
            yes_button = QMessageBox.Yes
        
        if reply == yes_button:
            self.config.reset()
            self.load_settings()
    
    def accept(self):
        """Accept and save settings"""
        self.save_settings()
        super().accept()
    
    def reject(self):
        """Reject without saving"""
        super().reject()