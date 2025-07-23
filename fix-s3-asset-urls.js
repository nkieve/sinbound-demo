const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'frontend', 'src');
const S3_LIST_FILE = path.join(__dirname, 's3_file_list.txt');
const S3_PREFIX = 'https://sinbound.online.s3.amazonaws.com/public/';
const exts = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html'];

// Read S3 file list
const s3Files = fs.readFileSync(S3_LIST_FILE, 'utf8')
  .split('\n')
  .map(line => line.trim().split(/\s+/).pop())
  .filter(f => f && !f.endsWith('/'));
const s3Set = new Set(s3Files);
const s3LowerMap = new Map(s3Files.map(f => [f.toLowerCase(), f]));

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

// Find all S3 asset URLs in a file
function findS3Urls(content) {
  const regex = /https:\/\/sinbound\.online\.s3\.amazonaws\.com\/public\/([\w\-./@%]+\.[\w]+)/gi;
  let match, urls = [];
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

// Main
const files = getFiles(SRC_DIR);
let replacements = [];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  const urls = findS3Urls(content);
  urls.forEach(assetPath => {
    if (!s3Set.has(assetPath)) {
      // Try to find a case-insensitive match
      const lower = assetPath.toLowerCase();
      if (s3LowerMap.has(lower)) {
        const correct = s3LowerMap.get(lower);
        const oldUrl = S3_PREFIX + assetPath;
        const newUrl = S3_PREFIX + correct;
        // Replace all occurrences in the file
        const regex = new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, newUrl);
        changed = true;
        replacements.push({ file, from: oldUrl, to: newUrl });
      }
    }
  });
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
  }
});

if (replacements.length === 0) {
  console.log('No replacements were necessary. All S3 asset URLs match the files in your S3 bucket.');
} else {
  console.log('The following replacements were made:');
  replacements.forEach(({ file, from, to }) => {
    console.log(`  In ${file}:`);
    console.log(`    ${from}`);
    console.log(`    => ${to}`);
  });
} 