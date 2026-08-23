create or replace function public.save_learning_data (
  payload jsonb
)
  returns jsonb
  language plpgsql
  security definer
  set search_path to 'public'
  AS $function$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id, display_name, access_status)
  values (auth.uid(), 'Murid', 'free')
  on conflict (id) do nothing;

  update public.profiles
  set learning_data = coalesce(payload, '{}'::jsonb), updated_at = now()
  where id = auth.uid();

  return coalesce(payload, '{}'::jsonb);
end;
$function$;

grant execute on function "public"."save_learning_data"(jsonb) to "postgres", "service_role";

revoke all on function "public"."save_learning_data"(jsonb) from public, anon, authenticated;
