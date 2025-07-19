#!/bin/bash

# Firefox Extension Build Script
# This script copies and replaces Chrome-specific files with Firefox-compatible versions

echo "Building Firefox extension..."

# Create Firefox build directory if it doesn't exist
mkdir -p firefox-build

# Copy all files except Chrome-specific ones
cp -r . firefox-build/
cd firefox-build

# Remove Chrome-specific files
rm -f manifest.json
rm -f background.js
rm -f popup.js
rm -f config.js
rm -f build-firefox.sh

# Rename Firefox-specific files
mv manifest-firefox.json manifest.json
mv background-firefox.js background.js
mv popup-firefox.js popup.js
mv config-firefox.js config.js

# Remove Firefox-specific files from build
rm -f *-firefox.js
rm -f *-firefox.json

echo "Firefox extension built in firefox-build/ directory"
echo ""
echo "To test the Firefox extension:"
echo "1. Open Firefox"
echo "2. Go to about:debugging"
echo "3. Click 'This Firefox'"
echo "4. Click 'Load Temporary Add-on'"
echo "5. Select the manifest.json file from firefox-build/ directory"
echo ""
echo "Key Firefox differences:"
echo "- Uses Manifest V2 instead of V3"
echo "- Uses browser API instead of chrome API"
echo "- Uses background scripts instead of service worker"
echo "- Uses browser_action instead of action"