# Auth Strategy — Endgame

**Principle:** Supabase Auth is the **identity connector**. We store chess data in Postgres. Stripe handles payments later. We avoid storing passwords when possible.

---

## What we manage vs what we delegate

| Concern | Who handles it | We store |
|---------|----------------|----------|
| Facebook / Microsoft login | Supabase + OAuth provider | `user_id` only |
| Email magic link | Supabase (sends email) | `user_id`, email on auth.users |
| Email + password (optional) | Supabase (hashed passwords) | Nothing extra — fallback only |
| Display name, avatar | Our `profiles` table | `display_name`, `avatar_url` |
| ELO, game history | Our Postgres | `ratings`, `matches`, etc. |
| Subscriptions | Stripe + webhooks | `stripe_customer_id`, `subscriptions` |

**You do not build login security.** You configure providers in the Supabase dashboard and call `signInWithOAuth` / `signInWithOtp` from the app.

---

## Recommended sign-in methods (priority order)

### 1. Social OAuth (preferred — least PII for you to manage)

- **Microsoft** — Supabase provider id: `azure`
- **Facebook** — provider id: `facebook`
- **Google** (optional, high conversion) — provider id: `google`

User clicks button → redirected to parent account → returns with session. No password on your servers.

**Setup:** Supabase Dashboard → Authentication → Providers → enable each, add OAuth app IDs from Meta / Microsoft Entra.

### 2. Email magic link (no password)

User enters email → Supabase sends one-time link → click → signed in.

- No password storage or reset flows on your side
- Good for users without Facebook/Microsoft

`signInWithOtp({ email, options: { emailRedirectTo: '/auth/callback' } })`

### 3. Email + password (optional fallback)

Keep available but **de-emphasize in UI**. Supabase still manages hashing; you only expose a form. Use for edge cases or if magic link deliverability is poor.

### 4. Phone OTP (later)

Supabase supports SMS via Twilio/MessageBird. Defer until needed — extra cost and compliance (SMS).

---

## Stable identity (critical for ELO & history)

Every authenticated user gets a **UUID** from `auth.users.id`:

```
auth.users.id  ===  profiles.id  ===  ratings.user_id  ===  match player userId
```

OAuth and email users share the same id shape. Linking multiple providers to one account is handled by Supabase if the same email matches (configurable).

**Never** use email or Facebook id as your primary key in game tables.

---

## Code boundary

```
UI (AuthPanel, OAuth buttons)
    → AuthProvider (signInWithOAuth, signInWithMagicLink)
        → Supabase Auth SDK
            → session cookie / JWT

API routes (future)
    → createSupabaseServerClient() → getUser()
        → verified user_id (replace X-Player-Id header for rated play)
```

Domain code (`MatchService`, ratings) only sees `UserId` — not Supabase types.

---

## OAuth redirect (Next.js)

1. User clicks "Continue with Microsoft"
2. `signInWithOAuth({ provider: 'azure', options: { redirectTo: origin + '/auth/callback' } })`
3. `/auth/callback` exchanges code for session (PKCE)
4. Redirect to `/play`

---

## Payments (later)

1. User signed in → `user_id` known
2. Stripe Checkout with `client_reference_id` or metadata `user_id`
3. Store `stripe_customer_id` on `profiles`
4. Webhooks update `subscriptions` — gate rated queue / premium features

Auth and billing stay separate; both key off `user_id`.

---

## Guest mode

- `/play` vs bot: guest id in localStorage (no account)
- Invite / rated online: require real auth (session)
- Optional later: merge guest stats into account on first OAuth sign-in

---

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Provider secrets (Facebook app secret, Microsoft client secret) live **only in Supabase Dashboard**, not in your repo.

---

## Verification checklist

- [ ] Microsoft OAuth works end-to-end
- [ ] Facebook OAuth works end-to-end
- [ ] Magic link email arrives and completes sign-in
- [ ] `profiles` row created on first sign-in
- [ ] Same user can open `/play` and create invite match with stable id
- [ ] Sign out returns to guest or signed-out state
