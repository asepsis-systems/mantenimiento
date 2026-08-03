const { execSync } = require('child_process');
try {
  const output = execSync('git log -p -G"getTaskDate" -- src/app/page.tsx', { encoding: 'utf8' });
  const lines = output.split('\n');
  let currentCommit = '';
  lines.forEach(line => {
    if (line.startsWith('commit ')) {
      currentCommit = line;
    }
    if (line.startsWith('+') && line.includes('getTaskDate') && !line.startsWith('+++')) {
      console.log(`${currentCommit}\n${line}`);
    }
    if (line.startsWith('-') && line.includes('getTaskDate') && !line.startsWith('---')) {
      console.log(`${currentCommit}\n${line}`);
    }
  });
} catch (err) {
  console.error(err.message);
}
