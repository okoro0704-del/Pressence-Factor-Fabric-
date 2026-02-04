# Section CDLXXII: The Global Reach — Global SMS & E.164

**The 472nd Pillar of the Master Build**

## The Sovereign Bridge

> An identity that only works in one country is a cage. By integrating a global SMS gateway, you turn the Sovereign Mesh into a borderless network.

This document describes environment setup for the Global SMS Gateway (Netlify + local) and the E.164 standard for the Unique Identity Anchor.

---

## Environment Variables

Add these to **Netlify** (Site settings → Environment variables) and to **`.env.local`** for local development:

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_AUTH_EXTERNAL_SMS_PROVIDER` | External SMS provider used by Supabase Auth for OTP | `twilio` |
| `TWILIO_ACCOUNT_SID` | From [Twilio Dashboard](https://console.twilio.com) | Your Account SID |
| `TWILIO_AUTH_TOKEN` | From Twilio Dashboard | Your Auth Token |

- **Netlify**: Set these in the Netlify UI (do not commit secrets to the repo). Supabase will use them when `signInWithOtp(phone)` is invoked from the deployed site.
- **Local**: Copy `.env.example` to `.env.local` and fill in the same values so OTP works in development.

---

## The E.164 Standard

> By forcing the E.164 format, you ensure the database treats **080...** (local Nigeria) and **+234 80...** (international) as the same **Unique Identity Anchor**.

- All identity lookups normalize the phone to E.164 and to multiple variants (with/without `+`, spaces stripped) via `normalizePhoneVariants()` in `lib/universalIdentityComparison.ts`.
- Nigerian local form `08012345678` is parsed with default country `NG` and canonicalized to `+2348012345678`, so it matches the same sentinel identity as `+234 80 123 45678`.
- The Global SMS Gateway sends OTP to the E.164 number; Twilio (or the configured provider) delivers to the same subscriber regardless of how the user entered the number, as long as it is normalized to E.164 before calling Supabase Auth.

---

## References

- `.env.example` — template including `SUPABASE_AUTH_EXTERNAL_SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`
- `netlify.toml` — comment block listing the same variables (values set in Netlify UI)
- `lib/supabaseClient.ts` — `formatPhoneE164()`, `signInWithOtp()`
- `lib/universalIdentityComparison.ts` — `normalizePhoneVariants()` (E.164 + Nigeria default)
- `lib/smsGateway.ts` — `sendVerificationCode()`, failover and Vocal Call option
