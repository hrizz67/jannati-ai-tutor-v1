import { describe, expect, it } from 'vitest';
import {
  alignSpeechTokens,
  containsNormalizedSpeechPhrase,
  normalizeSpeechComparisonText,
  scoreReadingSpeech,
  scoreSpeakingKeywords
} from '../../src/ai/speech/speechScoring.js';

describe('speech scoring normalization', () => {
  it('treats BM digit 7 and tujuh as equivalent', () => {
    const result = scoreReadingSpeech('Bas tiba pada pukul tujuh.', 'Bas tiba pada pukul 7.', { language: 'ms-MY' });

    expect(result.score).toBe(100);
    expect(result.words.at(-1)).toMatchObject({ status: 'correct', spokenText: '7.' });
  });

  it('treats punctuated Tujuh and 7 as equivalent', () => {
    expect(normalizeSpeechComparisonText('Tujuh,', { language: 'bm' })).toBe('7');
    expect(normalizeSpeechComparisonText('7', { language: 'bm' })).toBe('7');
  });

  it('treats kosong as zero only in a conservative numeric context', () => {
    expect(scoreReadingSpeech('nombor kosong', 'nombor 0', { language: 'ms-MY' }).score).toBe(100);
    expect(scoreReadingSpeech('air kosong', 'air 0', { language: 'ms-MY' }).score).toBeLessThan(100);
  });

  it('keeps punctuation, case, and spacing neutral without changing the source text', () => {
    const transcript = '  BAS   sekolah tiba!  ';
    const result = scoreReadingSpeech('Bas sekolah tiba.', transcript, { language: 'ms-MY' });

    expect(result.score).toBe(100);
    expect(transcript).toBe('  BAS   sekolah tiba!  ');
  });

  it('does not fuzzy-match tetip and tertib', () => {
    const result = scoreReadingSpeech('Murid beratur dengan tertib.', 'Murid beratur dengan tetip.', { language: 'ms-MY' });

    expect(result.score).toBeLessThan(100);
    expect(result.substitutions).toEqual([{ expected: 'tertib.', actual: 'tetip.' }]);
  });

  it('does not fuzzy-match membaca and membawa', () => {
    const result = scoreReadingSpeech('Ali membaca buku.', 'Ali membawa buku.', { language: 'ms-MY' });

    expect(result.substitutions).toEqual([{ expected: 'membaca', actual: 'membawa' }]);
  });

  it('counts one substitution once rather than as missing plus extra', () => {
    const result = scoreReadingSpeech('satu dua tiga', 'satu lima tiga', { language: 'ms-MY' });

    expect(result.substitutionWordCount).toBe(1);
    expect(result.missedWordCount).toBe(0);
    expect(result.extraWordCount).toBe(0);
    expect(result.alignment.map(entry => entry.status)).toEqual(['correct', 'substitution', 'correct']);
  });

  it('aligns one missing word without shifting later matches', () => {
    const result = scoreReadingSpeech('kami pergi ke sekolah', 'kami ke sekolah', { language: 'ms-MY' });

    expect(result.missed).toEqual(['pergi']);
    expect(result.matchedWordCount).toBe(3);
    expect(result.extraWordCount).toBe(0);
  });

  it('aligns one extra word without shifting later matches', () => {
    const result = scoreReadingSpeech('kami pergi sekolah', 'kami akan pergi sekolah', { language: 'ms-MY' });

    expect(result.extraWords).toEqual(['akan']);
    expect(result.words.find(word => word.status === 'extra')).toMatchObject({ text: 'akan', spokenText: 'akan' });
    expect(result.matchedWordCount).toBe(3);
    expect(result.missedWordCount).toBe(0);
  });

  it('keeps tokens after a middle insertion correctly aligned', () => {
    const alignment = alignSpeechTokens('a b c d', 'a b tambahan c d', { language: 'ms-MY' });

    expect(alignment.map(entry => entry.status)).toEqual(['correct', 'correct', 'extra', 'correct', 'correct']);
  });

  it('keeps a perfect BM sentence at 100 percent', () => {
    const sentence = 'Bas sekolah tiba pada pukul tujuh. Murid-murid beratur dengan tertib.';
    expect(scoreReadingSpeech(sentence, sentence, { language: 'ms-MY' }).score).toBe(100);
  });

  it('only penalizes the real word error in the primary BM example', () => {
    const target = 'Bas sekolah tiba pada pukul tujuh. Murid-murid beratur dengan tertib.';
    const transcript = 'Bas sekolah tiba pada pukul 7. Murid-murid beratur dengan tetip.';
    const result = scoreReadingSpeech(target, transcript, { language: 'ms-MY' });

    expect(result.matchedWordCount).toBe(result.totalTargetWords - 1);
    expect(result.substitutions).toEqual([{ expected: 'tertib.', actual: 'tetip.' }]);
    expect(result.missedWordCount).toBe(0);
    expect(result.extraWordCount).toBe(0);
  });
});

describe('English speech scoring normalization', () => {
  it('treats digit 7 and seven as equivalent', () => {
    expect(scoreReadingSpeech('The bus arrives at seven.', 'The bus arrives at 7.', { language: 'en-US' }).score).toBe(100);
  });

  it('supports English number equivalence from 0 through 20', () => {
    const spoken = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty';
    const digits = Array.from({ length: 21 }, (_, index) => index).join(' ');

    expect(scoreReadingSpeech(spoken, digits, { language: 'english' }).score).toBe(100);
  });

  it('keeps English punctuation and case neutral', () => {
    expect(scoreReadingSpeech('Seven, RED cats.', '7 red cats', { language: 'en-US' }).score).toBe(100);
  });

  it('keeps a genuinely wrong English word wrong', () => {
    const result = scoreReadingSpeech('the cat sleeps', 'the cap sleeps', { language: 'en-US' });

    expect(result.substitutionWordCount).toBe(1);
    expect(result.score).toBeLessThan(100);
  });
});

describe('Arabic speech scoring normalization', () => {
  it('normalizes Unicode, spacing, tatweel, and harmless diacritics safely', () => {
    const result = scoreReadingSpeech('هٰذَا كِتَابٌ', '  هذا   كـتاب  ', { language: 'ar-SA' });

    expect(result.score).toBe(100);
  });

  it('does not collapse genuinely different Arabic letters or words', () => {
    const result = scoreReadingSpeech('هذا كتاب', 'هذا كلب', { language: 'ar-SA' });

    expect(result.substitutions).toEqual([{ expected: 'كتاب', actual: 'كلب' }]);
    expect(result.score).toBeLessThan(100);
  });
});

describe('speaking keyword normalization', () => {
  it('uses number-equivalent whole-token phrase matching', () => {
    const result = scoreSpeakingKeywords(
      { keywords: ['pukul tujuh', 'sekolah'] },
      'Bas sampai ke sekolah pada pukul 7.',
      { language: 'ms-MY' }
    );

    expect(result.matched).toEqual(['pukul tujuh', 'sekolah']);
  });

  it('does not accept an embedded substring as a keyword match', () => {
    expect(containsNormalizedSpeechPhrase('the catalog is red', 'cat', { language: 'en-US' })).toBe(false);
  });
});
