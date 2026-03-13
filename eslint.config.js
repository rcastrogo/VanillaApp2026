// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-config-prettier"; 

export default tseslint.config(
  {
    // 1. IGNORADOS GLOBALES
    ignores: ["dist/", "node_modules/", "temp/"],
  },
  {
    // 2. CONFIGURACIÓN PARA TYPESCRIPT
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
    ],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error", 
        { "argsIgnorePattern": "^_" }
      ],
      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling"]],
          pathGroups: [{ pattern: "~/**", group: "internal" }],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      // "@typescript-eslint/no-explicit-any": "off", 
    },
  },
  {
    // 3. CONFIGURACIÓN PARA HTML (El "Arregla-Errores")
    files: ["**/*.html"],
    languageOptions: {
      // Obligamos a ESLint a no usar lógica de JS en el HTML
      parser: {
        meta: { name: "html-parser-dummy" },
        parseForESLint: () => ({
            ast: { type: "Program", body: [], tokens: [], comments: [], loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } } },
            visitorKeys: {}
        })
      }
    },
    rules: {
      // Aquí el linter de JS/TS no tiene nada que hacer
    },
  },
  eslintConfigPrettier
);