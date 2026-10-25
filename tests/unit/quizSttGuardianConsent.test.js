import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import QuizSttGuardianConsentPanel from '../../src/components/parent/QuizSttGuardianConsentPanel.jsx';
import {
  getQuizSttGuardianConsent,
  QUIZ_STT_PRIVACY_NOTICE_VERSION,
  setQuizSttGuardianConsent
} from '../../src/services/quizSttGuardianConsent.js';

const CHILD_ID = 'child-11111111-1111-4111-8111-111111111111';
const CONSENT_TOKEN = '33333333-3333-4333-8333-333333333333';
const migration = readFileSync(new URL('../../supabase/migrations/20261025090000_quiz_stt_guardian_consent.sql', import.meta.url), 'utf8');
const schemaTable = readFileSync(new URL('../../supabase/schemas/public/tables/quiz_stt_guardian_consent_events.sql', import.meta.url), 'utf8');
const schemaFunctions = readFileSync(new URL('../../supabase/schemas/public/functions/quiz_stt_guardian_consent.sql', import.meta.url), 'utf8');
const panelSource = readFileSync(new URL('../../src/components/parent/QuizSttGuardianConsentPanel.jsx', import.meta.url), 'utf8');
const publicInfo = readFileSync(new URL('../../src/public/PublicInfoPage.jsx', import.meta.url), 'utf8');

function clientResult(data, error = null) {
  const rpc = vi.fn(async () => ({ data, error }));
  return { getClient: async () => ({ rpc }), rpc };
}

