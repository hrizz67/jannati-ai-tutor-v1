create or replace function public.get_learning_data()
  returns jsonb
  language sql
  security definer
  set search_path to 'public'
  AS $function$
  select coalesce(learning_data, '{}'::jsonb)
  from public.profiles
  where id = auth.uid();
$function$;

grant execute on function "public"."get_learning_data"() to "authenticated", "postgres", "service_role";

revoke all on function "public"."get_learning_data"() from public;
