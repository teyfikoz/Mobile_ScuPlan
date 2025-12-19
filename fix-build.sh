#!/bin/bash
set -e

echo "Fixing npm dependencies..."

# Remove old lock file
rm -f package-lock.json

# Remove node_modules if exists
rm -rf node_modules

# Install with legacy peer deps
npm install --legacy-peer-deps

# Run build
npm run build

echo "Build completed successfully!"
