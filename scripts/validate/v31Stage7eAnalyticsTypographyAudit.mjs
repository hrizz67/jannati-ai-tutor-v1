import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const repoRoot = process.cwd();
const cssPath = path.join(repoRoot, 'src/styles/style.css');
const analyticsPath = path.join(repoRoot, 'src/dashboard/AnalyticsDashboard.jsx');
const parentPath = path.join(repoRoot, 'src/dashboard/ParentDashboard.jsx');
const homePath = path.join(repoRoot, 'src/dashboard/HomeDashboard.jsx');
const metricCardPath = path.join(repoRoot, 'src/components/MetricCard.jsx');
const coveragePath = path.join(repoRoot, 'src/curriculum/coverageEngine.js');

const css = fs.readFileSync(cssPath, 'utf8');
const analyticsSource = fs.readFileSync(analyticsPath, 'utf8');
const parentSource = fs.readFileSync(parentPath, 'utf8');
const homeSource = fs.readFileSync(homePath, 'utf8');
const metricCardSource = fs.readFileSync(metricCardPath, 'utf8');

const { buildCurriculumCoverage, getCurriculumCoverageState } = await import(pathToFileURL(coveragePath).href);

const failures = [];
const passes = [];

function expect(condition, message) {
  if (!condition) {
    failures.push(message);
    return;
  }
  passes.push(message);
}

function fixtureSubject({ explicitSecondTopic = true, attemptsFirst = 1, bestFirst = 80, attemptsSecond = 1, bestSecond = 60 } = {}) {
  return [{
    id: 'fixture_subject',
    short: 'FX',
    title: 'Subjek Fixture',
    topics: [
      {
        id: 'kata_nama',
        title: 'Kata Nama',
        SK: 'BM.SK.1',
        SP: 'BM.SP.1.1',
        questions: [
          { id: 'BM-001', difficulty: 'mudah', estimatedTime: 60 }
        ]
      },
      {
        id: 'kata_kerja',
        title: 'Kata Kerja',
        ...(explicitSecondTopic ? { SK: 'BM.SK.2', SP: 'BM.SP.2.1' } : {}),
        questions: [
          { id: 'BM-002', difficulty: 'mudah', estimatedTime: 60 }
        ]
      }
    ]
  }];
}

function fixtureProfile({ attemptsFirst = 1, bestFirst = 80, attemptsSecond = 1, bestSecond = 60 } = {}) {
  return {
    progress: {
      fixture_subject_kata_nama: { attempts: attemptsFirst, best: bestFirst },
      fixture_subject_kata_kerja: { attempts: attemptsSecond, best: bestSecond }
    }
  };
}

const coverageAvailable = buildCurriculumCoverage(
  fixtureProfile({ attemptsFirst: 2, bestFirst: 90, attemptsSecond: 2, bestSecond: 85 }),
  fixtureSubject({ explicitSecondTopic: true })
);
const stateAvailable = getCurriculumCoverageState(coverageAvailable.summary);

const coveragePartial = buildCurriculumCoverage(
  fixtureProfile({ attemptsFirst: 2, bestFirst: 80, attemptsSecond: 1, bestSecond: 50 }),
  fixtureSubject({ explicitSecondTopic: false })
);
const statePartial = getCurriculumCoverageState(coveragePartial.summary);

const coverageNoEvidence = buildCurriculumCoverage(
  fixtureProfile({ attemptsFirst: 0, bestFirst: 0, attemptsSecond: 0, bestSecond: 0 }),
  fixtureSubject({ explicitSecondTopic: true })
);
const stateNoEvidence = getCurriculumCoverageState(coverageNoEvidence.summary);

const coverageNoMapping = buildCurriculumCoverage(
  fixtureProfile({ attemptsFirst: 2, bestFirst: 60, attemptsSecond: 1, bestSecond: 40 }),
  fixtureSubject({ explicitSecondTopic: false }).map(subject => ({
    ...subject,
    topics: subject.topics.map(topic => {
      const { SK, SP, ...rest } = topic;
      return rest;
    })
  }))
);
const stateNoMapping = getCurriculumCoverageState(coverageNoMapping.summary);

