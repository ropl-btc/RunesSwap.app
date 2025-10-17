import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import { defineConfig } from 'eslint/config';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

export default defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['.next/**', 'coverage/**', 'node_modules/**', 'dist/**', 'src/sdk/**'],
  },
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'warn',
    },
    languageOptions: {
      parserOptions: {
        project: false,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSort,
      '@next/next': nextPlugin,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'warn',
      'no-empty': 'warn',
      'no-useless-catch': 'warn',
      'no-unsafe-finally': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      'no-prototype-builtins': 'warn',
    },
  },
  // SDK and generated code: relax rules
  {
    files: ['src/sdk/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'simple-import-sort/imports': 'off',
      'simple-import-sort/exports': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-prototype-builtins': 'off',
      'no-empty': 'off',
      'no-useless-catch': 'off',
      'no-unsafe-finally': 'off',
    },
  },
  // Tests: relax some rules, allow dev-style imports
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      'simple-import-sort/imports': 'off',
      'simple-import-sort/exports': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // JS setup/config and mocks
  {
    files: [
      '**/*.js',
      '**/*.cjs',
      '**/*.mjs',
      '__mocks__/**',
      'commitlint.config.js',
      'jest.setup.js',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        window: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'no-undef': 'off',
    },
  },
  // Test utilities: allow any types
  {
    files: ['src/test-utils.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Logger file: allow console methods inside centralized logger only
  {
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
]);


