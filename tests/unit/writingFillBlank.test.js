import { describe, expect, it } from 'vitest';
import { semanticWritingSets } from '../../src/data/communicationContent.js';
import { scoreWritingFillBlank, validateWritingFillBlankTask } from '../../src/utils/writingFillBlank.js';

function firstBlank(languageId) {
  return semanticWritingSets.find(set => set.id === languageId).sessionItems[0].tasks.blank;
}

describe('Menulis fill-blank contract', () => {
  it('renders a real sentence with exactly one visible blank for every authored task', () => {
    for (const set of semanticWritingSets) {
      for (const item of set.sessionItems) {
        const contract = validateWritingFillBlankTask(item.tasks.blank);
        expect(contract.valid, `${set.id}/${item.id}: ${contract.reason}`).toBe(true);
        expect(contract.blankCount).toBe(1);
        expect(contract.acceptedTokens.length).toBeGreaterThan(0);
      }
    }
  });

  it.each([
    ['bm', 'nasi'],
    ['english', 'rice'],
    ['arab', 'الأرز']
  ])('accepts a reviewed %s missing token', (language, answer) => {
    expect(scoreWritingFillBlank(firstBlank(language), answer)).toMatchObject({ score: 100, correct: true });
  });

  it('normalizes harmless spaces, case and punctuation around the submitted token', () => {
    expect(scoreWritingFillBlank(firstBlank('bm'), '  NASI. ')).toMatchObject({ score: 100, correct: true });
    expect(scoreWritingFillBlank(firstBlank('english'), ' RICE! ')).toMatchObject({ score: 100, correct: true });
  });

  it('requires the whole missing token rather than matching a substring or sentence', () => {
    const task = firstBlank('bm');

    expect(scoreWritingFillBlank(task, 'nasihat').score).toBe(0);
    expect(scoreWritingFillBlank(task, 'Saya makan nasi').score).toBe(0);
    expect(scoreWritingFillBlank(task, 'Tulis tentang sarapan').score).toBe(0);
  });

  it('does not reveal accepted tokens in wrong-answer feedback', () => {
    const result = scoreWritingFillBlank(firstBlank('bm'), 'kasut');

    expect(result.score).toBe(0);
    expect(JSON.stringify(result)).not.toMatch(/nasi|roti|telur|buah/i);
  });

  it.each([
    [{ prompt: 'Tiada tempat kosong.', acceptedTokens: ['kata'] }, 'missing-blank'],
    [{ prompt: '____ dan ____', acceptedTokens: ['kata'] }, 'multiple-blanks'],
    [{ prompt: 'Satu ____ sahaja.', acceptedTokens: [] }, 'missing-accepted-token']
  ])('fails safe for malformed authored contracts', (task, reason) => {
    expect(validateWritingFillBlankTask(task)).toMatchObject({ valid: false, reason });
    expect(scoreWritingFillBlank(task, 'kata')).toMatchObject({ status: 'unavailable', score: 0, errorCode: reason });
  });

  it('keeps fill-blank metadata separate from open-ended instruction keywords', () => {
    const task = firstBlank('bm');

    expect(task.prompt).toBe('Saya makan ____ untuk sarapan.');
    expect(task.acceptedTokens).toContain('nasi');
    expect(task.keywords).not.toContain('Tulis');
    expect(task.keywords).not.toContain('tentang');
  });
});
