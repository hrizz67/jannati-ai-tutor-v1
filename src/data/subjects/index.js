export const subjectList = [
  {
    "id": "bm",
    "title": "Bahasa Melayu Tahun 2",
    "short": "BM",
    "icon": "📚",
    "color": "green",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "math",
    "title": "Matematik Tahun 2",
    "short": "Math",
    "icon": "📐",
    "color": "blue",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "english",
    "title": "English Year 2",
    "short": "English",
    "icon": "🔤",
    "color": "purple",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "sains",
    "title": "Sains Tahun 2",
    "short": "Sains",
    "icon": "🔬",
    "color": "orange",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "arab",
    "title": "Bahasa Arab Tahun 2",
    "short": "Arab",
    "icon": "🇸🇦",
    "color": "teal",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "islam",
    "title": "Pendidikan Islam Tahun 2",
    "short": "Islam",
    "icon": "☪️",
    "color": "green",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "pj",
    "title": "Pendidikan Jasmani Tahun 2",
    "short": "PJ",
    "icon": "🏃",
    "color": "orange",
    "topicCount": 10,
    "questionCount": 500
  },
  {
    "id": "pk",
    "title": "Pendidikan Kesihatan Tahun 2",
    "short": "PK",
    "icon": "❤️",
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
