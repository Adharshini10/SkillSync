import fs from 'fs';

const css = fs.readFileSync('src/index.css', 'utf-8');
const lines = css.split('\n');

console.log('Total CSS lines:', lines.length);

// Search for classes related to swapper, matcher, skill, connect, chat, modal
const keywords = ['swapper', 'matcher', 'skill-match', 'connect', 'chat', 'student-card', 'auth', 'login', 'register', 'learning-skill'];

const matches = [];

lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  // Check if line sets a dark background without a CSS variable or has hardcoded dark hex
  if (/background(-color)?\s*:\s*(#0|#1|#2|#3|rgb\(0|rgb\(1|rgb\(2|rgb\(3)/i.test(line)) {
    matches.push({ lineNum, line: line.trim() });
  }
});

console.log(`Found ${matches.length} lines with hardcoded dark backgrounds:`);
matches.slice(0, 50).forEach(m => console.log(`L${m.lineNum}: ${m.line}`));
