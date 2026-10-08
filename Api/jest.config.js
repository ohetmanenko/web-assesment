module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/specs/auth.test.js', '**/specs/transactions.test.js', '**/specs/categories.test.js'],
  setupFiles: ['<rootDir>/specs/env.js'],
  testTimeout: 120000,
  collectCoverageFrom: [
    'controllers/auth.js',
    'controllers/transactions.js',
    'middlewares/errors.js',
    'middlewares/isAuth.js',
    'middlewares/validateTransaction.js',
    'helpers/auth.js',
    'helpers/transactions.js',
    'helpers/categories.js',
    'routes/categories.js'
  ],
  coverageDirectory: 'coverage'
};
