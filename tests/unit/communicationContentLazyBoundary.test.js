import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadCommunicationContent } from '../../src/data/loadCommunicationContent.js';

describe('communication content lazy boundary', () => {
  it('loads each semantic communication bank on demand through one cached promise', async () => {
    const firstLoad = loadCommunicationContent();
    expect(loadCommunicationContent()).toBe(firstLoad);

    const content = await firstLoad;
    expect(content.semanticListeningSets).toHaveLength(3);
    expect(content.semanticSpeakingPrompts).toHaveLength(3);
    expect(content.semanticReadingPassages).toHaveLength(3);
    expect(content.semanticWritingSets).toHaveLength(3);
  });

  it('keeps the App root free of a static communication-content import', () => {
    const appSource = fs.readFileSync(new URL('../../src/App.jsx', import.meta.url), 'utf8');
    const gateSource = fs.readFileSync(new URL('../../src/components/communication/CommunicationContentGate.jsx', import.meta.url), 'utf8');

    expect(appSource).toContain("const CommunicationContentGate = React.lazy(() => import('./components/communication/CommunicationContentGate.jsx'));");
    expect(appSource).not.toContain("from './data/communicationContent.js'");
    expect(gateSource).toContain('use(loadCommunicationContent())');
  });
});
