import React, { useMemo, useState } from 'react';
import LegacyIconGlyph from './IconGlyph.jsx';
import SubjectBadge from './SubjectBadge.jsx';
import GameBadge from './GameBadge.jsx';
import VoiceButton from './VoiceButton.jsx';
import notaBadge from '../assets/icons/3d/nota-badge.webp';
import bukuTeksBadge from '../assets/icons/3d/buku-teks-badge.webp';
import ganjaranBadge from '../assets/icons/3d/ganjaran-badge.webp';
import checkBadge from '../assets/icons/3d/check-badge.webp';
import tutorAiBadge from '../assets/icons/3d/tutor-ai-badge.webp';
import targetBadge from '../assets/icons/3d/target-badge.webp';
import { formatSubjectName, formatTopicName } from '../utils/displayFormatter';
import { getLearningContent } from '../data/learningContent.js';

function IconGlyph({ name, ...props }) {
  const badge = name === 'check' ? checkBadge : name === 'bot' ? tutorAiBadge : name === 'chevronRight' ? targetBadge : name === 'play' || name === 'spark' ? ganjaranBadge : bukuTeksBadge;
  return <GameBadge className="learning-hub-inline-badge" src={badge} {...props} />;
}

function languageForSubject(subjectId = '') {
  if (subjectId === 'english') return 'en-US';
  if (subjectId === 'arab') return 'ar-SA';
  return 'ms-MY';
}

function topicSummary(topic, subjectId) {
  return getLearningContent(subjectId, topic).keyPoints[0] || topic?.note || 'Baca penerangan ringkas sebelum mencuba latihan.';
}

