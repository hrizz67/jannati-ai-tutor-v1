import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  plugins: [react()],
  base: '/jannati-ai-tutor-v1/',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version || '0.0.0'),
    __APP_BUILD_DATE__: JSON.stringify(new Date().toISOString())
  }
})
