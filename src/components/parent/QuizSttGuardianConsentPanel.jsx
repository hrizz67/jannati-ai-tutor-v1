import React, { useEffect, useState } from 'react';
import {
  grantQuizSttGuardianConsent,
  getQuizSttGuardianConsent,
  setQuizSttGuardianConsent
} from '../../services/quizSttGuardianConsent.js';

export default function QuizSttGuardianConsentPanel({ hasAccountSession, childId, childName = 'murid' }) {
  const [consent, setConsent] = useState({ status: 'loading', granted: false, eligible: false });
  const [acknowledged, setAcknowledged] = useState(false);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let current = true;
    setAcknowledged(false);
    setPassword('');
    setConsent({ status: 'loading', granted: false, eligible: false });
    if (!hasAccountSession || !childId) {
      setConsent({ status: 'unavailable', granted: false, eligible: false });
      return () => { current = false; };
    }
    void getQuizSttGuardianConsent(childId).then(result => {
      if (current) setConsent(result);
    });
    return () => { current = false; };
  }, [hasAccountSession, childId]);

  async function updateConsent(granted) {
    if (saving || (granted && (!acknowledged || !password))) return;
    setSaving(true);
    const result = granted
      ? await grantQuizSttGuardianConsent({ childId, password })
      : await setQuizSttGuardianConsent({ childId, granted: false });
    setConsent(result);
    setAcknowledged(false);
    setPassword('');
    setSaving(false);
  }

  const statusMessage = consent.status === 'loading'
    ? 'Menyemak persetujuan rakaman suara...'
    : consent.granted
      ? `Persetujuan rakaman suara untuk ${childName} sedang aktif.`
      : consent.status === 'revoked'
        ? `Persetujuan rakaman suara untuk ${childName} telah ditarik balik.`
        : consent.status === 'child-not-found'
          ? 'Profil anak belum tersedia dalam rekod cloud. Sync data dahulu dan cuba semula.'
          : consent.status === 'unavailable'
            ? 'Status persetujuan belum dapat disahkan. Rakaman suara kekal disekat.'
            : `Belum ada persetujuan rakaman suara untuk ${childName}.`;

  return (
    <section className="card quiz-stt-guardian-consent-panel print-hide" data-parent-section="quiz-stt-consent" aria-labelledby="quiz-stt-consent-title">
      <p className="eyebrow">Privasi Suara</p>
      <h2 id="quiz-stt-consent-title">Persetujuan penjaga untuk mikrofon kuiz</h2>
      <p>Jika dibenarkan, satu rakaman jawapan pendek akan dihantar kepada Cloudflare Workers AI untuk ditukar kepada teks. Audio diproses sementara, tidak disimpan oleh Jannati dan tidak dimasukkan ke rekod persetujuan.</p>
      <p>Transkrip dipaparkan untuk disemak dan boleh diedit. Murid masih boleh menaip, dan Jannati tidak menanda jawapan secara automatik daripada suara.</p>
      <p className="autosave-note" role="status" aria-live="polite">{statusMessage}</p>
      {consent.granted ? (
        <button type="button" className="secondary" disabled={saving} onClick={() => updateConsent(false)}>
          {saving ? 'Menyimpan...' : 'Tarik balik persetujuan'}
        </button>
      ) : (
        <>
          <label className="quiz-speech-consent-check">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={saving || consent.status === 'loading' || consent.status === 'unavailable' || consent.status === 'child-not-found'}
              onChange={event => setAcknowledged(event.target.checked)}
            />
            <span>Saya ialah ibu bapa atau penjaga sah bagi murid ini. Saya memahami notis di atas dan membenarkan penggunaan rakaman pendek untuk transkripsi kuiz.</span>
          </label>
          <label htmlFor="quiz-stt-guardian-password">Sahkan dengan kata laluan akaun ibu bapa</label>
          <input
            id="quiz-stt-guardian-password"
            name="quiz-stt-guardian-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            disabled={saving || !acknowledged}
            aria-describedby="quiz-stt-guardian-password-help"
            required
          />
          <small id="quiz-stt-guardian-password-help">Kata laluan disahkan terus oleh perkhidmatan akaun dan tidak disimpan dalam rekod persetujuan.</small>
          <button
            type="button"
            disabled={!acknowledged || !password || saving || consent.status === 'loading' || consent.status === 'unavailable' || consent.status === 'child-not-found'}
            onClick={() => updateConsent(true)}
          >
            {saving ? 'Menyimpan...' : 'Beri persetujuan'}
          </button>
        </>
      )}
    </section>
  );
}
