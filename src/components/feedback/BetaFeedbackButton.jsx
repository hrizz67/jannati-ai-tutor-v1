import React, { useEffect, useRef, useState } from 'react';

// Internal-only beta feedback. Defer its form, events and state from first paint
// while retaining device-local save and keyboard focus/Escape behavior.
export default function BetaFeedbackButton({
  suppressed = false,
  onSaveFeedback,
  version,
  buildDate,
  betaStatus,
  IconGlyph,
  BrandLogo
}) {
  const categories = ['Pepijat', 'Cadangan', 'Kandungan', 'AI', 'Pengalaman'];
  const [open, setOpen] = useState(false);
  const [category, setKategori] = useState('Pepijat');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [screenshotDescription, setScreenshotDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (suppressed) return null;

  function submitFeedback() {
    const trimmed = comment.trim();
    if (!trimmed) return;
    onSaveFeedback({
      id: `feedback_${Date.now()}`,
      category,
      rating: Number(rating),
      comment: trimmed,
      message: trimmed,
      screenshotDescription: screenshotDescription.trim(),
      status: betaStatus,
      version,
      buildDate,
      screen: window.location.hash || window.location.pathname,
      createdAt: new Date().toISOString()
    });
    setComment('');
    setScreenshotDescription('');
    setRating(5);
    setSaved(true);
    setTimeout(() => setOpen(false), 900);
  }

  return <>
    <button type="button" className="beta-feedback-fab" aria-label="Maklum Balas Beta" title="Maklum Balas Beta" onClick={() => { setSaved(false); setOpen(true); }}><IconGlyph name="message" decorative /><span>Maklum Balas Beta</span></button>
    {open && <div className="beta-feedback-overlay" role="dialog" aria-modal="true" aria-labelledby="beta-feedback-title">
      <section className="beta-feedback-panel">
        <div className="beta-feedback-head"><div className="modal-brand-title"><BrandLogo iconOnly size="sm" /><div><p className="eyebrow">Beta Tertutup</p><h2 id="beta-feedback-title">Maklum Balas</h2></div></div><button ref={closeRef} type="button" className="ghost" onClick={() => setOpen(false)}>Tutup</button></div>
        <label id="feedback-category-label">Kategori</label>
        <div className="feedback-category-grid" role="group" aria-labelledby="feedback-category-label">{categories.map(item => <button type="button" key={item} className={category === item ? '' : 'secondary'} aria-pressed={category === item} onClick={() => setKategori(item)}>{item}</button>)}</div>
        <label id="feedback-rating-label">Rating</label>
        <div className="feedback-rating-grid" role="group" aria-labelledby="feedback-rating-label">{[1, 2, 3, 4, 5].map(item => <button type="button" key={item} className={rating === item ? '' : 'secondary'} aria-pressed={rating === item} onClick={() => setRating(item)}>{item}</button>)}</div>
        <label htmlFor="feedback-comment">Komen</label>
        <textarea id="feedback-comment" value={comment} onChange={event => setComment(event.target.value)} placeholder="Apa yang berlaku? Apa yang patut diperbaiki?" />
        <label htmlFor="feedback-screenshot-description">Deskripsi screenshot</label>
        <textarea id="feedback-screenshot-description" value={screenshotDescription} onChange={event => setScreenshotDescription(event.target.value)} placeholder="Terangkan apa yang kelihatan dalam screenshot, jika ada." />
        {saved && <p className="autosave-note">Maklum balas disimpan pada peranti ini.</p>}
        <button type="button" className="full" onClick={submitFeedback} disabled={!comment.trim()}>Simpan Maklum Balas</button>
      </section>
    </div>}
  </>;
}
