const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
// An explicit source allowlist prevents copying history, evidence or secrets.
const files = [
  '.gitignore',
  '.nvmrc',
  '.run/API.run.xml',
  '.run/API_tests.run.xml',
  '.run/Frontend.run.xml',
  'Api/.env.example',
  'Api/.eslintrc.js',
  'Api/.prettierrc.js',
  'Api/README.md',
  'Api/app.js',
  'Api/controllers/auth.js',
  'Api/controllers/transactions.js',
  'Api/db/connect.js',
  'Api/db/dev-mongo.js',
  'Api/db/seed.js',
  'Api/helpers/auth.js',
  'Api/helpers/categories.js',
  'Api/helpers/transactions.js',
  'Api/index.js',
  'Api/jest.config.js',
  'Api/middlewares/errors.js',
  'Api/middlewares/isAuth.js',
  'Api/middlewares/validateTransaction.js',
  'Api/models/rt.js',
  'Api/models/category.js',
  'Api/models/transaction.js',
  'Api/models/user.js',
  'Api/package-lock.json',
  'Api/package.json',
  'Api/routes/auth.js',
  'Api/routes/categories.js',
  'Api/routes/transactions.js',
  'Api/specs/auth.test.js',
  'Api/specs/categories.test.js',
  'Api/specs/database.js',
  'Api/specs/env.js',
  'Api/specs/transactions.test.js',
  'FrontEnd/.env.example',
  'FrontEnd/.eslintrc.js',
  'FrontEnd/.prettierrc.js',
  'FrontEnd/README.md',
  'FrontEnd/index.html',
  'FrontEnd/package-lock.json',
  'FrontEnd/package.json',
  'FrontEnd/postcss.config.js',
  'FrontEnd/public/favicon.svg',
  'FrontEnd/src/components/TransactionForm.jsx',
  'FrontEnd/src/components/TransactionFormSkeleton.jsx',
  'FrontEnd/src/components/core/user/Login.jsx',
  'FrontEnd/src/helpers/core/Api.jsx',
  'FrontEnd/src/helpers/core/AuthContext.jsx',
  'FrontEnd/src/helpers/transactions.js',
  'FrontEnd/src/index.jsx',
  'FrontEnd/src/routes/Home.jsx',
  'FrontEnd/src/routes/index.jsx',
  'FrontEnd/src/styles/app.css',
  'FrontEnd/src/styles/style.css',
  'FrontEnd/vite.config.mjs',
  'README.md',
  'docker-compose.yml',
  'docs/LOOM.md',
  'docs/SECURITY.md',
  'docs/VERIFICATION.md',
  'package.json',
  'scripts/export-clean.cjs',
  'scripts/setup-env.cjs'
];
for (const name of files) {
  const source = path.join(root, name);
  if (!fs.lstatSync(source).isFile() || !fs.realpathSync(source).startsWith(root + path.sep)) {
    throw new Error('Invalid export source: ' + name);
  }
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const destination = path.join(root, '.local', 'submission', stamp + '-' + crypto.randomBytes(3).toString('hex'));
fs.mkdirSync(destination, { recursive: true });
for (const name of files) {
  const target = path.join(destination, name);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, name), target, fs.constants.COPYFILE_EXCL);
}
console.log('Clean source export (' + files.length + ' files): ' + destination);
console.log('No history, local evidence, secrets or generated files copied. Nothing published.');
