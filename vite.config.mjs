import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import {
  QA_PREVIEW_BASE_PATH,
  isQaPreviewMode,
  requireQaPreviewRevision,
  resolveBuildEnvironment
} from './scripts/preview/qaPreviewPolicy.mjs'

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig(({ mode }) => {
  const qaPreview = isQaPreviewMode(mode)
  const qaPreviewEnvDir = process.env.QA_PREVIEW_ENV_DIR?.trim()
  const env = qaPreview ? {} : loadEnv(mode, process.cwd(), '')
  const buildEnvironment = resolveBuildEnvironment({ mode, env })
  const { supabaseUrl, supabasePublishableKey, sttEndpoint } = buildEnvironment
  const buildDate = new Date().toISOString()
  const revisionCandidate = process.env.VITE_BUILD_REVISION?.trim()
    || env.VITE_BUILD_REVISION?.trim()
    || process.env.GITHUB_SHA?.trim()
    || buildDate
  const buildRevision = qaPreview
    ? requireQaPreviewRevision(revisionCandidate)
    : revisionCandidate

  if (!qaPreview && (!supabaseUrl || !supabasePublishableKey)) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Configure .env.local or deployment environment variables before building.')
  }

  return {
  plugins: [react()],
  base: QA_PREVIEW_BASE_PATH,
  envDir: qaPreview && qaPreviewEnvDir ? qaPreviewEnvDir : process.cwd(),
  optimizeDeps: {
    entries: ['index.html'],
    include: ['react-dom/client']
  },
  build: {
    rollupOptions: {
      checks: {
        pluginTimings: false
      },
      output: {
        manualChunks(id) {
          const moduleId = id.replaceAll('\\', '/')
          if (moduleId.includes('/node_modules/react/') || moduleId.includes('/node_modules/react-dom/') || moduleId.includes('/node_modules/scheduler/')) {
            return 'vendor-react'
          }
          if (moduleId.includes('/node_modules/@supabase/')) {
            return 'vendor-supabase'
          }
          if (moduleId.includes('/src/ai/speech/')) {
            return 'speech-runtime'
          }
          if (/\/src\/(?:data\/bm(?:BinaAyat|PentaksiranSumatif|SimpulanBahasa)Questions|utils\/bmSentenceQuality)\.js$/.test(moduleId)) {
            return 'bm-enrichment'
          }
          if (/\/src\/data\/math(?:Nombor|Tambah|Tolak|Darab|Bahagi|Wang|Masa|Panjang|JisimIsiPadu|Bentuk)Questions\.js$/.test(moduleId)) {
            return 'math-enrichment'
          }
          return undefined
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version || '0.0.0'),
    __APP_BUILD_DATE__: JSON.stringify(buildDate),
    __APP_BUILD_REVISION__: JSON.stringify(buildRevision),
    __QA_PREVIEW_BUILD__: JSON.stringify(qaPreview),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabasePublishableKey),
    'import.meta.env.VITE_STT_ENDPOINT': JSON.stringify(sttEndpoint)
  }
  }
})
