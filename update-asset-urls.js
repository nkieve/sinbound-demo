const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'frontend', 'src');
const S3_PREFIX = 'https://sinbound.online.s3.amazonaws.com/public';

const exts = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html'];

// Recursively get all files in a directory
function getFiles(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(getFiles(fullPath));
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  });
  return files;
}

// Replace asset URLs in a file
function updateFile(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Replace "/something" or "/folder/file" with S3 URL
  content = content.replace(
    /(["'`])\/(?!\/)([^"'`?#\s]+?\.(png|jpg|jpeg|gif|svg|mp3|wav|mp4|json|glb|gltf|obj|webp|ico|txt|wav|mp3|mp4|webm|ogg|m4a|flac|aac|js|css|html))\1/gi,
    (match, quote, assetPath) => {
      return `${quote}${S3_PREFIX}/${assetPath}${quote}`;
    }
  );
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated: ${file}`);
}

// Main
const files = getFiles(SRC_DIR);
files.forEach(updateFile);

console.log('All asset URLs updated to S3!'); 