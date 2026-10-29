import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Node-based unit tests do not provide the Workers runtime module.
    // Production Wrangler builds still resolve the real built-in module.
    alias: { 'cloudflare:workers': new URL('./tests/helpers/cloudflareWorkersRuntimeStub.js', import.meta.url).pathname }
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.js', 'tests/unit/**/*.test.jsx'],
    maxWorkers: 2,
    reporters: ['default']
  }
});
