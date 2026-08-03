const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\willi\\.gemini\\antigravity\\brain\\f82a6d96-b2e9-4902-8d07-dddcc76dc32a\\.system_generated\\logs\\transcript.jsonl';
if (fs.existsSync(logPath)) {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.match(/git|pm2|vercel|ssh|deploy|subir|push|pull|servidor/i)) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'USER_INPUT' || parsed.type === 'PLANNER_RESPONSE') {
          console.log(`Step ${parsed.step_index} (${parsed.type}):`);
          const text = parsed.content || '';
          const trimmed = text.length > 300 ? text.substring(0, 300) + '...' : text;
          console.log(trimmed);
          console.log('-'.repeat(40));
        }
      } catch (e) {
        // ignore
      }
    }
  });
} else {
  console.log('Log file not found');
}
