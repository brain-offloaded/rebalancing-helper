import js from '@eslint/js'
import { globalIgnores } from 'eslint/config'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config';

export default defineConfig(
  globalIgnores(['dist', 'eslint.config.js']),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      eslintPluginPrettierRecommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        // Disambiguate TS config root when running ESLint from monorepo root
        tsconfigRootDir: import.meta.dirname,
        projectService: true,
      },
    },
    ignores: ['coverage/**/*', 'node_modules/**/*', 'dist/**/*'],
  },
)
