const fs = require('fs');
const code = fs.readFileSync('src/components/ManagerDashboard.jsx', 'utf8');
const lines = code.split('\n');
let divCount = 0;
let tabCount = 0;
for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  if(line.includes('<div') && !line.includes('/>')) divCount++;
  if(line.includes('</div')) divCount--;
  console.log(`${i+1}: ${divCount} - ${line}`);
}
