import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ["dist/**", "node_modules/**", "cleanup.sh", "supabase/functions/**"],
  },
  // Config for JS files
  {
    files: ["**/*.{js,cjs}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
      }
    }
  },
  // Config for TS/TSX files
  ...tseslint.config({
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: { ...globals.browser, React: 'readonly' },
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Disable base rules to avoid conflicts with @typescript-eslint
      'no-unused-expressions': 'off',
      'dot-notation': 'off',
      'no-empty-function': 'off',
      'no-loss-of-precision': 'off',
      'no-unused-vars': 'off',

      // Configure @typescript-eslint rules
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      '@typescript-eslint/dot-notation': ['warn', { allowKeywords: true }],
      '@typescript-eslint/no-empty-function': ['warn', { "allow": ["arrowFunctions"] }],
      '@typescript-eslint/no-loss-of-precision': 'error',
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],

      // Relax rules to reduce initial error count
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  })
];