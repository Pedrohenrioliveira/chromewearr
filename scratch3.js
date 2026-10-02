const fs = require('fs');
const html = fs.readFileSync('archive-lab.html', 'utf8');
const regex = /data:image\/webp;base64,([^"']+)/g;

let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  const base64Data = match[1];
  const buffer = Buffer.from(base64Data, 'base64');
  let filename = '';
  
  if (count === 0) filename = 'logo.webp';
  else if (count === 1) filename = 'hero-main.webp';
  else if (count === 2) filename = 'hero-collection.webp'; // Sanctum
  else if (count === 3) filename = 'product-0.webp';
  else if (count === 4) filename = 'product-1.webp';
  else if (count === 5) filename = 'product-2.webp';
  else if (count === 6) filename = 'product-3.webp';
  
  if (filename) {
    fs.writeFileSync(`public/images/${filename}`, buffer);
    console.log(`Saved ${filename} (size: ${buffer.length})`);
  }
  count++;
}
