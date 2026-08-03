const fs = require('fs');
if (fs.existsSync('src/components/TaskForm.tsx')) {
  const content = fs.readFileSync('src/components/TaskForm.tsx', 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('fechaCulminado') || line.includes('Culminado')) {
      console.log(`${idx + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('TaskForm.tsx not found');
}
