#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Building client for Vercel...');

try {
  const clientPath = path.join(__dirname, 'client');

  console.log(`Client path: ${clientPath}`);
  console.log(`Current dir: ${process.cwd()}`);

  // Install dependencies
  console.log('\n1. Installing dependencies...');
  execSync('npm install', {
    cwd: clientPath,
    stdio: 'inherit',
    shell: true
  });

  // Build
  console.log('\n2. Running build...');
  execSync('npm run build', {
    cwd: clientPath,
    stdio: 'inherit',
    shell: true
  });

  // Verify output
  const distPath = path.join(clientPath, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('\n✓ Build successful!');
    const files = fs.readdirSync(distPath);
    console.log(`✓ Output directory contains: ${files.join(', ')}`);
    process.exit(0);
  } else {
    console.error('\n✗ Build failed: dist directory not found');
    process.exit(1);
  }
} catch (error) {
  console.error('\n✗ Build failed:', error.message);
  process.exit(1);
}
