module.exports = {
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended-type-checked"],
  env: {
    node: true,
  },
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
}
