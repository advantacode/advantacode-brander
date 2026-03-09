module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true
  },
  ignorePatterns: ["dist/", "node_modules/", "tmp/", "**/brander/**"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  overrides: [
    {
      files: ["test/**/*.js"],
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    }
  ]
};
