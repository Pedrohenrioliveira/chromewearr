const fs = require('fs');
const html = fs.readFileSync('archive-lab.html', 'utf8');
const regex = /data:image\/webp;base64,([^"']+)/g;

let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  const base64Data = match[1];
  const buffer = Buffer.from(base64Data, 'base64');
  let filename = '';
  if (count === 0) filename = 'hero-main.webp';
  else if (count === 1) filename = 'hero-sanctum.webp';
  else if (count === 2) filename = 'hero-third.webp';
  
  if (filename) {
    fs.writeFileSync(`public/images/${filename}`, buffer);
    console.log(`Saved ${filename} (size: ${buffer.length})`);
  }
  count++;
}
