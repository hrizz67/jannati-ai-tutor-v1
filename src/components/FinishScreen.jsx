import React from 'react';
import MascotCard from './MascotCard.jsx';
import VoiceButton from './VoiceButton.jsx';
import IconGlyph from './IconGlyph.jsx';
import { PERSONALITY_MESSAGES } from '../brand/personalities.js';
import { clampPercent, formatStatus, formatTopicName } from '../utils/displayFormatter.js';

function topicName(topic = {}, fallback = '-') {
  const label = formatTopicName(topic?.title || topic?.topicId || topic?.id || '');
  return label && label.trim() ? label : fallback;
}

function earnedStarCount(value) {
  const text = String(value ?? '').replace(/\s+/g, '').trim();
  if (/^[★☆]+$/.test(text)) return Math.min(3, (text.match(/★/g) || []).length);
  const numeric = Number(text);
  if (Number.isFinite(numeric)) {
    const score = clampPercent(numeric);
    return score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;
  }
  return Math.min(3, (text.match(/[★⭐]/g) || []).length);
}

export default function FinishScreen({
  profile = {},
  session = {},
  topic = null,
  nextTopic = null,
  aiSummary = {},
  personality = null,
  voiceSummaryText = '',
  onDashboard,
  onRetry,
  onNextTopic,
  onOpenAi
}) {
  const scorePercent = clampPercent(session.percent);
  const passed = scorePercent >= 80;
  const stars = Math.max(earnedStarCount(session.stars), earnedStarCount(scorePercent));
  const finishMessage = passed ? PERSONALITY_MESSAGES.completed : PERSONALITY_MESSAGES.retry;
  const journeySummary = personality?.journeySummary || aiSummary?.journeySummary || '';
  const weakestTopic = aiSummary?.weakestTopic || null;
  const readiness = formatStatus(aiSummary?.readinessLevel || 'needs_support');
  const summaryCards = [
    {
      label: 'Topik untuk diulang',
      value: weakestTopic ? topicName(weakestTopic, 'Belum dikenal pasti') : 'Belum dikenal pasti',
      icon: 'target'
    },
    {
      label: 'Cadangan Janna',
      value: aiSummary?.studyRecommendation || 'Ulang satu topik dan cuba semula.',
      icon: 'lightbulb'
    },
    {
      label: 'Kesediaan belajar',
      value: readiness,
      icon: readiness === 'Perlu Sokongan' ? 'clock' : 'check'
    }
  ];
  const rewardCards = [
    { label: 'Bintang', value: `${stars}/3`, icon: 'star' },
    { label: 'XP sesi', value: Number(session.xp) || 0, icon: 'gift' },
    { label: 'Streak', value: Number(profile?.streak) || 0, icon: 'fire' }
  ];
  const primaryAction = passed && nextTopic ? onNextTopic : onRetry;
  const primaryLabel = passed && nextTopic ? 'Teruskan Belajar' : 'Cuba Lagi';
  const primaryIcon = passed && nextTopic ? 'play' : 'repeat';

  return <main className="app reward-page">
    <section className="card finish reward-card" aria-labelledby="finish-title">
      <MascotCard
        character="janna"
        mood={personality?.emotion?.label || (passed ? 'celebrating' : 'encouraging')}
        size="lg"
        animation="bounce"
        message={personality?.achievementMessage || finishMessage}
      />

      <header className="finish-heading">
        <p className="eyebrow">{topicName(topic, 'Latihan Selesai')}</p>
        <h1 id="finish-title">{passed ? 'Latihan selesai!' : 'Tak mengapa. Kita cuba lagi.'}</h1>
        <p>{passed ? 'Bagus! Lihat ringkasan pencapaian kamu.' : 'Semak topik yang perlu diperkuat, kemudian cuba semula.'}</p>
        {journeySummary && <p className="memory-last">{journeySummary}</p>}
        <VoiceButton
          text={voiceSummaryText || journeySummary || personality?.farewell || personality?.achievementMessage || ''}
          label="Baca Ringkasan"
          title="Baca ringkasan akhir"
          className="voice-inline finish-voice-button"
        />
      </header>

      <div className="finish-score-hero" aria-label={`Markah latihan ${scorePercent} peratus, ${stars} daripada 3 bintang`}>
        <IconGlyph name={passed ? 'trophy' : 'target'} className="finish-score-icon" title={passed ? 'Piala latihan' : 'Sasaran latihan'} motion="celebrate" />
        <div>
          <span>Markah latihan</span>
          <b>{scorePercent}%</b>
          <small>{stars} daripada 3 bintang</small>
        </div>
      </div>

      <div className="finish-rewards" aria-label="Ganjaran sesi ini">
        {rewardCards.map(card => <div key={card.label}>
          <IconGlyph name={card.icon} className="finish-reward-icon" decorative />
          <b>{card.value}</b>
          <span>{card.label}</span>
        </div>)}
      </div>

      <div className="finish-summary-grid" aria-label="Cadangan pembelajaran seterusnya">
        {summaryCards.map(card => <article className="finish-summary-card" key={card.label}>
          <IconGlyph name={card.icon} className="finish-summary-icon" decorative />
          <span>{card.label}</span>
          <b>{card.value}</b>
        </article>)}
      </div>

      <div className="actions finish-actions">
        <button type="button" onClick={primaryAction}><IconGlyph name={primaryIcon} decorative /> <span>{primaryLabel}</span></button>
        <button type="button" className="secondary" onClick={onDashboard}><IconGlyph name="home" decorative /> <span>Papan Utama</span></button>
        <button type="button" className="secondary" onClick={onOpenAi}><IconGlyph name="bot" decorative /> <span>Tanya Guru AI</span></button>
      </div>
    </section>
  </main>;
}
