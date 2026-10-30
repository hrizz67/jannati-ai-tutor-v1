import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTutorKnowledgeData } from '../../src/ai/coach/knowledge/tutorKnowledgeAdapter.js';
import { getTutorResponse } from '../../src/ai/tutorResponseEngine.js';

const subjectFixtures = [
  {
    label: 'BM', subject: { id: 'bm', title: 'Bahasa Melayu' }, topic: { id: 'kata_nama_am', title: 'Kata Nama Am' },
    question: 'Pilih kata nama orang.', options: ['Ali', 'berlari', 'cantik'], answer: 'Ali',
    hint: 'Cari perkataan yang menamakan orang.',
    firstStep: 'Kenal pasti bahawa soalan meminta kata nama orang.'
  },
  {
    label: 'English', subject: { id: 'english', title: 'English' }, topic: { id: 'nouns', title: 'Nouns' },
    question: 'Choose the person noun.', options: ['teacher', 'runs', 'happy'], answer: 'teacher',
    hint: 'Focus on the key word and the required noun.',
    firstStep: 'Read the complete sentence and find the subject.'
  },
  {
    label: 'Sains', subject: { id: 'sains', title: 'Sains' }, topic: { id: 'haiwan', title: 'Haiwan' },
    question: 'Pilih haiwan yang mempunyai sayap.', options: ['burung', 'ikan', 'kucing'], answer: 'burung',
    hint: 'Fokus pada ciri atau proses untuk topik Haiwan dalam soalan ini.',
    firstStep: 'Kenal pasti benda hidup atau bahan yang disebut.'
  },
  {
    label: 'Arabic', subject: { id: 'arab', title: 'Bahasa Arab' }, topic: { id: 'mufradat', title: 'Mufradat' },
    question: 'Pilih perkataan yang bermaksud buku.', options: ['كِتَابٌ', 'قَلَمٌ', 'مَدْرَسَةٌ'], answer: 'كِتَابٌ',
    hint: 'Baca perkataan Arab dari kanan ke kiri dan cari makna atau bentuk yang diminta dalam soalan.',
    firstStep: 'Kenal pasti perkataan Arab yang diberi.'
  },
  {
    label: 'Mathematics', subject: { id: 'math', title: 'Matematik' }, topic: { id: 'tambah', title: 'Tambah' },
    question: 'Berapakah 2 + 3?', options: ['4', '5', '6'], answer: '5',
    hint: 'Gabungkan nilai mengikut tempat nilai: ratus, puluh dan sa.',
    firstStep: 'Kenal pasti nombor yang hendak ditambah: 2 dan 3.'
  }
];

function makeProfile(studentId, status) {
  const attempts = status === 'mastered' ? 10 : 5;
  const correct = status === 'mastered' ? 10 : 1;
  return {
    studentId,
    name: studentId,
    totals: { questionsAnswered: attempts, correct, wrong: attempts - correct, accuracy: Math.round((correct / attempts) * 100) },
    subjects: {
      bm: {
        subjectId: 'bm',
        title: 'Bahasa Melayu',
        topics: {
          kata_nama_am: {
            topicId: 'kata_nama_am',
            title: 'Kata Nama Am',
            attempts,
            correct,
            wrong: attempts - correct,
            accuracy: Math.round((correct / attempts) * 100),
            confidence: status === 'mastered' ? 95 : 20,
            status
          }
        }
      }
    }
  };
}

