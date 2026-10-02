const fs = require('fs');
const html = fs.readFileSync('archive-lab.html', 'utf8');
const regex = /data:image\/webp;base64,([^"']+)/g;

let match;
let count = 0;
while ((match = regex.exec(html)) !== null) {
  console.log(`Match ${count}: index ${match.index}, length ${match[1].length}`);
  count++;
}
