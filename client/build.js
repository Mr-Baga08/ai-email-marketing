#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting custom build script for React app...');

// Check if node_modules/react-scripts exists
if (!fs.existsSync(path.join(__dirname, 'node_modules', 'react-scripts'))) {
  console.log('Installing react-scripts...');
  execSync('npm install react-scripts --save --legacy-peer-deps', { stdio: 'inherit' });
}

// Check if react-scripts/bin/react-scripts.js exists
const reactScriptsPath = path.join(__dirname, 'node_modules', 'react-scripts', 'bin', 'react-scripts.js');
if (!fs.existsSync(reactScriptsPath)) {
  console.error('Error: react-scripts.js not found at expected path');
  process.exit(1);
}

// Run the build command
console.log('Building the React application...');
try {
  // Use node to execute react-scripts directly
  execSync('node ./node_modules/react-scripts/bin/react-scripts.js build', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', CI: 'false' }
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}
