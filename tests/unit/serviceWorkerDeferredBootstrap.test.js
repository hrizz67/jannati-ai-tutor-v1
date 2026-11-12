import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const main = readFileSync(new URL('../../src/main.jsx', import.meta.url), 'utf8');
const registration = readFileSync(
  new URL('../../src/services/serviceWorkerRegistration.js', import.meta.url), 'utf8'
);

describe('P2.6-G production first-load service-worker code splitting', () => {
  it('keeps the production-only browser capability guard', () => {
    expect(main).toContain("import.meta.env.PROD && 'serviceWorker' in navigator");
    expect(main).toContain("window.addEventListener('load'");
    expect(main).toContain('createRoot(document.getElementById');
  });

  it('loads service-worker code only after window load without adding static entry imports', () => {
    expect(main).not.toMatch(/^import\s+\{\s*registerAppServiceWorker\s*\}/m);
    expect(main).toContain("import('./services/serviceWorkerRegistration.js')");
    expect(main).toContain('.then(({ registerAppServiceWorker }) => registerAppServiceWorker())');
    expect(main).toContain('.catch(() => null)');
  });

  it('preserves version-scoped registration and graceful SW registration failures', () => {
    expect(registration).toContain('serviceWorker.register(getServiceWorkerUrl(');
    expect(registration).toContain('buildRevision = DEFAULT_BUILD_REVISION');
    expect(registration).toContain('return null;');
  });
});
