# Google Login Workflow Template Plan

This is a planning document only. Apiagex must not ship a Google login template that trusts client-provided profile data or skips Google ID token verification.

## Goal

Create a future workflow template for:

- `POST /api/custom/auth/google/login`

The client sends a Google ID token obtained through the official Google sign-in flow. Apiagex verifies the token on the server, finds or creates the user, and returns a first-party session/token through a secure issuer.

## Request Shape

```json
{
  "idToken": "GOOGLE_ID_TOKEN_FROM_CLIENT"
}
```

The request must not accept `email`, `name`, `picture`, or `googleSub` as trusted values from the client. Those fields must come only from the verified ID token claims.

## Required Verification

The server-side verifier must check:

- Signature against Google's current public keys or a trusted Google auth library.
- `iss` is a valid Google issuer.
- `aud` matches one of the configured Google OAuth client IDs.
- `exp` has not passed.
- `iat` is reasonable.
- `sub` exists and is stable.
- `email_verified` is true when email login is required.
- `hd` hosted domain claim is allowed when domain restriction is enabled.

Do not implement a template that decodes JWT payloads without verifying the signature.

## Allowed Domains

Allowed domain handling should be explicit:

- `GOOGLE_ALLOWED_DOMAINS` can be empty for all verified Google accounts.
- When set, only verified emails with matching domain or matching `hd` claim should pass.
- Admin UI should show the configured domain policy before enabling the workflow.
- Rejections should return a generic authorization error and should not expose internal policy details.

## User Lookup And Create

Recommended schema or system table fields:

### `users`

- `email`
- `googleSub`
- `name`
- `picture`
- `status`: `active`, `inactive`, `blocked`
- `provider`: `google`
- `lastLoginAt`
- `createdAt`

Login flow:

1. Verify Google ID token.
2. Normalize verified email.
3. Find a user by `googleSub`.
4. If not found, find by verified email.
5. If no user exists and auto-create is enabled, create an active or pending user based on admin policy.
6. If an email user exists without `googleSub`, link only when admin policy allows safe linking.
7. Reject blocked users.
8. Update login metadata.
9. Issue an Apiagex-owned session/token.

## Session Or Token Handoff

Google ID tokens are proof of Google authentication, not Apiagex sessions. The verify flow must exchange a valid Google token for a first-party session/token with:

- secure random token material or signed JWT with a clear issuer/audience
- expiry
- revocation strategy
- user id
- provider metadata
- hashed token storage when opaque tokens are used
- optional refresh token rotation

Do not return an owner admin token. Do not return a content API token unless there is a deliberate user-session design that maps app users to API access safely.

## Admin UI Template Requirements

Before implementation, Admin UI should ask for:

- Google OAuth client IDs
- allowed domains
- auto-create users on/off
- default new-user status
- user schema or system user store
- verified email field
- Google subject field
- session/token issuer

The UI should warn that Google login remains disabled until verification keys/library and token issuance are configured.

## Error Rules

Suggested client-facing errors:

- `GOOGLE_TOKEN_INVALID`
- `GOOGLE_ACCOUNT_NOT_ALLOWED`
- `USER_BLOCKED`
- `GOOGLE_LOGIN_NOT_CONFIGURED`

Detailed verifier/provider failures should go to admin logs only.

## Security Rules

- Never trust client-supplied Google profile fields.
- Never decode-only and accept a JWT.
- Never skip `aud`, `iss`, `exp`, and signature verification.
- Never fake Google verification in tests or templates.
- Never auto-link accounts by email unless the verified-email policy is explicit.
- Never issue owner/admin sessions from Google login.
- Always keep provider credentials and client IDs in environment/config, not workflow JSON secrets.

## Hinglish Notes

Ye plan sirf architecture ke liye hai. Google login template tabhi implement hona chahiye jab server Google ID token ko actual verify kare: signature, issuer, audience, expiry, subject, verified email, aur optional allowed domain.

Client se aaya hua email/name/photo trusted nahi hoga. Verified token claims se user lookup/create hoga, blocked user reject hoga, aur success par Apiagex ka apna session/token issue hoga.
