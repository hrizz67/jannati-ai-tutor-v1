import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

if (!process.argv.includes('--linked-qa')) {
  console.error('Usage: node scripts/validate/quizSttGuardianConsentDatabaseCheck.mjs --linked-qa');
  process.exit(2);
}

const expectedQaRef = String(process.env.JANNATI_SUPABASE_QA_PROJECT_REF || '').trim();
const linkedRef = readFileSync(new URL('../../supabase/.temp/project-ref', import.meta.url), 'utf8').trim();
if (!/^[a-z]{20}$/.test(expectedQaRef) || linkedRef !== expectedQaRef) {
  console.error('Refusing database test: the linked project is not the explicitly approved QA project.');
  process.exit(2);
}

function transactionBody(source, ending) {
  const withoutBom = source.replace(/^\uFEFF/, '');
  const beginMatch = /(?:^|\r?\n)begin;\s*(?:\r?\n)/i.exec(withoutBom);
  if (!beginMatch) throw new Error('Expected transactional SQL source.');
  const trimmed = withoutBom.slice(beginMatch.index + beginMatch[0].length).trim();
  if (!trimmed.endsWith(ending)) throw new Error('Unexpected SQL transaction ending.');
  return trimmed.slice(0, -ending.length).trim();
}

const migration = transactionBody(
  readFileSync(new URL('../../supabase/migrations/20261025090000_quiz_stt_guardian_consent.sql', import.meta.url), 'utf8'),
  'commit;'
);
const tests = transactionBody(
  readFileSync(new URL('../../supabase/tests/quiz_stt_guardian_consent_test.sql', import.meta.url), 'utf8'),
  'rollback;'
);
if (!/select plan\(25\);/i.test(tests)
    || !/assertion_count[\s\S]{0,200}<> 25[\s\S]{0,120}guardian_consent_assertion_count_failed/i.test(tests)) {
  throw new Error('Expected an enforced 25-assertion RPC test plan.');
}
const bootstrap = `
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  learning_data jsonb not null default '{}'::jsonb
);
revoke all on table public.profiles from public, anon, authenticated;
grant select on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
`;

const directory = mkdtempSync(join(tmpdir(), 'jannati-consent-rpc-'));
const sqlPath = join(directory, 'isolated-consent-rpc-test.sql');
try {
  const sql = `begin;\n${bootstrap}\n${migration}\n${tests}\nrollback;\n`;
  writeFileSync(sqlPath, sql, { encoding: 'utf8', mode: 0o600 });
  const command = ['db', 'query', '--linked', '--file', sqlPath, '--output', 'json'];
  const executable = process.platform === 'win32'
    ? join(process.cwd(), 'node_modules', '@supabase', 'cli-windows-x64', 'bin', 'supabase.exe')
    : join(process.cwd(), 'node_modules', '.bin', 'supabase');
  const result = spawnSync(executable, command, { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  const combined = `${result.stdout || ''}\n${result.stderr || ''}`;
  const diagnosticText = combined
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\\"/g, '"');
  if (result.status !== 0 || /\bnot ok\b/i.test(combined)) {
    console.error('Isolated Supabase guardian-consent RPC test: FAIL');
    const categories = [
      ['permission-denied', /permission denied/i],
      ['permission-auth-users', /permission denied[^\r\n]{0,120}(auth\.users|schema auth)/i],
      ['permission-profiles', /permission denied[^\r\n]{0,120}(public\.)?profiles/i],
      ['permission-temp-state', /permission denied[^\r\n]{0,120}guardian_rpc_test_state/i],
      ['permission-consent-table', /permission denied[^\r\n]{0,120}quiz_stt_guardian/i],
      ['permission-role-switch', /permission denied[^\r\n]{0,120}(role|authenticated)/i],
      ['missing-relation-or-function', /does not exist/i],
      ['duplicate-object', /already exists/i],
      ['sql-syntax', /syntax error/i],
      ['syntax-near-generated', /syntax error[^\r\n]{0,120}generated/i],
      ['syntax-near-identity', /syntax error[^\r\n]{0,120}identity/i],
      ['syntax-near-primary', /syntax error[^\r\n]{0,120}primary/i],
      ['syntax-near-parameter', /syntax error[^\r\n]{0,120}\$[0-9]+/i],
      ['syntax-near-transaction', /syntax error[^\r\n]{0,120}(begin|commit|rollback)/i],
      ['invalid-input', /invalid input syntax/i],
      ['not-null-failure', /not-null constraint/i],
      ['transaction-aborted', /current transaction is aborted/i],
      ['unsupported-operation', /not supported|cannot /i],
      ['ambiguous-reference', /ambiguous/i],
      ['constraint-failure', /violates .*constraint/i],
      ['assertion-failure', /\bnot ok\b/i],
      ['tap-assertion-failure', /guardian_consent_assertion_failed/i],
      ['challenge-spam-deduplication-failure', /guardian_challenge_spam_created_new_token/i],
      ['assertion-count-failure', /guardian_consent_assertion_count_failed/i],
      ['challenge-rate-limit-mismatch', /guardian_authorization_rate_limited/i],
      ['notice-version-mismatch', /invalid_notice_version/i],
      ['connection-failure', /connect|network|timeout/i],
      ['management-api-failure', /failed to send|unexpected response|management api/i],
      ['query-execution-failure', /query failed|failed to execute|error:/i],
      ['cli-usage-failure', /unknown flag|usage:|requires|not provided/i]
    ].filter(([, pattern]) => pattern.test(combined)).map(([name]) => name);
    const sqlState = /(?:sqlstate|code)["'\s:=]+([0-9A-Z]{5})/i.exec(diagnosticText)?.[1]
      || /SQLSTATE\s+([0-9A-Z]{5})/i.exec(diagnosticText)?.[1] || 'none';
    const locationMatch = /(line|position|character)["'\s:=]+(\d{1,7})/i.exec(diagnosticText);
    const locationKind = locationMatch?.[1]?.toLowerCase() || 'none';
    const position = locationMatch?.[2] || 'none';
    const line = position === 'none' || locationKind === 'line' ? position : String(sql.slice(0, Math.max(0, Number(position) - 1)).split(/\r?\n/).length);
    const rawSyntaxToken = /syntax error at or near ["']([^"']{1,40})["']/i.exec(diagnosticText)?.[1] || '';
    const allowedSyntaxTokens = new Set(['begin', 'create', 'table', 'id', 'bigint', 'generated', 'always', 'as', 'identity', 'primary', 'key', 'account_id', 'grant', 'revoke', 'select', 'insert', 'update', 'returning', 'for', 'role', 'authenticated', 'public', 'plan', 'rollback', ';']);
    const syntaxToken = allowedSyntaxTokens.has(rawSyntaxToken.toLowerCase()) ? rawSyntaxToken : 'withheld';
    const assertionOrdinal = /guardian_consent_assertion_failed_(\d{1,3})/i.exec(diagnosticText)?.[1] || 'none';
    console.error(`Failure categories: ${categories.join(',') || 'unclassified'}; process status: ${result.status ?? 'unknown'}; spawn code: ${result.error?.code || 'none'}; SQLSTATE: ${sqlState}; location: ${locationKind} ${position}; line: ${line}; token: ${syntaxToken}; assertion: ${assertionOrdinal}`);
    process.exitCode = 1;
  } else {
    console.log('Isolated Supabase guardian-consent RPC test: PASS (25/25; transaction rolled back)');
  }
} finally {
  rmSync(directory, { recursive: true, force: true });
}
