#!/bin/bash

# Build-Skript für AI Tag Manager Thunderbird Extension

echo "🔨 Building AI Tag Manager Extension..."

# Erstelle Build-Verzeichnis
BUILD_DIR="build"
rm -rf $BUILD_DIR
mkdir -p $BUILD_DIR

# Dateien, die inkludiert werden sollen
FILES=(
  "manifest.json"
  "scripts/background.js"
  "scripts/aiIntegration.js"
  "popup/popup.html"
  "popup/popup.js"
  "options/options.html"
  "options/options.js"
  "results/results.html"
  "results/results.js"
  "icons/"
  "README.md"
)

echo "📦 Copying files..."

# Kopiere Dateien
for file in "${FILES[@]}"; do
  if [ -d "$file" ]; then
    mkdir -p "$BUILD_DIR/$file"
    cp -r "$file"* "$BUILD_DIR/$file"
  else
    mkdir -p "$BUILD_DIR/$(dirname $file)"
    cp "$file" "$BUILD_DIR/$file"
  fi
done

# Erstelle XPI (ZIP mit .xpi Endung)
VERSION=$(grep '"version"' manifest.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
XPI_NAME="ai-tag-manager-v${VERSION}.xpi"

echo "📦 Creating XPI package: $XPI_NAME"

cd $BUILD_DIR
zip -r ../$XPI_NAME * -x "*.DS_Store" -x "*~"
cd ..

echo "✅ Build complete!"
echo "📦 Package: $XPI_NAME"
echo ""
echo "To install in Thunderbird:"
echo "  1. Open Thunderbird"
echo "  2. Go to Add-ons & Themes (Ctrl+Shift+A)"
echo "  3. Click the gear icon ⚙️"
echo "  4. Select 'Install Add-on From File...'"
echo "  5. Choose $XPI_NAME"
echo ""
echo "For development:"
echo "  1. Open about:debugging in Thunderbird"
echo "  2. Click 'This Thunderbird'"
echo "  3. Click 'Load Temporary Add-on...'"
echo "  4. Select manifest.json from the project root"
