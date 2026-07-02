export const curriculumPrerequisites = {
  bm: {
    kata_nama_khas: ['kata_nama_am'],
    kata_ganti_nama: ['kata_nama_am', 'kata_nama_khas'],
    kata_kerja: ['kata_ganti_nama'],
    kata_adjektif: ['kata_kerja'],
    kata_sendi: ['kata_adjektif'],
    kata_hubung: ['kata_sendi'],
    penjodoh_bilangan: ['kata_hubung'],
    ayat: ['kata_kerja', 'kata_hubung'],
    pemahaman_penulisan: ['ayat']
  }
};

export function buildSequentialPrerequisites(subject = {}) {
  return (subject.topics || []).reduce((graph, topic, index, topics) => {
    graph[topic.id] = index === 0 ? [] : [topics[index - 1].id];
    return graph;
  }, {});
}

export function getSubjectPrerequisites(subject = {}) {
  return {
    ...buildSequentialPrerequisites(subject),
    ...(curriculumPrerequisites[subject.id] || {})
  };
}
