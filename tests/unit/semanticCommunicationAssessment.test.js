import { describe, expect, it } from 'vitest';
import { semanticSpeakingPrompts, semanticWritingSets } from '../../src/data/communicationContent.js';
import { assessSemanticCommunicationResponse } from '../../src/utils/semanticCommunicationAssessment.js';

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
    expect(result.matched).toEqual(['Menjawab tugasan', 'Idea sendiri', 'Respons lengkap']);
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

  it('does not penalize literal instruction words when genuine semantic evidence is present', () => {
    const task = writingTask('bm');
    const result = assess(task, 'Saya menulis tentang nasi dan telur yang saya makan.', 'bm');

    expect(result.score).toBe(100);
    expect(result.promptEcho).toBe(false);
  });

  it('keeps every open-response rubric bounded to three auditable criteria', () => {
    for (const set of [...semanticSpeakingPrompts, ...semanticWritingSets]) {
      for (const item of set.sessionItems) {
        const tasks = item.prompts || item.tasks;
        for (const task of Object.values(tasks)) {
          expect(task.rubric.criteria).toHaveLength(3);
          expect(task.rubric.criteria).toEqual(['Menjawab tugasan', 'Idea sendiri', 'Respons lengkap']);
        }
      }
    }
  });
});