export default function LearningHub({ selectedSubject, allSubjects = [], profile = {}, onStartTopic, onOpenAi, activeMode, onModeChange }) {
  const [mode, setMode] = useState('nota');
  const [subjectId, setSubjectId] = useState(selectedSubject?.id || allSubjects[0]?.id || '');
  const [topicId, setTopicId] = useState('');
  const [readTopics, setReadTopics] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jannati_learning_notes_v1') || '{}'); } catch { return {}; }
  });
  const subject = allSubjects.find(item => item.id === subjectId) || selectedSubject;
  const topics = subject?.topics || [];
  const activeTopic = topics.find(item => item.id === topicId) || topics[0];
  const activeContent = getLearningContent(subject?.id, activeTopic);
  const visibleMode = activeMode || mode;
  const isTextbookMode = visibleMode === 'buku';
  const startTopicForCurrentSubject = item => item && onStartTopic?.(item, subject);

  function selectMode(nextMode) {
    setMode(nextMode);
    onModeChange?.(nextMode);
  }
  const recentTopics = useMemo(() => (profile.history || []).filter(item => item.topic).slice(0, 3), [profile.history]);
  const reviewTopics = useMemo(() => topics.filter(item => {
    const best = profile.progress?.[`${subject?.id}_${item.id}`]?.best || 0;
    return best < 80 || !readTopics[`${subject?.id}_${item.id}`];
  }).slice(0, 4), [topics, profile.progress, readTopics, subject?.id]);

  function chooseSubject(nextId) {
    setSubjectId(nextId);
    setTopicId('');
  }

  function markRead(item) {
    if (!item?.id || !subject?.id) return;
    const key = `${subject.id}_${item.id}`;
    const next = { ...readTopics, [key]: true };
    setReadTopics(next);
    try { localStorage.setItem('jannati_learning_notes_v1', JSON.stringify(next)); } catch { /* storage is optional */ }
  }

  return <section id="learning-hub-section" className="card learning-hub-card" aria-labelledby="learning-hub-title">
    <div className="learning-hub-heading">
      <div><p className="eyebrow">Pusat Belajar V3.2</p><h2 id="learning-hub-title">Nota & Buku Teks</h2><p>Belajar dahulu, kemudian ulang kaji dan cuba latihan.</p></div>
      <span className="learning-hub-orbit" aria-hidden="true"><GameBadge className="learning-hub-orbit-badge" src={bukuTeksBadge} /></span>
    </div>
    <div className="learning-hub-tabs" role="tablist" aria-label="Jenis bahan pembelajaran">
      <button type="button" role="tab" aria-selected={visibleMode === 'nota'} className={visibleMode === 'nota' ? '' : 'secondary'} onClick={() => selectMode('nota')}><GameBadge className="learning-hub-tab-badge" src={notaBadge} /> Nota ringkas</button>
      <button type="button" role="tab" aria-selected={visibleMode === 'buku'} className={visibleMode === 'buku' ? '' : 'secondary'} onClick={() => selectMode('buku')}><GameBadge className="learning-hub-tab-badge" src={bukuTeksBadge} /> Buku teks</button>
      <button type="button" role="tab" aria-selected={visibleMode === 'ulang'} className={visibleMode === 'ulang' ? '' : 'secondary'} onClick={() => selectMode('ulang')}><GameBadge className="learning-hub-tab-badge" src={ganjaranBadge} /> Ulang kaji</button>
    </div>
    <div className="learning-hub-subjects" aria-label="Pilih subjek untuk belajar">
      {allSubjects.map(item => <button key={item.id} type="button" className={item.id === subject?.id ? 'active' : ''} aria-pressed={item.id === subject?.id} onClick={() => chooseSubject(item.id)}><SubjectBadge className="learning-hub-subject-badge" subjectId={item.id} />{formatSubjectName(item.title || item.id)}</button>)}
    </div>
    {visibleMode === 'ulang' ? <div className="learning-hub-review-panel">
      <div className="learning-hub-review"><div className="learning-hub-review-icon"><GameBadge className="learning-hub-action-badge" src={ganjaranBadge} /></div><div><h3>Ulang kaji ikut kemajuan</h3><p>{recentTopics.length ? 'Semak semula topik yang sedang dipelajari dan topik yang belum kukuh.' : 'Baca satu nota dahulu, kemudian cuba latihan untuk membina rekod kemajuan.'}</p></div></div>
       <div className="learning-hub-review-grid">{reviewTopics.length ? reviewTopics.map(item => <article className="learning-hub-review-card" key={item.id}><span className="eyebrow">{readTopics[`${subject?.id}_${item.id}`] ? 'Nota dibaca' : 'Perlu semak'}</span><h3>{formatTopicName(item.title)}</h3><p>{topicSummary(item, subject?.id)}</p><div className="actions"><button type="button" onClick={() => { setTopicId(item.id); setMode('nota'); }} className="secondary">Buka Nota</button><button type="button" onClick={() => startTopicForCurrentSubject(item)}>Latih</button></div></article>) : <div className="learning-hub-empty"><GameBadge className="learning-hub-action-badge" src={checkBadge} /><b>Semua topik nampak stabil.</b><p>Teruskan belajar topik baharu untuk kekalkan momentum.</p></div>}</div>
    </div> : <div className="learning-hub-content">
      <div className="learning-hub-topic-list">
        <div className="learning-hub-list-label">Topik {formatSubjectName(subject?.title || subject?.id)}</div>
        {topics.map(item => <button key={item.id} type="button" className={item.id === activeTopic?.id ? 'active' : ''} onClick={() => setTopicId(item.id)}><span><b>{formatTopicName(item.title)}</b><small>{topicSummary(item, subject?.id).slice(0, 72)}{topicSummary(item, subject?.id).length > 72 ? '…' : ''}</small></span><IconGlyph name="chevronRight" /></button>)}
      </div>
      <article className="learning-hub-note">
        <div className="learning-hub-note-top"><span className="badge"><SubjectBadge className="learning-hub-note-badge" subjectId={subject?.id} /> {isTextbookMode ? 'Panduan buku teks' : 'Nota mudah'}</span><VoiceButton text={`${activeTopic?.title || ''}. ${isTextbookMode ? 'Gunakan buku teks untuk mengikuti susunan bab dan aktiviti pembelajaran.' : topicSummary(activeTopic, subject?.id)}. ${activeContent.keyPoints.join('. ')}`} lang={languageForSubject(subject?.id)} label={isTextbookMode ? 'Baca panduan' : 'Baca nota'} title={isTextbookMode ? 'Baca panduan buku teks' : 'Baca nota'} className="secondary" /></div>
        <p className="eyebrow">{formatTopicName(activeTopic?.title || 'Pilih topik')}</p>
        {isTextbookMode ? <>
          <h3>Gunakan Buku Teks Dengan Betul</h3>
          <p>Rujuk buku teks untuk mengikuti susunan bab dan aktiviti pembelajaran. Nota ringkas di tab sebelah membantu kamu memahami isi sebelum membaca bahan asal.</p>
          <div className="learning-hub-study-grid learning-hub-textbook-grid">
            <article className="learning-hub-study-card learning-hub-study-card--green"><span className="learning-hub-study-number">FOKUS</span><b>Apa yang dipelajari?</b><p>{activeContent.textbook.focus}</p></article>
            <article className="learning-hub-study-card learning-hub-study-card--yellow"><span className="learning-hub-study-number">AKTIVITI</span><b>Cuba dalam buku teks</b><p>{activeContent.textbook.activity}</p></article>
            <article className="learning-hub-study-card learning-hub-study-card--blue"><span className="learning-hub-study-number">SEMAK</span><b>Selepas membaca</b><p>{activeContent.textbook.check}</p></article>
          </div>
          <div className="learning-hub-method"><span className="learning-hub-method-icon"><IconGlyph name="library" motion="pulse" /></span><div><b>Panduan rujukan</b><span>Nota Jannati = faham cepat · Buku teks KPM = rujukan dan aktiviti rasmi</span></div></div>
          {activeContent.source && <div className="learning-hub-sources"><b>Rujukan rasmi</b><span>Gunakan pautan ini untuk semakan kurikulum dan akses portal buku teks KPM. Kandungan buku teks tidak disalin ke dalam aplikasi.</span><div><a href={activeContent.source.curriculumUrl} target="_blank" rel="noreferrer">{activeContent.source.curriculumLabel}</a><a href={activeContent.source.textbookUrl} target="_blank" rel="noreferrer">{activeContent.source.textbookLabel}</a></div></div>}
        </> : <>
          <h3>Nota {formatTopicName(activeTopic?.title || 'topik ini')}</h3>
          <p>{topicSummary(activeTopic, subject?.id)}</p>
          <ul className="learning-hub-key-points">{activeContent.keyPoints.map(point => <li key={point}>{point}</li>)}</ul>
          <div className="learning-hub-study-grid">
            <article className="learning-hub-study-card learning-hub-study-card--green"><span className="learning-hub-study-number">01</span><b>Apa yang perlu tahu?</b><p>{activeContent.keyPoints[0]}</p></article>
            <article className="learning-hub-study-card learning-hub-study-card--yellow"><span className="learning-hub-study-number">02</span><b>Contoh mudah</b><p>{activeContent.example}</p></article>
            <article className="learning-hub-study-card learning-hub-study-card--blue"><span className="learning-hub-study-number">03</span><b>Cara ulang kaji</b><p>{activeContent.review}</p></article>
          </div>
          <div className="learning-hub-method"><span className="learning-hub-method-icon"><IconGlyph name="spark" motion="pulse" /></span><div><b>Kaedah Janna</b><span>Kenal pasti → Faham maksud → Cuba satu soalan</span></div></div>
          {activeTopic?.questions?.[0] && <div className="learning-hub-example"><b>Contoh</b><span>{activeTopic.questions[0].q}</span><small>{activeContent.review}</small></div>}
        </>}
         <div className="actions"><button type="button" onClick={() => startTopicForCurrentSubject(activeTopic)} disabled={!activeTopic}><IconGlyph name="play" /> Latih topik ini</button><button type="button" className="secondary" onClick={() => markRead(activeTopic)} disabled={!activeTopic || readTopics[`${subject?.id}_${activeTopic?.id}`]}><IconGlyph name="check" /> {readTopics[`${subject?.id}_${activeTopic?.id}`] ? (isTextbookMode ? 'Sudah disemak' : 'Sudah dibaca') : (isTextbookMode ? 'Tanda sudah semak' : 'Tanda sudah baca')}</button>{onOpenAi && <button type="button" className="secondary" onClick={onOpenAi}><IconGlyph name="bot" /> Tanya Janna</button>}</div>
      </article>
    </div>}
  </section>;
}
