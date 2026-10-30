import { describe, expect, it } from 'vitest';
import { semanticSpeakingPrompts, semanticWritingSets } from '../../src/data/communicationContent.js';
import {
  assessSemanticCommunicationResponse,
  getSemanticCommunicationRewardScore
} from '../../src/utils/semanticCommunicationAssessment.js';

function speakingPrompt(languageId) {
  return semanticSpeakingPrompts.find(set => set.id === languageId).sessionItems[0].prompts.intro;
}

function writingTask(languageId, mode = 'short') {
  return semanticWritingSets.find(set => set.id === languageId).sessionItems[0].tasks[mode];
}

function assess(task, response, language) {
  return assessSemanticCommunicationResponse({
    prompt: task.text || task.prompt,
    rubric: task.rubric,
    response,
    language
  });
}

describe('semantic Menulis and Bertutur assessment', () => {
  it('reproduces the breakfast fixture without treating instruction words as expected content', () => {
    const task = writingTask('bm');
    const result = assess(task, 'Saya makan nasi untuk sarapan.', 'bm');

    expect(task.keywords).not.toContain('Tulis');
    expect(task.keywords).not.toContain('tentang');
    expect(result.score).toBe(100);
    expect(result.matched).toEqual(['Berkaitan tugasan', 'Ada tindakan dan butiran', 'Ayat cukup jelas']);
  });

  it('gives no credit when the learner only parrots the BM prompt', () => {
    const task = speakingPrompt('bm');
    const result = assess(task, 'ceritakan sarapan kamu', 'ms-MY');

    expect(task.keywords).not.toContain('ceritakan');
    expect(task.keywords).not.toContain('kamu');
    expect(result).toMatchObject({ score: 0, promptEcho: true });
    expect(result.explanation).toMatch(/idea kamu sendiri/i);
    expect(result.message).toBe(result.explanation);
  });

  it.each([
    ['english', 'I eat rice and fruit for breakfast.', 100],
    ['arab', 'أنا آكل الخبز والبيض.', 100]
  ])('accepts a grounded %s response using the reviewed rubric', (language, response, expectedScore) => {
    expect(assess(speakingPrompt(language), response, language).score).toBe(expectedScore);
  });

  it.each([
    ['english', 'describe your breakfast'],
    ['arab', 'صِفْ فَطُورَكَ']
  ])('rejects %s prompt parroting after Unicode normalization', (language, response) => {
    expect(assess(speakingPrompt(language), response, language)).toMatchObject({ score: 0, promptEcho: true });
  });

  it('does not award a high score to irrelevant or adversarial filler', () => {
    const task = writingTask('bm');

    expect(assess(task, 'Saya bermain bola di padang.', 'bm').score).toBeLessThan(60);
    expect(assess(task, `${task.prompt} xyz abc.`, 'bm')).toMatchObject({ score: 0, promptEcho: true });
  });

  it.each([
    'nasi roti batu',
    'nasi roti kereta',
    'roti nasi kucing'
  ])('does not pass a BM breakfast cue bag: %s', response => {
    const result = assess(writingTask('bm'), response, 'bm');

    expect(result.score).toBeLessThan(60);
    expect(result.criteria.find(item => item.id === 'complete')).toMatchObject({ status: 'missing' });
  });

  it.each([
    ['bm', 'Saya makan nasi tetapi saya tidak makan nasi.', 'tidak'],
    ['english', 'I eat bread but I do not eat bread.', 'do not'],
    ['arab', 'أنا آكل الخبز ولا آكل الخبز.', 'لا']
  ])('routes a contradictory %s response to limited formative review', (language, response) => {
    const result = assess(writingTask(language), response, language);

    expect(result.score).toBeLessThan(60);
    expect(result.requiresTeacherReview).toBe(true);
    expect(result.masteryEligible).toBe(false);
    expect(result.rewardEligible).toBe(false);
    expect(getSemanticCommunicationRewardScore(result)).toBe(0);
    expect(result.explanation).toMatch(/guru|orang dewasa/i);
  });

  it.each([
    ['bm', 'Pada waktu pagi, saya makan bubur dan minum susu.'],
    ['english', 'I have cereal and milk for breakfast.'],
    ['arab', 'أنا آكل الخبز وأشرب الحليب في الفطور.']
  ])('accepts an alternative teacher-reviewed %s breakfast response', (language, response) => {
    const result = assess(writingTask(language), response, language);

    expect(result.score).toBe(100);
    expect(result.masteryEligible).toBe(true);
    expect(result.rewardEligible).toBe(true);
    expect(getSemanticCommunicationRewardScore(result)).toBe(100);
    expect(result.semanticUnderstanding).toBe(false);
    expect(result.assessmentBasis).toBe('bounded-formative-evidence');
  });

  it('allows a short but grounded oral response without applying the writing-length rule', () => {
    const result = assess(speakingPrompt('bm'), 'Saya makan nasi.', 'bm');

    expect(result.score).toBe(100);
    expect(result.criteria.find(item => item.id === 'complete')).toMatchObject({ status: 'correct' });
  });

  it('does not penalize literal instruction words when genuine semantic evidence is present', () => {
    const task = writingTask('bm');
    const result = assess(task, 'Saya menulis tentang nasi dan telur yang saya makan.', 'bm');

    expect(result.score).toBe(100);
    expect(result.promptEcho).toBe(false);
  });

  it('keeps all 50-item writing variants on a reviewed bounded rubric with matching language', () => {
    for (const set of semanticWritingSets) {
      expect(set.sessionItems).toHaveLength(50);
      for (const item of set.sessionItems) {
        for (const task of Object.values(item.tasks)) {
          expect(task.rubric).toMatchObject({
            version: 2,
            language: set.id,
            mode: 'writing',
            reviewStatus: 'teacher-reviewed',
            assessmentBasis: 'bounded-formative-evidence',
            semanticUnderstanding: false
          });
          expect(task.rubric.evidenceGroups).toHaveLength(2);
          expect(task.rubric.evidenceGroups.every(group => group.length > 0)).toBe(true);
        }
      }
    }
  });

  it('keeps every speaking rubric bounded and prevents unreviewed prompts from earning mastery', () => {
    for (const set of [...semanticSpeakingPrompts, ...semanticWritingSets]) {
      for (const item of set.sessionItems) {
        const tasks = item.prompts || item.tasks;
        for (const task of Object.values(tasks)) {
          expect(task.rubric.criteria).toHaveLength(3);
          expect(task.rubric.criteria).toEqual(['Berkaitan tugasan', 'Ada tindakan dan butiran', 'Ayat cukup jelas']);
          expect(task.rubric.language).toBe(set.id);
          expect(task.rubric.semanticUnderstanding).toBe(false);

          if (item.prompts && task.rubric.reviewStatus === 'safe-fallback') {
            const result = assess(task, task.rubric.topicTerms.join(' '), set.id);
            expect(result.score).toBeLessThan(60);
            expect(result.requiresTeacherReview).toBe(true);
            expect(result.masteryEligible).toBe(false);
          }
        }
      }
    }
  });
});
