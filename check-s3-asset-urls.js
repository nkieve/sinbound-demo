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
const s3Set = new Set(s3Files.map(f => f.toLowerCase()));

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
let missing = [];
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const urls = findS3Urls(content);
  urls.forEach(assetPath => {
    if (!s3Set.has(assetPath.toLowerCase())) {
      missing.push({ file, assetPath });
    }
  });
});

if (missing.length === 0) {
  console.log('All S3 asset URLs in code match files in your S3 bucket!');
} else {
  console.log('The following S3 asset URLs do NOT match any file in your S3 bucket (case-sensitive check):');
  missing.forEach(({ file, assetPath }) => {
    console.log(`  In ${file}: ${S3_PREFIX}${assetPath}`);
  });
  console.log('\nCheck for typos, case mismatches, or missing files in S3.');
} 