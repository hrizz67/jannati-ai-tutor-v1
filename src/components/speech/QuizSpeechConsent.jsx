import React, { useEffect, useRef, useState } from 'react';

export default function QuizSpeechConsent({ open, onConfirm, onDecline }) {
  const [confirmedByAdult, setConfirmedByAdult] = useState(false);
  const headingRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    headingRef.current?.focus();
    const closeOnEscape = event => {
      if (event.key === 'Escape') onDecline();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, onDecline]);

  if (!open) return null;
  return <div className="quiz-speech-consent-backdrop">
    <section className="quiz-speech-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="quiz-speech-consent-title" aria-describedby="quiz-speech-consent-description">
      <h2 id="quiz-speech-consent-title" ref={headingRef} tabIndex="-1">Kebenaran rakaman suara</h2>
      <div id="quiz-speech-consent-description">
        <p>Jannati akan merakam jawapan pendek hanya selepas butang mula ditekan, kemudian menghantarnya kepada Cloudflare Workers AI untuk menghasilkan teks yang boleh disemak.</p>
        <p>Audio diproses sementara dan tidak disimpan oleh Jannati atau dimasukkan ke rekod persetujuan. Kamu masih boleh memilih untuk menaip jawapan.</p>
        <p>Persetujuan penjaga untuk profil murid ini telah disahkan melalui Kawasan Ibu Bapa. Persetujuan itu boleh ditarik balik pada bila-bila masa.</p>
      </div>
      <label className="quiz-speech-consent-check">
        <input type="checkbox" checked={confirmedByAdult} onChange={event => setConfirmedByAdult(event.target.checked)} />
        <span>Saya bersetuju untuk menghantar satu rakaman audio pendek ini bagi ditukar kepada teks.</span>
      </label>
      <div className="actions">
        <button type="button" onClick={onConfirm} disabled={!confirmedByAdult}>Benarkan dan mula</button>
        <button type="button" className="secondary" onClick={onDecline}>Taip sahaja</button>
      </div>
    </section>
  </div>;
}