describe('P1.17 guardian-consent privacy and authorization', () => {
  it('reads a current grant and returns only its opaque short-lived authorization handle', async () => {
    const mock = clientResult({
      eligible: true,
      granted: true,
      status: 'granted',
      consentToken: CONSENT_TOKEN,
      noticeVersion: QUIZ_STT_PRIVACY_NOTICE_VERSION,
      changedAt: '2026-10-25T00:00:00Z'
    });
    await expect(getQuizSttGuardianConsent(CHILD_ID, mock)).resolves.toEqual(expect.objectContaining({
      ok: true, eligible: true, granted: true, status: 'granted', consentToken: CONSENT_TOKEN
    }));
    expect(mock.rpc).toHaveBeenCalledWith('get_quiz_stt_guardian_consent_v1', { p_child_id: CHILD_ID });
  });

  it('fails closed for malformed child IDs, RPC failures, stale notices and malformed tokens', async () => {
    const invalid = clientResult({ eligible: true, granted: true, status: 'granted', consentToken: CONSENT_TOKEN,
      noticeVersion: 'old-notice' });
    await expect(getQuizSttGuardianConsent('../child', invalid)).resolves.toMatchObject({ granted: false, reason: 'invalid-child' });
    expect(invalid.rpc).not.toHaveBeenCalled();
    await expect(getQuizSttGuardianConsent(CHILD_ID, invalid)).resolves.toMatchObject({ granted: false, status: 'missing', consentToken: '' });
    const malformed = clientResult({ eligible: true, granted: true, status: 'granted', consentToken: 'not-a-uuid',
      noticeVersion: QUIZ_STT_PRIVACY_NOTICE_VERSION });
    await expect(getQuizSttGuardianConsent(CHILD_ID, malformed)).resolves.toMatchObject({ granted: false, status: 'missing', consentToken: '' });
    const failed = clientResult(null, { message: 'network' });
    await expect(getQuizSttGuardianConsent(CHILD_ID, failed)).resolves.toMatchObject({ granted: false, status: 'unavailable' });
  });

  it('uses an authenticated RPC to grant or revoke the current notice version', async () => {
    const mock = clientResult({ eligible: true, granted: false, status: 'revoked', noticeVersion: QUIZ_STT_PRIVACY_NOTICE_VERSION });
    await setQuizSttGuardianConsent({ childId: CHILD_ID, granted: false }, mock);
    expect(mock.rpc).toHaveBeenCalledWith('set_quiz_stt_guardian_consent_v1', {
      p_child_id: CHILD_ID,
      p_granted: false,
      p_notice_version: QUIZ_STT_PRIVACY_NOTICE_VERSION
    });
  });

  it('shows a clear BM Cloudflare notice, typing fallback and revocation control in Parent Area', () => {
    const markup = renderToStaticMarkup(React.createElement(QuizSttGuardianConsentPanel, {
      hasAccountSession: true, childId: CHILD_ID, childName: 'Alya'
    }));
    expect(markup).toContain('Cloudflare Workers AI');
    expect(markup).toContain('tidak disimpan oleh Jannati');
    expect(markup).toContain('tidak dimasukkan ke rekod persetujuan');
    expect(markup).toContain('Murid masih boleh menaip');
    expect(panelSource).toContain('Tarik balik persetujuan');
    expect(panelSource).toContain('ibu bapa atau penjaga sah');
    expect(publicInfo).toContain('Cloudflare Workers AI');
  });

  it('stores only append-only minimum consent metadata with RLS and private table access', () => {
    for (const sql of [migration, schemaTable]) {
      expect(sql).toContain('quiz_stt_guardian_consent_events');
      expect(sql).toMatch(/"?account_id"? uuid not null/);
      expect(sql).toMatch(/"?child_id"? text not null/);
      expect(sql).toMatch(/"?consent_token"? uuid not null/);
      expect(sql).toMatch(/"?decision"? text not null/);
      expect(sql).toMatch(/"?notice_version"? text not null/);
      expect(sql).toMatch(/"?created_at"? timestamptz not null/);
      expect(sql).toMatch(/enable row level security/i);
      expect(sql).toMatch(/revoke all on table "?public"?\."?quiz_stt_guardian_consent_events"? from public, anon, authenticated/i);
      expect(sql).not.toMatch(/"?(audio|transcript|learner_payload|email|access_token|refresh_token)"?\s+(text|jsonb|bytea)/i);
    }
    expect(migration).not.toMatch(/update\s+public\.quiz_stt_guardian_consent_events|delete\s+from\s+public\.quiz_stt_guardian_consent_events/i);
  });

  it('binds approval to auth.uid, canonical owned child state and rejects deleted or archived children', () => {
    for (const sql of [migration, schemaFunctions]) {
      expect(sql).toContain("cloud_payload ->> 'jannati_cloud_child_state'");
      expect(sql).toContain("child_state -> 'deletedChildren'");
      expect(sql).toContain("child_state -> 'archivedChildren'");
      expect(sql).not.toContain("cloud_payload ->> 'jannati_child_profiles'");
      expect(sql).toMatch(/auth\.uid\(\)/);
      expect(sql).toMatch(/security definer/);
      expect(sql).toMatch(/set search_path = ''/);
    }
  });

  it('invalidates an old grant after revocation and exposes no child ID to the Worker', () => {
    expect(migration).toMatch(/matched_event_id = latest_event_id and latest_decision = 'granted'/);
    expect(migration).toMatch(/order by event\.created_at desc, event\.id desc/);
    expect(migration).toContain("else 'revoked'");
    const adapter = readFileSync(new URL('../../src/ai/speech/quizAuthenticatedSttAdapter.js', import.meta.url), 'utf8');
    const worker = readFileSync(new URL('../../workers/quiz-stt/src/index.js', import.meta.url), 'utf8');
    expect(adapter).toContain("'X-Jannati-Consent-Token'");
    expect(adapter).not.toMatch(/X-Jannati-Child|childId/);
    expect(worker).not.toMatch(/X-Jannati-Child/);
  });

  it('does not persist consent tokens in browser storage or add a diagnostic/network side channel', () => {
    const combined = [panelSource, readFileSync(new URL('../../src/services/quizSttGuardianConsent.js', import.meta.url), 'utf8')].join('\n');
    expect(combined).not.toMatch(/localStorage|sessionStorage|console\.|navigator\.sendBeacon/);
    expect(combined).not.toMatch(/fetch\(/);
  });
});
