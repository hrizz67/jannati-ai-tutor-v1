import { normalizeTopicContent } from '../contentSchema.js';

export const subjectList = [
  {
    "id": "bm",
    "title": "Bahasa Melayu Tahun 2",
    "short": "BM",
    "icon": "\u{1F4DA}",
    "color": "green",
    "topicCount": 14,
    "questionCount": 930
  },
  {
    "id": "math",
    "title": "Matematik Tahun 2",
    "short": "Math",
    "icon": "\u{1F4D0}",
    "color": "blue",
    "topicCount": 10,
    "questionCount": 800
  },
  {
    "id": "english",
    "title": "English Year 2",
    "short": "English",
    "icon": "\u{1F524}",
    "color": "purple",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "sains",
    "title": "Sains Tahun 2",
    "short": "Sains",
    "icon": "\u{1F52C}",
    "color": "orange",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "arab",
    "title": "Bahasa Arab Tahun 2",
    "short": "Arab",
    "icon": "\u{1F1F8}\u{1F1E6}",
    "color": "teal",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "islam",
    "title": "Pendidikan Islam Tahun 2",
    "short": "Islam",
    "icon": "\u{262A}\u{FE0F}",
    "color": "green",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "pj",
    "title": "Pendidikan Jasmani Tahun 2",
    "short": "PJ",
    "icon": "\u{1F3C3}",
    "color": "orange",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "pk",
    "title": "Pendidikan Kesihatan Tahun 2",
    "short": "PK",
    "icon": "\u{2764}\u{FE0F}",
    "color": "red",
    "topicCount": 10,
    "questionCount": 500
  }
];

export async function loadSubjectData(subjectId) {
  let subjectModule;
  switch (subjectId) {
    case 'bm':
      subjectModule = await import('./bm.js');
      break;
    case 'math':
      subjectModule = await import('./math.js');
      break;
    case 'english':
      subjectModule = await import('./english.js');
      break;
    case 'sains':
      subjectModule = await import('./sains.js');
      break;
    case 'arab':
      subjectModule = await import('./arab.js');
      break;
    case 'islam':
      subjectModule = await import('./islam.js');
      break;
    case 'pj':
      subjectModule = await import('./pj.js');
      break;
    case 'pk':
      subjectModule = await import('./pk.js');
      break;
    default:
      subjectModule = await import('./bm.js');
      break;
  }
  return normalizeSubjectQuestionFields(subjectModule.default);
}

function normalizeSubjectQuestionFields(subject = {}) {
  const isYearTwoSubject = /(?:Tahun|Year)\s*2\b/i.test(String(subject.title || ''));
  return {
    ...subject,
    topics: (subject.topics || []).map(topic => {
      const normalizedTopic = normalizeTopicContent(topic);
      return {
        ...normalizedTopic,
        title: isYearTwoSubject
          ? String(normalizedTopic.title || '').replace(/\bUASA\b/gi, 'Pentaksiran Sumatif')
          : normalizedTopic.title,
        questions: normalizedTopic.questions.map(question => {
        const canonical = String(question.q ?? question.question ?? '').trim();
        const hasUasaLabel = /\bUASA\b/i.test(String(question.uasa || ''));
        const hasUasaAssessment = /\bUASA\b/i.test(String(question.assessment || ''));
        return {
          ...question,
          q: canonical,
          question: canonical,
          uasa: isYearTwoSubject && hasUasaLabel ? 'PBD Sumatif' : question.uasa,
          assessment: isYearTwoSubject && hasUasaAssessment ? 'PBD Sumatif' : question.assessment
        };
      })
      };
    })
  };
}

export async function loadAllSubjects() {
  const loaded = await Promise.all(subjectList.map(item => loadSubjectData(item.id)));
  return loaded;
}
