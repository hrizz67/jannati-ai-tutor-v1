import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import QuizSttGuardianConsentPanel from '../../src/components/parent/QuizSttGuardianConsentPanel.jsx';
import {
  grantQuizSttGuardianConsent,
  getQuizSttGuardianConsent,
  QUIZ_STT_PRIVACY_NOTICE_VERSION,
  setQuizSttGuardianConsent
} from '../../src/services/quizSttGuardianConsent.js';

const CHILD_ID = 'child-11111111-1111-4111-8111-111111111111';
const CONSENT_TOKEN = '33333333-3333-4333-8333-333333333333';
const migration = readFileSync(new URL('../../supabase/migrations/20261025090000_quiz_stt_guardian_consent.sql', import.meta.url), 'utf8');
const schemaTable = readFileSync(new URL('../../supabase/schemas/public/tables/quiz_stt_guardian_consent_events.sql', import.meta.url), 'utf8');
const challengeTable = readFileSync(new URL('../../supabase/schemas/public/tables/quiz_stt_guardian_authorization_challenges.sql', import.meta.url), 'utf8');
const schemaFunctions = readFileSync(new URL('../../supabase/schemas/public/functions/quiz_stt_guardian_consent.sql', import.meta.url), 'utf8');
const panelSource = readFileSync(new URL('../../src/components/parent/QuizSttGuardianConsentPanel.jsx', import.meta.url), 'utf8');
const publicInfo = readFileSync(new URL('../../src/public/PublicInfoPage.jsx', import.meta.url), 'utf8');
const supabaseClientSource = readFileSync(new URL('../../src/services/supabaseClient.js', import.meta.url), 'utf8');

function clientResult(data, error = null) {
  const rpc = vi.fn(async () => ({ data, error }));
  return { getClient: async () => ({ rpc }), rpc };
}

