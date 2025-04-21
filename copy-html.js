const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy index.html from public to dist
const sourceFile = path.resolve(__dirname, 'public', 'index.html');
const destFile = path.resolve(__dirname, 'dist', 'index.html');

fs.copyFile(sourceFile, destFile, (err) => {
  if (err) {
    console.error('Error copying index.html:', err);
    process.exit(1);
  }
  console.log('index.html copied to dist directory');
}); 