export const subjectList = [
  {
    "id": "bm",
    "title": "Bahasa Melayu Tahun 2",
    "short": "BM",
    "icon": "\u{1F4DA}",
    "color": "green",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "math",
    "title": "Matematik Tahun 2",
    "short": "Math",
    "icon": "\u{1F4D0}",
    "color": "blue",
    "topicCount": 10,
    "questionCount": 500
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
  switch (subjectId) {
    case 'bm':
      return (await import('./bm.js')).default;
    case 'math':
      return (await import('./math.js')).default;
    case 'english':
      return (await import('./english.js')).default;
    case 'sains':
      return (await import('./sains.js')).default;
    case 'arab':
      return (await import('./arab.js')).default;
    case 'islam':
      return (await import('./islam.js')).default;
    case 'pj':
      return (await import('./pj.js')).default;
    case 'pk':
      return (await import('./pk.js')).default;
    default:
      return (await import('./bm.js')).default;
  }
}

export async function loadAllSubjects() {
  const loaded = await Promise.all(subjectList.map(item => loadSubjectData(item.id)));
  return loaded;
}
