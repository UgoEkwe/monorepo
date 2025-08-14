import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.{test,spec}.{ts,js}'],
    exclude: ['node_modules', '__pycache__', '*.py', 'venv'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__pycache__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.py',
        'venv/',
      ],
    },
  },
});