async function requestTutor(fixture, overrides = {}) {
  const childId = overrides.childId || 'child-a';
  return getTutorResponse({
    student: overrides.student || { id: childId, studentId: childId, name: 'Murid' },
    subject: fixture.subject,
    topic: fixture.topic,
    question: {
      id: `coach-compat-${fixture.subject.id}`,
      q: fixture.question,
      options: fixture.options,
      answer: fixture.answer,
      acceptedAnswers: [fixture.answer]
    },
    expectedAnswer: fixture.answer,
    acceptedAnswers: [fixture.answer],
    prompt: overrides.prompt || 'Boleh beri petunjuk?',
    intent: overrides.intent || 'hint',
    isCorrect: overrides.isCorrect ?? false,
    conversationKey: `account-a::${childId}::${fixture.subject.id}::${fixture.topic.id}::session::question`,
    history: []
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('Tutor-visible Coach V3 compatibility contract', () => {
  it.each(subjectFixtures)('keeps baseline hint and step behavior for $label', async fixture => {
    const response = await requestTutor(fixture);

    expect(response.sections.hint).toBe(fixture.hint);
    expect(response.sections.steps[0]).toBe(fixture.firstStep);
    expect(response.sections.coachMessage).toBe('Cuba guna petunjuk ini untuk mencari jawapan.');
    expect(response.expectedAnswer).toBe('');
    expect(response.acceptedAnswers).toEqual([]);
    expect(response).not.toHaveProperty('xp');
    expect(response).not.toHaveProperty('coins');
    expect(response).not.toHaveProperty('rewards');
  });

  it.each(subjectFixtures)('keeps guided praise as the Tutor-visible praise for $label', async fixture => {
    const response = await requestTutor(fixture, {
      prompt: fixture.answer,
      intent: 'correct_answer_reinforcement',
      isCorrect: true
    });

    expect(response.praise).toBeTruthy();
    expect(response.sections.coachMessage).toBe(response.praise);
    expect(response.isCorrect).toBe(true);
  });
});

describe('active-child knowledge-profile isolation', () => {
  it('uses only the explicitly supplied active profile and never reads a shared default profile', async () => {
    let storageReads = 0;
    vi.stubGlobal('localStorage', {
      getItem: () => { storageReads += 1; return JSON.stringify(makeProfile('default', 'weak')); },
      setItem: vi.fn(),
      removeItem: vi.fn(),
      key: vi.fn(),
      length: 0
    });

    const mastered = await fetchTutorKnowledgeData({
      subjectId: 'bm',
      topicId: 'kata_nama_am',
      studentId: 'child-a',
      studentProfile: makeProfile('child-a', 'mastered')
    });
    const weak = await fetchTutorKnowledgeData({
      subjectId: 'bm',
      topicId: 'kata_nama_am',
      studentId: 'child-b',
      studentProfile: makeProfile('child-b', 'weak')
    });
    const unscoped = await fetchTutorKnowledgeData({ subjectId: 'bm', topicId: 'kata_nama_am' });

    expect(mastered.simpleExplanation).toContain('Kamu sudah kuat dalam topik ini.');
    expect(weak.simpleExplanation).toContain('Topik ini masih perlukan latihan.');
    expect(unscoped.simpleExplanation).not.toMatch(/sudah kuat|masih perlukan latihan/i);
    expect(storageReads).toBe(0);
  });

  it('keeps child A, child B and child A-again adaptations isolated end to end', async () => {
    const fixture = subjectFixtures[0];
    const childA = makeProfile('child-a', 'mastered');
    const childB = makeProfile('child-b', 'weak');
    const firstA = await requestTutor(fixture, { childId: 'child-a', student: childA, intent: 'question_help', prompt: 'Tolong ajar saya' });
    const responseB = await requestTutor(fixture, { childId: 'child-b', student: childB, intent: 'question_help', prompt: 'Tolong ajar saya' });
    const secondA = await requestTutor(fixture, { childId: 'child-a', student: childA, intent: 'question_help', prompt: 'Tolong ajar saya' });
    const explanations = response => response.sections.pedagogicalContent.explanations.join(' ');

    expect(explanations(firstA)).toContain('Kamu sudah kuat dalam topik ini.');
    expect(explanations(responseB)).toContain('Topik ini masih perlukan latihan.');
    expect(explanations(responseB)).not.toContain('Kamu sudah kuat dalam topik ini.');
    expect(explanations(secondA)).toContain('Kamu sudah kuat dalam topik ini.');
    expect(explanations(secondA)).not.toContain('Topik ini masih perlukan latihan.');
  });
});