function normalizedFunctionDefinition(sql, functionName) {
  const definition = sql.match(new RegExp(
    `create or replace function public\\.${functionName}[\\s\\S]*?end;\\s*\\$\\$;`,
    'i'
  ))?.[0];
  return definition?.replace(/\s+/g, '') || '';
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

  it('allows authenticated revocation without making withdrawal harder', async () => {
    const mock = clientResult({ eligible: true, granted: false, status: 'revoked', noticeVersion: QUIZ_STT_PRIVACY_NOTICE_VERSION });
    await setQuizSttGuardianConsent({ childId: CHILD_ID, granted: false }, mock);
    expect(mock.rpc).toHaveBeenCalledWith('set_quiz_stt_guardian_consent_v1', {
      p_child_id: CHILD_ID,
      p_granted: false,
      p_notice_version: QUIZ_STT_PRIVACY_NOTICE_VERSION,
      p_guardian_challenge: null
    });
  });

  it('requires a backend challenge followed by password reauthentication before grant', async () => {
    const rpc = vi.fn(async () => ({
      data: { challengeToken: CONSENT_TOKEN, expiresAt: '2026-10-25T00:05:00Z' }, error: null
    }));
    const reauthenticationRpc = vi.fn(async () => ({
      data: { eligible: true, granted: true, status: 'granted', consentToken: CONSENT_TOKEN,
        noticeVersion: QUIZ_STT_PRIVACY_NOTICE_VERSION }, error: null
    }));
    const getSession = vi.fn(async () => ({ data: { session: { user: { id: 'account-a', email: 'parent@example.test' } } } }));
    const sharedSignInWithPassword = vi.fn();
    const signInWithPassword = vi.fn(async () => ({ data: { user: { id: 'account-a' } }, error: null }));
    const getClient = async () => ({ rpc, auth: { getSession, signInWithPassword: sharedSignInWithPassword } });
    const getReauthenticationClient = async () => ({
      rpc: reauthenticationRpc,
      auth: { signInWithPassword }
    });

    await expect(grantQuizSttGuardianConsent({
      childId: CHILD_ID,
      password: 'guardian-password'
    }, { getClient, getReauthenticationClient })).resolves.toMatchObject({ granted: true });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith('begin_quiz_stt_guardian_authorization_v1', { p_child_id: CHILD_ID });
    expect(reauthenticationRpc).toHaveBeenCalledWith('set_quiz_stt_guardian_consent_v1', {
      p_child_id: CHILD_ID,
      p_granted: true,
      p_notice_version: QUIZ_STT_PRIVACY_NOTICE_VERSION,
      p_guardian_challenge: CONSENT_TOKEN
    });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'parent@example.test',
      password: 'guardian-password'
    });
    expect(sharedSignInWithPassword).not.toHaveBeenCalled();
  });

  it('fails closed when a parent-locked session attempts a direct grant or reauthentication fails', async () => {
    const direct = clientResult({ eligible: true, granted: true, status: 'granted' });
    await expect(setQuizSttGuardianConsent({ childId: CHILD_ID, granted: true }, direct))
      .resolves.toMatchObject({ granted: false, reason: 'invalid-request' });
    expect(direct.rpc).not.toHaveBeenCalled();

    const rpc = vi.fn(async () => ({ data: { challengeToken: CONSENT_TOKEN }, error: null }));
    const getClient = async () => ({ rpc, auth: {
      getSession: async () => ({ data: { session: { user: { id: 'account-a', email: 'parent@example.test' } } } })
    } });
    const getReauthenticationClient = async () => ({
      rpc: vi.fn(),
      auth: { signInWithPassword: async () => ({ data: { user: null }, error: { code: 'invalid_credentials' } }) }
    });
    await expect(grantQuizSttGuardianConsent({
      childId: CHILD_ID, password: 'wrong'
    }, { getClient, getReauthenticationClient })).resolves.toMatchObject({ granted: false, reason: 'guardian-reauth-failed' });
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it('isolates fresh guardian reauthentication from the persisted Parent Area session', () => {
    expect(supabaseClientSource).toMatch(/getSupabaseReauthenticationClient/);
    expect(supabaseClientSource).toMatch(/getSupabaseReauthenticationClient[\s\S]*persistSession: false/);
    expect(supabaseClientSource).toMatch(/getSupabaseReauthenticationClient[\s\S]*autoRefreshToken: false/);
    expect(supabaseClientSource).toMatch(/getSupabaseReauthenticationClient[\s\S]*detectSessionInUrl: false/);
    expect(supabaseClientSource).toMatch(/getSupabaseClient[\s\S]*persistSession: true/);
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
    expect(panelSource).toContain('Sahkan dengan kata laluan akaun ibu bapa');
    expect(panelSource).toContain('grantQuizSttGuardianConsent');
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
    expect(challengeTable).toMatch(/initial_session_hash[\s\S]*bytea/i);
    expect(challengeTable).toMatch(/enable row level security/i);
    expect(challengeTable).toMatch(/revoke all[\s\S]*public, anon, authenticated/i);
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
      expect(sql).toMatch(/verify_quiz_stt_guardian_consent_v1\([\s\S]{0,120}p_child_id text/);
      expect(sql).toMatch(/matched_child_id is distinct from p_child_id/);
      expect(sql).toMatch(/owns_active_child := public\._quiz_stt_account_owns_child_v1/);
    }
  });

  it('makes grant challenges one-time, short-lived and valid only after a new password-authenticated session', () => {
    for (const sql of [migration, schemaFunctions]) {
      expect(sql).toContain('begin_quiz_stt_guardian_authorization_v1');
      expect(sql).toContain("interval '5 minutes'");
      expect(sql).toContain("method ->> 'method' = 'password'");
      expect(sql).toContain('current_session_hash = initial_session_hash');
      expect(sql).toMatch(/used_at is null/);
      expect(sql).toMatch(/set used_at = pg_catalog\.now\(\)/);
      expect(sql).toContain('guardian_reauthentication_required');
    }
  });

  it('bounds challenge issuance and consent audit growth under spam and concurrent requests', () => {
    for (const sql of [migration, schemaFunctions]) {
      expect(sql).toContain("'quiz-stt-challenge:' || caller_id::text || ':' || p_child_id");
      expect(sql).toContain("'quiz-stt-consent:' || caller_id::text || ':' || p_child_id");
      expect(sql).toContain('pg_catalog.pg_advisory_xact_lock');
      expect(sql).toContain("stale.created_at < pg_catalog.now() - interval '24 hours'");
      expect(sql).toContain("existing_created_at > pg_catalog.now() - interval '30 seconds'");
      expect(sql).toContain('guardian_authorization_rate_limited');
      expect(sql).toMatch(/existing_used_at is null[\s\S]{0,120}existing_expires_at > pg_catalog\.now\(\)[\s\S]{0,240}return jsonb_build_object/);
      expect(sql).toMatch(/update public\.quiz_stt_guardian_authorization_challenges[\s\S]{0,500}used_at = null/);
      expect(sql).toMatch(/if not p_granted then[\s\S]{0,400}delete from public\.quiz_stt_guardian_authorization_challenges/);
    }
    for (const sql of [migration, challengeTable]) {
      expect(sql).toMatch(/unique \(account_id, child_id\)/);
    }
  });

  it('accepts only the canonical privacy notice for both grant and revoke', () => {
    for (const sql of [migration, schemaFunctions]) {
      expect(sql).toContain("canonical_notice_version constant text := 'quiz-stt-cloudflare-bm-v1'");
      expect(sql).toContain('p_notice_version is distinct from canonical_notice_version');
      expect(sql).toContain("raise exception 'invalid_notice_version'");
    }
  });

  it('keeps the bounded challenge and consent RPCs identical in migration and declarative schema', () => {
    for (const functionName of [
      'begin_quiz_stt_guardian_authorization_v1',
      'set_quiz_stt_guardian_consent_v1'
    ]) {
      expect(normalizedFunctionDefinition(migration, functionName)).not.toBe('');
      expect(normalizedFunctionDefinition(schemaFunctions, functionName))
        .toBe(normalizedFunctionDefinition(migration, functionName));
    }
  });

  it('invalidates an old grant after revocation and binds uploads to the same child', () => {
    expect(migration).toMatch(/matched_event_id = latest_event_id and latest_decision = 'granted'/);
    expect(migration).toMatch(/order by event\.created_at desc, event\.id desc/);
    expect(migration).toContain("else 'revoked'");
    const adapter = readFileSync(new URL('../../src/ai/speech/quizAuthenticatedSttAdapter.js', import.meta.url), 'utf8');
    const worker = readFileSync(new URL('../../workers/quiz-stt/src/index.js', import.meta.url), 'utf8');
    expect(adapter).toContain("'X-Jannati-Consent-Token'");
    expect(adapter).toContain("'X-Jannati-Child-Id'");
    expect(worker).toContain("request.headers.get('X-Jannati-Child-Id')");
    expect(worker).toContain('p_child_id: childId');
  });

  it('does not persist consent tokens in browser storage or add a diagnostic/network side channel', () => {
    const combined = [panelSource, readFileSync(new URL('../../src/services/quizSttGuardianConsent.js', import.meta.url), 'utf8')].join('\n');
    expect(combined).not.toMatch(/localStorage|sessionStorage|console\.|navigator\.sendBeacon/);
    expect(combined).not.toMatch(/fetch\(/);
  });
});
