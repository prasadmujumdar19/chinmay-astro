#!/bin/bash

# Script to create test image fixtures for E2E tests
#
# Creates:
# - test-image.jpg (500x500)
# - large-image-2000x2000.jpg (2000x2000 for compression tests)
# - test.txt (invalid file for file type validation)
#
# Usage: bash e2e/create-test-fixtures.sh

set -e

FIXTURES_DIR="$(cd "$(dirname "$0")" && pwd)/fixtures"

echo "🚀 Creating test fixtures for E2E tests..."
echo "============================================================"

# Create fixtures directory if it doesn't exist
mkdir -p "$FIXTURES_DIR"

# Download small test image (500x500)
echo "📥 Downloading test-image.jpg (500x500)..."
curl -s -L -o "$FIXTURES_DIR/test-image.jpg" "https://picsum.photos/500/500.jpg"
echo "  ✅ Created: test-image.jpg"

# Download large test image (2000x2000)
echo "📥 Downloading large-image-2000x2000.jpg (2000x2000)..."
curl -s -L -o "$FIXTURES_DIR/large-image-2000x2000.jpg" "https://picsum.photos/2000/2000.jpg"
echo "  ✅ Created: large-image-2000x2000.jpg"

# Create text file for invalid file type tests
echo "📝 Creating test.txt..."
echo "This is not an image file. Used for testing file type validation." > "$FIXTURES_DIR/test.txt"
echo "  ✅ Created: test.txt"

echo "============================================================"
echo ""
echo "✅ All fixtures created successfully!"
echo "📁 Location: $FIXTURES_DIR"
echo ""
echo "📝 Files created:"
ls -lh "$FIXTURES_DIR"
echo ""
echo "📝 Next Steps:"
echo "   1. Continue with E2E setup in E2E_SETUP.md"
echo "   2. Update Playwright config with auth setup"
