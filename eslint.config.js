import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // WebGPU globals
        GPUDevice: 'readonly',
        GPUAdapter: 'readonly',
        GPUCanvasContext: 'readonly',
        GPUBuffer: 'readonly',
        GPUTexture: 'readonly',
        GPUShaderModule: 'readonly',
        GPUBufferUsage: 'readonly',
        GPUTextureUsage: 'readonly',
        GPUTextureFormat: 'readonly',
        GPUFeatureName: 'readonly',
        GPUPowerPreference: 'readonly',
        GPUAdapterInfo: 'readonly',
        GPUBufferUsageFlags: 'readonly',
        GPUTextureUsageFlags: 'readonly',
        BufferSource: 'readonly',
      },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: pluginReact,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
