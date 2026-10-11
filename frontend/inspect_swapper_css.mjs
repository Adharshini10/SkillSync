import fs from 'fs';

const css = fs.readFileSync('src/index.css', 'utf-8');

// Find all CSS rules containing swapper, matcher, preview, skill-card, or modal
const regex = /([^{}]+)\{([^{}]+)\}/g;
let match;
const results = [];

while ((match = regex.exec(css)) !== null) {
  const selector = match[1].trim();
  const body = match[2].trim();
  
  if (/swapper|matcher|preview|match-card|student-card|learning-skill|modal|connection|chat/i.test(selector)) {
    if (/background/i.test(body)) {
      results.push({ selector, body });
    }
  }
}

console.log(`Found ${results.length} relevant rules with background:`);
results.forEach(r => {
  const bgLines = r.body.split(';').filter(l => /background/i.test(l)).map(l => l.trim()).join('; ');
  console.log(`${r.selector} => ${bgLines}`);
});
