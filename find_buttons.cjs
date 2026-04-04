const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let suspiciousButtons = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const buttonRegex = /<Button\b([^>]*?)>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
      const props = match[1];
      if (!props.includes('onClick') && !props.includes('type="submit"') && !props.includes('asChild')) {
          suspiciousButtons.push({ file: file.replace(__dirname, ''), props: props.trim().replace(/\s+/g, ' ') });
      }
  }
});

fs.writeFileSync('output.json', JSON.stringify(suspiciousButtons, null, 2), 'utf8');
console.log(`Donel ${suspiciousButtons.length} buttons.`);
