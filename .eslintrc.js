module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "import", "prettier", "jsdoc"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended"
  ],
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json"
      }
    }
  },
  rules: {
    "prettier/prettier": "error",
    "import/order": [
      "error",
      {
        alphabetize: { order: "asc", caseInsensitive: true },
        "newlines-between": "never",
        groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]],
        pathGroups: [
          {
            pattern: "@/**",
            group: "internal"
          }
        ],
        pathGroupsExcludedImportTypes: ["builtin"]
      }
    ],
    "jsdoc/require-jsdoc": [
      "warn",
      {
        enableFixer: false,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: false,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
          FunctionExpression: false
        }
      }
    ],
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/no-misused-promises": "error"
  },
  overrides: [
    {
      files: ["tests/**/*.ts"],
      env: {
        node: true,
        es2022: true
      },
      rules: {
        "jsdoc/require-jsdoc": "off"
      }
    }
  ]
};
