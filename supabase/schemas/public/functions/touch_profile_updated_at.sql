create or replace function public.touch_profile_updated_at()
  returns trigger
  language plpgsql
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

grant execute on function "public"."touch_profile_updated_at"() to "postgres", "service_role";

revoke all on function "public"."touch_profile_updated_at"() from public;
