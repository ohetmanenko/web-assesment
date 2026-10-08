const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const environments = {
  'Api/.env':
    [
      'PORT=4000',
      'MONGO_URI=mongodb://127.0.0.1:27017/expense_diary',
      'CORS_ORIGIN=http://127.0.0.1:3000',
      'JWT_SECRET=' + crypto.randomBytes(32).toString('hex'),
      'RT_SECRET=' + crypto.randomBytes(32).toString('hex')
    ].join('\n') + '\n',
  'FrontEnd/.env': 'VITE_ENDPOINT=http://127.0.0.1:4000\n'
};
for (const [name, content] of Object.entries(environments)) {
  const target = path.join(root, name);
  if (fs.existsSync(target)) console.log('Kept existing ' + name);
  else {
    fs.writeFileSync(target, content, { flag: 'wx' });
    console.log('Created ' + name);
  }
}
