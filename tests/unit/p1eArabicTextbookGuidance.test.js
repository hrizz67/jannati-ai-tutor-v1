import { describe, expect, it } from 'vitest';
import { getLearningContent } from '../../src/data/learningContent.js';
import { arabSubject } from '../../src/data/subjects/arab.js';

const reviewedTopicIds = [
  'huruf_hijaiyah', 'mufradat', 'nombor_arab', 'warna_arab',
  'keluarga', 'haiwan_arab', 'anggota_badan',
  'ayat_mudah_arab', 'hiwar', 'kefahaman_arab'
];

describe('P1-E3 Arabic Year 2 topic-specific textbook guidance', () => {
  it('has an exact guidance entry for every current Arabic topic', () => {
    const actualIds = arabSubject.topics.map(topic => topic.id).sort();
    expect(actualIds).toEqual([...reviewedTopicIds].sort());
    const signatures = new Set();
    for (const topic of arabSubject.topics) {
      const content = getLearningContent('arab', topic);
      expect(content.learningObjective).toBe(topic.learningObjective || '');
      expect(content.textbook.focus.trim().length).toBeGreaterThan(28);
      expect(content.textbook.activity.trim().length).toBeGreaterThan(28);
      expect(content.textbook.check.trim().length).toBeGreaterThan(28);
      expect(content.textbook.activity).not.toMatch(/baca contoh dan lengkapkan aktiviti buku teks/i);
      expect(content.textbook.focus).not.toMatch(/ikuti fokus topik dalam bab/i);
      expect(JSON.stringify(content.textbook)).not.toMatch(/(?:muka surat|halaman)\s*\d+/i);
      expect(content.source).toBeNull();
      signatures.add(content.textbook.activity);
    }
    expect(signatures.size).toBe(reviewedTopicIds.length);
  });

  it('provides actionable, age-appropriate Arabic reading and dialogue guidance', () => {
    expect(getLearningContent('arab', { id: 'huruf_hijaiyah' }).textbook.activity)
      .toMatch(/titik|baris/i);
    expect(getLearningContent('arab', { id: 'nombor_arab' }).textbook.focus)
      .toMatch(/١.*٢٠/u);
    expect(getLearningContent('arab', { id: 'hiwar' }).textbook.activity)
      .toMatch(/dialog dua orang/i);
    expect(getLearningContent('arab', { id: 'kefahaman_arab' }).textbook.check)
      .toMatch(/bukti perkataan/i);
  });

  it('falls back safely for a missing or unknown Arabic topic without inventing a page number', () => {
    for (const topic of [undefined, { id: 'unknown_2026' }]) {
      const content = getLearningContent('arab', topic);
      expect(content.textbook.focus).toMatch(/topik Bahasa Arab/i);
      expect(content.textbook.activity).toMatch(/latihan/i);
      expect(content.textbook.check).toMatch(/perkataan atau ayat/i);
      expect(JSON.stringify(content.textbook)).not.toMatch(/(?:muka surat|halaman)\s*\d+/i);
      expect(content.source).toBeNull();
    }
  });

  it('preserves existing BM and Mathematics topic guidance and other-subject fallback', () => {
    expect(getLearningContent('bm', { id: 'kata_kerja' }).textbook.activity)
      .toMatch(/padankan gambar dengan kata kerja/i);
    expect(getLearningContent('math', { id: 'darab' }).textbook.activity)
      .toMatch(/tatasusunan/i);
    expect(getLearningContent('islam', { id: 'ibadah' }).textbook.focus)
      .toBe('Ikuti fokus topik dalam bab yang berkaitan.');
  });
});
