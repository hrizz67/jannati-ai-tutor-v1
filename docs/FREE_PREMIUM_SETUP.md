# Jannati AI Tutor — Free/Premium setup

This first version uses Supabase's free tier and manual approval. There is no
payment gateway or extra service cost yet.

## 1. Run the database setup

Open Supabase Dashboard → SQL Editor, paste the contents of
`supabase/schema.sql`, and run it once.

## 2. Create a test account

Use the app's account flow after it is enabled, or create a user in
Supabase Dashboard → Authentication → Users. New users start with `free`.

## 3. Approve Premium manually

Open Authentication → Users, copy the user's UUID, then run this in SQL
Editor, changing the duration when needed:

```sql
update public.profiles
set access_status = 'premium',
    access_expires_at = now() + interval '30 days'
where id = 'USER_UUID_HERE';
```

To return a user to Free:

```sql
update public.profiles
set access_status = 'free', access_expires_at = null
where id = 'USER_UUID_HERE';
```

The frontend publishable key is not the security boundary. Premium screens must
only be enabled after the authenticated user's profile is read under the RLS
policy above. Never put a Supabase secret/service-role key in `.env` files used
by Vite or in browser code.
