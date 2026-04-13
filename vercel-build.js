#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

try {
  console.log('Installing client dependencies...');
  const clientDir = path.join(__dirname, 'client');

  // Change to client directory
  process.chdir(clientDir);

  // Install dependencies
  execSync('npm install', { stdio: 'inherit' });

  // Build
  console.log('Building client...');
  execSync('npm run build', { stdio: 'inherit' });

  console.log('✓ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}
