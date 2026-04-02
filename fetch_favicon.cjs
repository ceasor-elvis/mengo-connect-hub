const https = require('https');
const fs = require('fs');

const url = 'https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://unsauganda.org&size=128';

https.get(url, (res) => {
  const data = [];
  res.on('data', d => data.push(d));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    const b64 = buffer.toString('base64');
    fs.writeFileSync('src/assets/unsaBase64.ts', 'export const unsaLogoB64 = "data:image/png;base64,' + b64 + '";\n');
    console.log('Successfully wrote src/assets/unsaBase64.ts');
  });
}).on('error', console.error);
