module.exports = [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "coverage/**"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: {
        process: "readonly",
        console: "readonly",
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "error",
      "no-undef": "error",
      "no-var": "error",
      eqeqeq: "error",
      "prefer-const": "error"
    }
  }
];
