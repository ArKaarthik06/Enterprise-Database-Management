const fs = require('fs');
const code = fs.readFileSync('src/components/ManagerDashboard.jsx', 'utf8');
const lines = code.split('\n');
const stack = [];
for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  const openMatches = [...line.matchAll(/<div[^>]*?(?<!\/)>/g)];
  for(const m of openMatches) stack.push(i+1);
  const closeMatches = [...line.matchAll(/<\/div>/g)];
  for(const m of closeMatches) stack.pop();
}
console.log("Unclosed divs opened on lines:", stack);
