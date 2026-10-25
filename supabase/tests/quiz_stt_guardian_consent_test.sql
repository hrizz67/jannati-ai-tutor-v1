begin;

create extension if not exists pgtap with schema extensions;

select plan(11);
select set_config('jannati_test.assertion_count', '0', true);

create function pg_temp.assert_tap(p_result text)
returns text language plpgsql as $$
begin
  if p_result !~ '^ok ' then raise exception 'guardian_consent_assertion_failed'; end if;
  perform set_config(
    'jannati_test.assertion_count',
    (current_setting('jannati_test.assertion_count')::integer + 1)::text,
    true
  );
  return p_result;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'authenticated', 'authenticated', 'guardian-rpc-test@example.invalid', 'test-only',
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
  pg_catalog.now(), pg_catalog.now()
) on conflict (id) do nothing;

insert into public.profiles (id, learning_data)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', jsonb_build_object(
  'jannati_cloud_child_state',
  jsonb_build_object(
    'profiles', jsonb_build_array(
      jsonb_build_object('id', 'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
      jsonb_build_object('id', 'child-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
    ),
    'deletedChildren', '{}'::jsonb,
    'archivedChildren', '{}'::jsonb
  )::text
))
on conflict (id) do update set learning_data = excluded.learning_data;

set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'role', 'authenticated',
  'session_id', '11111111-1111-4111-8111-111111111111',
  'is_anonymous', false,
  'amr', jsonb_build_array(jsonb_build_object(
    'method', 'password',
    'timestamp', pg_catalog.floor(extract(epoch from pg_catalog.now()))::bigint - 60
  ))
)::text, true);

select pg_temp.assert_tap(throws_ok(
  $$select public.set_quiz_stt_guardian_consent_v1(
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true,
    'quiz-stt-cloudflare-bm-v1', null
  )$$,
  'P0001', 'guardian_authorization_required',
  'an authenticated but parent-locked session cannot grant consent directly'
));

select set_config(
  'jannati_test.challenge_token',
  public.begin_quiz_stt_guardian_authorization_v1(
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) ->> 'challengeToken',
  true
);

select pg_temp.assert_tap(throws_ok(
  $$select public.set_quiz_stt_guardian_consent_v1(
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true,
    'quiz-stt-cloudflare-bm-v1',
    current_setting('jannati_test.challenge_token')::uuid
  )$$,
  'P0001', 'guardian_reauthentication_required',
  'the session that created the challenge cannot consume it'
));

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'role', 'authenticated',
  'session_id', '22222222-2222-4222-8222-222222222222',
  'is_anonymous', false,
  'amr', jsonb_build_array(jsonb_build_object(
    'method', 'password',
    'timestamp', pg_catalog.floor(extract(epoch from pg_catalog.now()))::bigint
  ))
)::text, true);

select set_config(
  'jannati_test.consent_token',
  (public.set_quiz_stt_guardian_consent_v1(
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true,
    'quiz-stt-cloudflare-bm-v1',
    current_setting('jannati_test.challenge_token')::uuid
  ) ->> 'consentToken'),
  true
);

select pg_temp.assert_tap(ok(
  current_setting('jannati_test.consent_token')::uuid is not null,
  'a fresh password-authenticated session can grant consent once'
));

select pg_temp.assert_tap(throws_ok(
  $$select public.set_quiz_stt_guardian_consent_v1(
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true,
    'quiz-stt-cloudflare-bm-v1',
    current_setting('jannati_test.challenge_token')::uuid
  )$$,
  'P0001', 'guardian_authorization_required',
  'a consumed guardian challenge cannot be replayed'
));

select pg_temp.assert_tap(is(
  (public.verify_quiz_stt_guardian_consent_v1(
    current_setting('jannati_test.consent_token')::uuid,
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) ->> 'granted')::boolean,
  true,
  'current consent verifies for its active child'
));

