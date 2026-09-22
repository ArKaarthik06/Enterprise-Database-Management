const fs = require('fs');
const code = fs.readFileSync('src/components/ManagerDashboard.jsx', 'utf8');
const lines = code.split('\n');
const stack = [];
for(let i=0; i<lines.length; i++) {
  const line = lines[i];
  // naive tag matcher
  const matches = [...line.matchAll(/<\/?([a-zA-Z0-9]+)[^>]*?(?<!\/)>/g)];
  for(const m of matches) {
     const tag = m[1];
     if(m[0].startsWith('</')) {
        if(stack.length > 0 && stack[stack.length-1].tag === tag) {
           stack.pop();
        } else {
           console.log("Mismatched close tag:", m[0], "on line", i+1, "expected", stack.length ? stack[stack.length-1].tag : "nothing");
        }
     } else {
        stack.push({tag, line: i+1});
     }
  }
}
console.log("Unclosed tags:", stack);
