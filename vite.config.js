import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim()
  const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Configure .env.local or deployment environment variables before building.')
  }

  return {
  plugins: [react()],
  base: '/jannati-ai-tutor-v1/',
  envDir: process.cwd(),
  optimizeDeps: {
    entries: ['index.html'],
    include: ['react-dom/client']
  },
  build: {
    rollupOptions: {
      checks: {
        pluginTimings: false
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version || '0.0.0'),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey)
  }
  }
})
