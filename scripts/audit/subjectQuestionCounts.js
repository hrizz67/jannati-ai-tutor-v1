const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

async function run() {
  const modulePath = path.resolve('src/data/subjects/index.js');
  const subjectsModule = await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);
  const subjects = await subjectsModule.loadAllSubjects();

  for (const subject of subjects) {
    const total = (subject.topics || []).reduce((sum, topic) => {
      return sum + ((topic.questions || []).length);
    }, 0);
    console.log(`${subject.id}: ${total}`);
  }
}

run().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
