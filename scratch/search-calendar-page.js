const fs = require('fs');
const content = fs.readFileSync('src/app/page.tsx', 'utf8');
const lines = content.split('\n');
const keywords = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DatePicker', 'daysInMonth', 'calendar', 'calendario', 'picker'];
lines.forEach((line, idx) => {
  keywords.forEach(kw => {
    if (line.includes(kw)) {
      console.log(`${idx + 1}: [${kw}] ${line.trim()}`);
    }
  });
});
