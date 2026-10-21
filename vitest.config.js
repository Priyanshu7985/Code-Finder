import { defineConfig } from 'vitest/config'

// Progression and game logic are pure modules, so tests run in Node.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
