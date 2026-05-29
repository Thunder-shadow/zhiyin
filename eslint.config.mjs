import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  // Ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/server/dist/**',
      '**/.git/**',
      '**/*.css',
      '**/*.json',
      '**/*.md',
      // Ignore component library warnings
      'src/components/ui/**',
      'src/presets/**',
      'src/lib/**',
    ],
  },

  ...compat.extends('taro/react'),

  {
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react/jsx-no-undef': 'off',
    },
  },
];
