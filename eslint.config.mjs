import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.output/**',
      '**/coverage/**',
      '**/routeTree.gen.ts',
      'graphify-out/**',
    ],
  },
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.{ts,js,mjs}'],
    rules: {
      'max-lines-per-function': [
        'warn',
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
  {
    files: ['**/*.{tsx,jsx}'],
    rules: {
      'max-lines-per-function': [
        'warn',
        {
          max: 200,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
  {
    files: [
      '**/*.test.{ts,tsx,js,mjs}',
      '**/*.spec.{ts,tsx,js,mjs}',
      '**/*.e2e-spec.{ts,tsx,js,mjs}',
      '**/tests/**',
      '**/testing/**',
      '**/*.config.*',
      '**/openapi.ts',
    ],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
)
