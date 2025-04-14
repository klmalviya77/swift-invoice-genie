
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define paths
const distPath = path.join(__dirname, '../dist');
const electronDistPath = path.join(__dirname, '../electron-dist');

// Build React app
console.log('Building React app...');
execSync('npm run build', { stdio: 'inherit' });

// Create electron-dist directory if it doesn't exist
if (!fs.existsSync(electronDistPath)) {
  fs.mkdirSync(electronDistPath);
}

// Copy dist files to electron-dist
console.log('Copying files to electron-dist...');
execSync(`cp -r ${distPath}/* ${electronDistPath}/`, { stdio: 'inherit' });

// Copy electron files
console.log('Copying electron files...');
execSync(`cp -r electron ${electronDistPath}/`, { stdio: 'inherit' });

// Build electron app
console.log('Building electron app...');
execSync('node electron-builder.js', { stdio: 'inherit' });

console.log('Electron build completed successfully!');