select pg_temp.assert_tap(is(
  (public.verify_quiz_stt_guardian_consent_v1(
    current_setting('jannati_test.consent_token')::uuid,
    'child-bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  ) ->> 'status'),
  'child-mismatch',
  'child A consent cannot authorize child B'
));

select public.set_quiz_stt_guardian_consent_v1(
  'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', false,
  'quiz-stt-cloudflare-bm-v1', null
);
select pg_temp.assert_tap(is(
  (public.verify_quiz_stt_guardian_consent_v1(
    current_setting('jannati_test.consent_token')::uuid,
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) ->> 'status'),
  'revoked',
  'revocation invalidates the old consent token'
));

select set_config('jannati_test.challenge_token', '', true);
select set_config('jannati_test.consent_token', '', true);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'role', 'authenticated',
  'session_id', '33333333-3333-4333-8333-333333333333', 'is_anonymous', false,
  'amr', jsonb_build_array(jsonb_build_object('method', 'password', 'timestamp', pg_catalog.floor(extract(epoch from pg_catalog.now()))::bigint))
)::text, true);
select set_config(
  'jannati_test.challenge_token',
  public.begin_quiz_stt_guardian_authorization_v1('child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') ->> 'challengeToken',
  true
);
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'role', 'authenticated',
  'session_id', '44444444-4444-4444-8444-444444444444', 'is_anonymous', false,
  'amr', jsonb_build_array(jsonb_build_object('method', 'password', 'timestamp', pg_catalog.floor(extract(epoch from pg_catalog.now()))::bigint))
)::text, true);
select set_config(
  'jannati_test.consent_token',
  (public.set_quiz_stt_guardian_consent_v1(
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true,
    'quiz-stt-cloudflare-bm-v1', current_setting('jannati_test.challenge_token')::uuid
  ) ->> 'consentToken'),
  true
);

reset role;
update public.profiles
set learning_data = jsonb_set(
  learning_data,
  '{jannati_cloud_child_state}',
  to_jsonb(jsonb_set((learning_data ->> 'jannati_cloud_child_state')::jsonb, '{archivedChildren}',
    jsonb_build_object('child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true))::text)
)
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select pg_temp.assert_tap(is(
  (public.verify_quiz_stt_guardian_consent_v1(
    current_setting('jannati_test.consent_token')::uuid,
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) ->> 'status'),
  'child-not-active',
  'archiving a child immediately invalidates its old token'
));

reset role;
update public.profiles
set learning_data = jsonb_set(
  learning_data,
  '{jannati_cloud_child_state}',
  to_jsonb(jsonb_set(jsonb_set((learning_data ->> 'jannati_cloud_child_state')::jsonb, '{archivedChildren}', '{}'::jsonb), '{deletedChildren}',
    jsonb_build_object('child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true))::text)
)
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set local role authenticated;
select pg_temp.assert_tap(is(
  (public.verify_quiz_stt_guardian_consent_v1(
    current_setting('jannati_test.consent_token')::uuid,
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) ->> 'status'),
  'child-not-active',
  'deleting a child immediately invalidates its old token'
));

select pg_temp.assert_tap(throws_ok(
  $$select public.set_quiz_stt_guardian_consent_v1(
    'child-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true,
    'quiz-stt-cloudflare-bm-v1',
    current_setting('jannati_test.challenge_token')::uuid
  )$$,
  'P0001', 'child_not_owned',
  'a deleted child cannot receive a new grant'
));

reset role;
select pg_temp.assert_tap(is(
  (select count(*)::integer from public.quiz_stt_guardian_consent_events
   where account_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and decision = 'granted'),
  2,
  'only the two explicitly reauthenticated grants were recorded'
));

do $$
begin
  if current_setting('jannati_test.assertion_count')::integer <> 11 then
    raise exception 'guardian_consent_assertion_count_failed';
  end if;
end;
$$;

select * from finish();
rollback;
