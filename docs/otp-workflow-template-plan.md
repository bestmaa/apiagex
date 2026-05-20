# OTP Login Workflow Template Plan

This is a planning document only. Apiagex should not ship an OTP login template until storage, provider delivery, hashing, expiry, retry limits, and token/session issuance are implemented safely.

## Goal

Create two workflow templates later:

- `POST /api/custom/auth/otp/request`
- `POST /api/custom/auth/otp/verify`

The request flow sends a short-lived one-time code to a verified channel. The verify flow checks the code and issues a client session or API token through a dedicated secure token issuer.

## Required Content Schemas

The templates should not use plain OTP storage. A safe MVP needs these schema fields or equivalent database-backed system tables:

### `users`

- `email`: unique login identifier
- `status`: `active`, `inactive`, `blocked`
- `lastLoginAt`: optional date

### `otp_challenges`

- `userId` or `email`
- `otpHash`: hash of the OTP code, never the raw code
- `purpose`: `login`, `register`, `reset-password`
- `expiresAt`: absolute expiry timestamp
- `attemptCount`: failed verify attempts
- `maxAttempts`: usually 5 or less
- `resendCount`: resend counter
- `lockedUntil`: temporary lock timestamp
- `deliveryChannel`: `email` or `sms`
- `providerMessageId`: external provider tracking id
- `consumedAt`: set after successful verification
- `createdAt`

## OTP Request Flow

1. Validate body: `email` is required and must be a valid email.
2. Normalize email before lookup.
3. Find an active user by email.
4. Check rate limits:
   - per email
   - per IP
   - per user
   - per provider account
5. Generate a random numeric or alphanumeric OTP with a cryptographic random source.
6. Store only `otpHash`, expiry, attempt counters, and delivery metadata.
7. Send the raw OTP through the configured provider.
8. Return a generic response such as `{ "ok": true, "message": "If the account exists, an OTP was sent." }`.

The response must not reveal whether the email exists.

## OTP Verify Flow

1. Validate body: `email` and `otp` are required.
2. Normalize email.
3. Load the latest unconsumed challenge for that email and purpose.
4. Reject when:
   - challenge does not exist
   - `expiresAt` is in the past
   - `consumedAt` is already set
   - `attemptCount` is above the limit
   - `lockedUntil` is in the future
5. Hash the submitted OTP with the same server-side secret and compare in constant time.
6. On failure, increment `attemptCount` and possibly set `lockedUntil`.
7. On success, set `consumedAt`, update user login metadata, and issue a session/token.
8. Return only the session/token result, never the OTP or OTP hash.

## Expiry And Retry Rules

Recommended defaults:

- OTP TTL: 5 minutes.
- Max verify attempts: 5.
- Resend cooldown: 30 to 60 seconds.
- Max resend count: 3 per challenge window.
- Per-IP request limit: environment-configurable.
- Per-email request limit: environment-configurable.
- Lockout window after too many failures: 15 minutes.

Expired and consumed challenges should be pruned by a cleanup job or during challenge creation.

## Provider Configuration

OTP delivery needs explicit provider config before implementation:

- Provider type: email, SMS, or custom webhook provider.
- Provider credentials from environment variables or secret store only.
- Sender id/from address.
- Message template id.
- Region and compliance flags where relevant.
- Delivery timeout and retry policy.
- Whether provider errors are exposed to admin history only or to clients as generic failures.

Client responses must stay generic even when provider delivery fails.

## Token Issuance Needs

OTP verification should not directly reuse owner sessions or content API role ids. It needs a dedicated user-session/token issuer with:

- session id
- user id
- expiry
- revocation
- device/client metadata
- secure random token material
- hashed token storage
- optional refresh token rotation

If the product later supports JWT, the signing keys, issuer, audience, expiry, and revocation strategy must be defined before adding the template.

## Admin UI Template Requirements

When implemented, the Admin UI should ask for:

- user schema
- OTP challenge schema or system table choice
- email field
- user status field
- provider type
- OTP TTL
- max attempts
- resend cooldown
- token/session issuer

The UI should show a production warning until hashing, provider delivery, and token issuance are configured.

## Security Rules

- Never store raw OTP codes.
- Never log raw OTP codes.
- Never return raw OTP codes from API responses.
- Never reveal whether an account exists.
- Never issue tokens before OTP verification succeeds.
- Never implement fake SMS/email sending in a production template.
- Never bypass retry limits for public routes.
- Always compare hashes in constant time.
- Always expire and consume OTP challenges.

## Hinglish Notes

Ye plan sirf architecture ke liye hai. OTP template tabhi implement karna chahiye jab raw OTP store na ho, provider config ready ho, expiry/retry limits ready ho, aur verify ke baad secure session/token issue karne ka system ready ho.

Request API generic response dega taki attacker ko ye pata na chale ki email exist karta hai ya nahi. Verify API sirf hashed OTP compare karega, failed attempts count karega, expiry check karega, aur success par consumed mark karke token/session issue karega.
