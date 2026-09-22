const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const parser = acorn.Parser.extend(jsx());
try {
  parser.parse(fs.readFileSync('src/components/ManagerDashboard.jsx', 'utf8'), {sourceType: 'module'});
  console.log('OK');
} catch (e) {
  console.log(e);
}
