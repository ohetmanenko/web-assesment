module.exports = {
  root: true,
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2022: true, node: true },
  plugins: ['react', 'react-hooks'],
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:react-hooks/recommended', 'prettier'],
  rules: { 'react/react-in-jsx-scope': 'off', 'react/prop-types': 'off' }
};
