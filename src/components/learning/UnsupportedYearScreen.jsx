import React from 'react';

// Loaded only when the stored child year has no approved question bank.
// Changing a child goes through App's existing snapshot-safe switch handler.
export default function UnsupportedYearScreen({
  profiles = [],
  activeChildId = '',
  onSelectChild,
  onAccountLogin
}) {
  const available = (Array.isArray(profiles) ? profiles : []).filter(child =>
    child?.id
    && child.id !== activeChildId
    && String(child.year || 'Tahun 2').trim() === 'Tahun 2'
  );

  return (
    <main className="app" aria-labelledby="year-unavailable-heading">
      <section className="card">
        <h1 id="year-unavailable-heading">Tahun belum tersedia</h1>
        <p role="status">
          Bank soalan tahun ini belum diluluskan.
          Soalan Tahun 2 tidak akan dipaparkan untuk profil ini.
        </p>
        {available.length > 0 ? (
          <>
            <h2>Pilih profil Tahun 2 yang tersedia</h2>
            <ul>
              {available.map(child => (
                <li key={child.id}>
                  <button type="button" onClick={() => onSelectChild?.(child.id)}>
                    {child.name || 'Murid'} — Tahun 2
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Tiada profil Tahun 2 lain yang tersedia pada akaun ini.</p>
        )}
        <button className="secondary" type="button" onClick={() => onAccountLogin?.(true)}>
          Log masuk atau gunakan profil lain
        </button>
      </section>
    </main>
  );
}
