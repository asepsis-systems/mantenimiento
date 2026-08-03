const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\willi\\.gemini\\antigravity\\brain\\f82a6d96-b2e9-4902-8d07-dddcc76dc32a\\.system_generated\\logs\\transcript_full.jsonl';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    try {
      const parsed = JSON.parse(line);
      if (parsed.step_index === 3905 || parsed.step_index === 4190) {
        console.log(`=== STEP ${parsed.step_index} ===`);
        console.log(parsed.content);
        console.log('='.repeat(40));
      }
    } catch (e) {}
  });
} else {
  console.log('Log file not found');
}
