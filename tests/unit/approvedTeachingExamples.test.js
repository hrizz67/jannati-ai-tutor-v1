import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fetchCoachKnowledgeData } from '../../src/ai/coach/knowledge/knowledgeAdapter.js';
import { fetchTutorKnowledgeData } from '../../src/ai/coach/knowledge/tutorKnowledgeAdapter.js';
import {
  APPROVED_TEACHING_EXAMPLES,
  selectApprovedTeachingExamples
} from '../../src/ai/pedagogy/approvedTeachingExamples.js';

function knowledgeCandidates(knowledge = {}) {
  return [
    ...(knowledge.examples || []),
    ...(knowledge.extraExamples || []),
    ...(knowledge.workedExamples || [])
  ];
}

describe('authored teaching-example approval boundary', () => {
  it.each([
    ['BM', 'bm', 'kata_nama_am'],
    ['English', 'english', 'nouns'],
    ['Arabic', 'arab', 'mufradat']
  ])('admits only allowlisted %s examples from the loaded knowledge pack', async (_label, subjectId, topicId) => {
    const knowledge = await fetchCoachKnowledgeData({ subjectId, topicId });
    expect(knowledge?.packLoaded).toBe(true);

    const candidates = [...knowledgeCandidates(knowledge), 'CONTOH TIDAK DILULUSKAN'];
    const result = selectApprovedTeachingExamples({ subjectId, topicId, candidates });
    const catalog = APPROVED_TEACHING_EXAMPLES[`${subjectId}::${topicId}`];

    expect(result.examples.length).toBeGreaterThan(0);
    expect(result.examples.every(example => catalog.examples.includes(example))).toBe(true);
    expect(result.examples).not.toContain('CONTOH TIDAK DILULUSKAN');
    expect(result.provenance).toEqual({
      approvalId: 'P2.2-PR2-AUTHORED-EXAMPLES-2026-10-27',
      source: 'authored-allowlist',
      status: 'approved-for-adaptive-teaching'
    });
  });

  it('does not elevate a successfully loaded but unapproved topic or candidate', () => {
    expect(selectApprovedTeachingExamples({
      subjectId: 'sains',
      topicId: 'haiwan',
      candidates: ['Kucing ialah haiwan.'],
      packLoaded: true
    })).toEqual({ examples: [], provenance: null });

    expect(selectApprovedTeachingExamples({
      subjectId: 'bm',
      topicId: 'kata_nama_am',
      candidates: ['Contoh baharu yang belum disemak.'],
      packLoaded: true
    })).toEqual({ examples: [], provenance: null });
  });

  it.each([
    ['bm', 'kata_nama_am'],
    ['english', 'nouns'],
    ['arab', 'mufradat']
  ])('keeps the Tutor-specific %s adapter grounded in the authored allowlist', async (subjectId, topicId) => {
    const knowledge = await fetchTutorKnowledgeData({ subjectId, topicId });
    const result = selectApprovedTeachingExamples({
      subjectId,
      topicId,
      candidates: knowledgeCandidates(knowledge)
    });

    expect(knowledge).toMatchObject({ source: 'knowledge', packLoaded: true });
    expect(result.examples.length).toBeGreaterThan(0);
    expect(result.provenance?.status).toBe('approved-for-adaptive-teaching');
    expect(knowledge).not.toHaveProperty('learningProfile');
  });

  it('has no network or remote-AI path', () => {
    const source = [
      'src/ai/pedagogy/approvedTeachingExamples.js',
      'src/ai/coach/knowledge/tutorKnowledgeAdapter.js',
      'src/ai/coach/knowledge/knowledgeText.js'
    ].map(file => readFileSync(resolve(file), 'utf8')).join('\n');
    expect(source).not.toMatch(/fetch\s*\(|XMLHttpRequest|WebSocket|functions\.invoke|supabase/i);
  });
});
