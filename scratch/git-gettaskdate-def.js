const { execSync } = require('child_process');
try {
  const content = execSync('git show ed4c5571f5fd1e4b73df1ab8b618b51d8c5ea961:src/app/page.tsx', { encoding: 'utf8' });
  const lines = content.split('\n');
  const getTaskDateStart = lines.findIndex(l => l.includes('const getTaskDate ='));
  if (getTaskDateStart !== -1) {
    console.log(lines.slice(getTaskDateStart, getTaskDateStart + 10).join('\n'));
  } else {
    console.log('Not found');
  }
} catch (err) {
  console.error(err.message);
}
