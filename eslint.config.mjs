import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

const correctnessRules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': 'off',
  'no-empty': ['warn', { allowEmptyCatch: true }],
  'no-constant-binary-expression': 'error',
  'no-control-regex': 'off',
  'no-misleading-character-class': 'off',
  'no-regex-spaces': 'off',
  'no-useless-assignment': 'off',
  'no-useless-escape': 'off',
  'preserve-caught-error': 'off'
};

const unusedRules = {
  'no-unused-vars': ['warn', {
    argsIgnorePattern: '^_',
    caughtErrors: 'none',
    ignoreRestSiblings: true,
    varsIgnorePattern: '^_'
  }]
};

export default [
  {
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    ignores: [
      'dist/**',
      'node_modules/**',
      'reports/**',
      'public/service-worker.js',
      'src/data/**'
    ]
  },
  {
    files: ['src/**/*.{js,jsx}', 'vite.config.mjs', 'vitest.config.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.es2025,
        __APP_BUILD_DATE__: 'readonly',
        __APP_VERSION__: 'readonly',
        process: 'readonly'
      }
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...correctnessRules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off'
    }
  },
  {
    files: [
      'src/hooks/**/*.js',
      'src/services/**/*.js',
      'src/ai/policy/**/*.js',
      'src/components/ai/modalRuntime.js',
      'src/components/questions/InteractiveQuestionEngine.jsx',
      'src/components/SubjectLanguageText.jsx',
      'src/dashboard/StudentDashboard.jsx',
      'src/main.jsx'
    ],
    rules: unusedRules
  },
  {
    files: [
      'src/hooks/**/*.js',
      'src/components/ai/modalRuntime.js',
      'src/components/questions/InteractiveQuestionEngine.jsx'
    ],
    rules: { 'react-hooks/exhaustive-deps': 'warn' }
  },
  {
    files: ['scripts/**/*.{js,mjs}', 'tests/**/*.js', 'supabase/functions/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2025 }
    },
    rules: { ...correctnessRules, ...unusedRules }
  }
];
