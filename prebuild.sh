#!/bin/bash
# Pre-build script to run before deployment

echo "Running prebuild script to prepare client build..."

# Install dependencies in client directory
cd client || exit 1
npm install --legacy-peer-deps

# Ensure react-scripts is installed
if [ ! -d "node_modules/react-scripts" ]; then
  echo "Installing react-scripts explicitly..."
  npm install react-scripts --save
fi

# Build the client application
export NODE_ENV=production
export CI=false
NODE_OPTIONS="--max-old-space-size=2048" node ./node_modules/react-scripts/bin/react-scripts.js build

# Check if build was successful
if [ ! -d "build" ]; then
  echo "Build failed - build directory not found"
  exit 1
fi

echo "Prebuild completed successfully!"
cd ..
