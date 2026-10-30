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

  it('preserves Arabic consonantal hamza while allowing reviewed short vowel marks', () => {
    const task = semanticWritingSets.find(set => set.id === 'arab').sessionItems[9].tasks.blank;
    expect(task.acceptedTokens).toContain('أقرأ');

    expect(scoreWritingFillBlank(task, 'أقرأ')).toMatchObject({ score: 100, correct: true });
    expect(scoreWritingFillBlank(task, 'أَقْرَأُ')).toMatchObject({ score: 100, correct: true });
    expect(scoreWritingFillBlank(task, 'أَقْرَأُ')).toMatchObject({ score: 100, correct: true });

    for (const unreviewed of ['اقرا', 'أقرا', 'اقرأ', 'اَقْرَا', 'اقراء']) {
      expect(scoreWritingFillBlank(task, unreviewed), unreviewed)
        .toMatchObject({ score: 0, correct: false });
    }
  });

  it.each([
    ['إلى', 'الى', 'إِلَى'],
    ['سأل', 'سال', 'سَأَلَ'],
    ['ماء', 'ما', 'مَاء']
  ])('rejects Arabic hamza or spelling omissions: %s vs %s', (accepted, rejected, vocalized) => {
    const task = { prompt: 'الكلمة ____ مناسبة.', acceptedTokens: [accepted] };
    expect(scoreWritingFillBlank(task, accepted).score).toBe(100);
    expect(scoreWritingFillBlank(task, vocalized).score).toBe(100);
    expect(scoreWritingFillBlank(task, rejected)).toMatchObject({ score: 0, correct: false });
    expect(JSON.stringify(scoreWritingFillBlank(task, rejected))).not.toContain(accepted);
  });

  it('only accepts alternate Arabic spellings if explicitly authored', () => {
    const task = { prompt: 'الكلمة ____ مناسبة.', acceptedTokens: ['أقرأ', 'اقرا'] };
    expect(scoreWritingFillBlank(task, 'اقرا')).toMatchObject({ score: 100, correct: true });
    expect(scoreWritingFillBlank(task, 'أقرأ')).toMatchObject({ score: 100, correct: true });
    expect(scoreWritingFillBlank(task, 'اقرأ')).toMatchObject({ score: 0, correct: false });
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
