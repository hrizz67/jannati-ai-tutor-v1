import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('../../src/styles/style.css', import.meta.url), 'utf8');
const shortViewport = styles.slice(styles.lastIndexOf('/* P2.6-F2: on short mobile/landscape'));

describe('P2.6-F2 Tutor short mobile reading pane', () => {
  it('limits the compressed layout to small/short viewport and Tutor modal', () => {
    expect(shortViewport).toMatch(/@media \(max-width: 650px\) and \(max-height: 620px\)/u);
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-head/u);
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-input/u);
    expect(shortViewport).not.toMatch(/\.ai-explain-modal|\.ai-teacher-modal/u);
  });

  it('preserves visible title, subject context, safety disclosure and close control', () => {
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-title\s*\{[^}]*font-size: 1rem/su);
    expect(shortViewport).toMatch(/\.ai-chat \.ai-modal-context-line\s*\{[^}]*line-height: 1\.3/su);
    expect(shortViewport).toMatch(/\.ai-chat \.tutor-ai-disclosure\s*\{[^}]*line-height: 1\.3/su);
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-head > \.secondary\s*\{[^}]*min-height: 44px/su);
    expect(shortViewport).not.toMatch(/\.tutor-ai-disclosure\s*\{[^}]*display:\s*none/su);
  });

  it('keeps send/microphone input target sizes and avoids three stacked footer rows', () => {
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-input\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\) auto/su);
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-input\.ai-chat-input-no-speech\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/su);
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-input button\s*\{[^}]*min-height:\s*44px/su);
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-input input\s*\{[^}]*min-height:\s*44px/su);
  });

  it('retains an explicitly shrinkable chat reading region without dropping the disclosure', () => {
    expect(shortViewport).toMatch(/\.ai-chat \.ai-chat-body\s*\{[^}]*min-height:\s*0/su);
    expect(shortViewport).not.toMatch(/\.ai-chat \.ai-chat-body\s*\{[^}]*display:\s*none/su);
  });
});
