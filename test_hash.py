#!/usr/bin/env python3
"""
Test script to verify hash calculations match between extension and addon
"""

def calculate_hash_python(timestamp):
    """Python hash calculation (fixed to match JavaScript)"""
    secret_key = "chatgpt-anki-extension-2024"
    payload = secret_key + timestamp
    
    hash_value = 0
    for char in payload:
        char_code = ord(char)
        hash_value = ((hash_value << 5) - hash_value) + char_code
        hash_value = hash_value & 0xFFFFFFFF
        # Convert to signed 32-bit integer (JavaScript behavior)
        if hash_value > 0x7FFFFFFF:
            hash_value -= 0x100000000
    
    return format(abs(hash_value), 'x')[:10].zfill(10)

def calculate_hash_js_simulation(timestamp):
    """JavaScript hash calculation simulation"""
    secret_key = "chatgpt-anki-extension-2024"
    payload = secret_key + timestamp
    
    hash_value = 0
    for char in payload:
        char_code = ord(char)
        hash_value = ((hash_value << 5) - hash_value) + char_code
        # JavaScript: hash = hash & hash; (converts to 32-bit signed integer)
        hash_value = hash_value & 0xFFFFFFFF
        # Convert to signed 32-bit integer
        if hash_value > 0x7FFFFFFF:
            hash_value -= 0x100000000
    
    return format(abs(hash_value), 'x')[:10].zfill(10)

if __name__ == "__main__":
    # Test with a sample timestamp
    test_timestamp = "20240715194500"
    
    print(f"Test timestamp: {test_timestamp}")
    print(f"Python hash: {calculate_hash_python(test_timestamp)}")
    print(f"JS simulation hash: {calculate_hash_js_simulation(test_timestamp)}")
    
    # Test with current timestamp format
    from datetime import datetime
    current_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    print(f"\nCurrent timestamp: {current_timestamp}")
    print(f"Python hash: {calculate_hash_python(current_timestamp)}")
    print(f"JS simulation hash: {calculate_hash_js_simulation(current_timestamp)}")