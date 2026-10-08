module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/specs/auth.test.js', '**/specs/transactions.test.js'],
  setupFiles: ['<rootDir>/specs/env.js'],
  testTimeout: 120000,
  collectCoverageFrom: ['controllers/**/*.js', 'middlewares/**/*.js', 'helpers/auth.js', 'helpers/transactions.js'],
  coverageDirectory: 'coverage'
};