const coverageMeasuredZero = buildCurriculumCoverage(
  fixtureProfile({ attemptsFirst: 1, bestFirst: 0, attemptsSecond: 1, bestSecond: 0 }),
  fixtureSubject({ explicitSecondTopic: true })
);
const stateMeasuredZero = getCurriculumCoverageState(coverageMeasuredZero.summary);

expect(/font-size:\s*clamp\(1\.35rem,\s*7vw,\s*2rem\)/.test(css), 'Metric values use responsive mobile clamp sizing');
expect(/\.metric-card-label[\s\S]*?font-size:\s*clamp\(\.85rem,\s*3\.7vw,\s*1rem\)/.test(css), 'Metric labels use restrained responsive mobile sizing');
expect(!/word-break:\s*break-all/.test(css), 'Mobile text wrapping avoids break-all rules');
expect(/overflow-wrap:\s*break-word;[\s\S]*?word-break:\s*normal;/.test(css), 'Title and label text wrap at natural word boundaries');
expect(/@media \(max-width: 650px\)[\s\S]*?\.metric-card,\s*\.stat,\s*\.report-box,\s*\.mastery-summary-grid > div \{[\s\S]*?min-height:\s*auto;/.test(css), 'Metric cards no longer rely on fixed mobile heights');
expect(/className="metric-card-label"/.test(metricCardSource) && /className={`metric-card-value/.test(metricCardSource), 'Metric cards render both labels and values explicitly');
expect(/label=\"Tahap\" subtitle=/.test(parentSource), 'Parent readiness status stays grouped with its label and explanation');
expect(/\.parent-topic-item \{[\s\S]*?display:\s*grid;/.test(css), 'Focus topic rows use compact stacked layout on mobile');
expect(/\.metric-card-label[\s\S]*?color:\s*#28473a;/.test(css), 'Metric labels use readable contrast on light cards');
expect(/curriculum-coverage-state/.test(analyticsSource) && /coverageState\.state === 'available' \|\| coverageState\.state === 'partial'/.test(analyticsSource), 'Analytics dashboard uses one intentional curriculum no-data state');
expect(/curriculum-coverage-state/.test(homeSource) && /curriculumCoverageState\.state === 'available' \|\| curriculumCoverageState\.state === 'partial'/.test(homeSource), 'Home dashboard shares the curriculum no-data contract');
expect(stateNoMapping.state === 'no-mapping' && stateNoMapping.metrics.length === 0 && stateNoMapping.message === 'Data liputan kurikulum belum tersedia untuk subjek ini.', 'DSKP no-mapping fixture renders one no-mapping state with no zero metrics');
expect(stateNoEvidence.state === 'no-evidence' && stateNoEvidence.metrics.length === 0 && stateNoEvidence.message === 'Belum ada data latihan yang mencukupi untuk mengira liputan.', 'DSKP no-evidence fixture renders one no-evidence state with no zero metrics');
expect(stateMeasuredZero.state === 'available' && stateMeasuredZero.hasMeasuredZero && stateMeasuredZero.metrics[1]?.value === '0%', 'Evidence-backed 0% curriculum coverage remains visible as a genuine zero');
expect(statePartial.state === 'partial' && statePartial.metrics.every(metric => metric.label && metric.value !== undefined), 'Partial curriculum mapping exposes only explicit reliable metrics');
expect(stateAvailable.state === 'available' && coverageAvailable.summary.coveragePercent === 100 && coverageAvailable.summary.masteryPercent === 100, 'Evidence-backed curriculum calculations remain unchanged for fully mapped fixtures');
expect(coveragePartial.summary.coveragePercent === 100 && coveragePartial.summary.masteryPercent === 50, 'Evidence-backed curriculum calculations remain unchanged for partial fixtures');
expect(!/safeText\(weakestSubject\?\.label,\s*'-'\)/.test(parentSource) && !/safeText\(strongestSubject\?\.label,\s*'-'\)/.test(parentSource), 'Parent dashboard no longer uses dash-only metric cards for focus summaries');

if (failures.length) {
  console.error('Stage 7E analytics typography audit FAILED');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Stage 7E analytics typography audit PASS');
for (const pass of passes) {
  console.log(`- ${pass}`);
}
