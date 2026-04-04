const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let apiCalls = new Set();
// Handle string templates more gracefully and general api.call instances
const regex = /api\.(get|post|patch|delete|put)\([\s]*[`'"]([^`'"{}$?]+)/g;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
      apiCalls.add(`${match[1].toUpperCase()} ${match[2]}`);
  }
});

fs.writeFileSync('api_routes.json', JSON.stringify(Array.from(apiCalls).sort(), null, 2));
console.log('Saved to api_routes.json');
