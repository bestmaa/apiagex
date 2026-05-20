# Workflow Secret Store Plan

This document defines the planned secret system for Workflow API nodes that need provider credentials, for example SMS, email, payment, OAuth, HTTP APIs, and webhook signing.

Ye plan Workflow API nodes ke provider credentials ke liye hai. Secret value workflow JSON me kabhi store nahi hogi.

## Core Rule

Workflow JSON must store only secret references, never secret values.

Allowed:

```json
{
  "type": "httpRequest",
  "config": {
    "url": "https://api.example.com/messages",
    "headers": {
      "authorization": "secret:twilio.authHeader"
    }
  }
}
```

Not allowed:

```json
{
  "headers": {
    "authorization": "Basic real-provider-token-here"
  }
}
```

Hinglish: workflow me `secret:twilio.authHeader` jaisa reference rahega. Real token sirf secret store ya environment me rahega.

## Secret Reference Format

Use a stable reference string:

```txt
secret:<namespace>.<key>
```

Examples:

```txt
secret:twilio.authHeader
secret:sendgrid.apiKey
secret:stripe.secretKey
secret:google.clientSecret
```

Rules:

- `namespace` groups provider or app area.
- `key` identifies the secret inside that group.
- References are case-sensitive after normalization.
- References must be validated before workflow activation.
- Secret references are safe to show in Admin UI, workflow JSON, audit history, and OpenAPI docs because they do not contain the value.

## Storage Options

Apiagex should support two storage modes.

### Env-backed secrets

Env-backed secrets are best for simple deploys, containers, and platforms that already manage secrets.

Admin UI metadata:

```json
{
  "ref": "secret:twilio.authHeader",
  "source": "env",
  "envName": "APIAGEX_SECRET_TWILIO_AUTH_HEADER"
}
```

Runtime reads:

```txt
process.env.APIAGEX_SECRET_TWILIO_AUTH_HEADER
```

Behavior:

- Admin UI can create the reference metadata.
- Admin UI must not display the env value.
- Missing env value should fail workflow activation or test run with `SECRET_NOT_FOUND`.
- Env-backed secret rotation happens outside Apiagex by changing deployment env.

### Database-backed encrypted secrets

Database-backed secrets are useful when admins need to create and rotate secrets from Admin UI.

Secret value must be encrypted before storage. The encryption key must come from environment, not the database.

Required env:

```txt
APIAGEX_SECRET_ENCRYPTION_KEY
```

Recommended model:

- Use AES-256-GCM or an audited platform crypto equivalent.
- Store encrypted value, nonce/iv, authentication tag, and key version.
- Keep the encryption key outside the DB.
- Support future envelope encryption by storing a data-key version per secret.

Planned table shape:

```txt
workflow_secrets
  id
  ref
  namespace
  key
  label
  source                 env | encrypted
  env_name               nullable
  encrypted_value        nullable
  encryption_iv          nullable
  encryption_tag         nullable
  encryption_key_version nullable
  metadata_json
  created_by
  updated_by
  rotated_at
  created_at
  updated_at
```

Strict storage rules:

- Plain secret values must never be persisted.
- Workflow JSON must never contain plain secret values.
- Audit logs must never contain plain secret values.
- Test run history must never contain plain secret values.
- OpenAPI/Swagger output must show only reference names and examples with placeholders.

## Admin UI Secret References

Settings should later include `Secrets` under the workflow/integration area.

Admin UI should support:

- Create secret reference.
- Choose `env` or `encrypted` source.
- For env source, save only env variable name.
- For encrypted source, accept a write-only secret value field.
- Rotate encrypted secret value.
- Rename label/group without changing `ref`.
- Search/filter by namespace, key, label, source, and usage.
- Show where a secret is used by workflow nodes.

Admin UI must not support plain reveal by default.

Display examples:

```txt
secret:twilio.authHeader     env: APIAGEX_SECRET_TWILIO_AUTH_HEADER
secret:stripe.secretKey      encrypted, last rotated 2026-05-20
```

Masked display:

```txt
sk_live_****9f2a
```

The mask may show a short fingerprint, but it must not reveal enough characters to reconstruct the value.

## Runtime Resolution

Workflow executor should resolve secrets just in time.

Flow:

```txt
Workflow JSON -> validate secret refs -> executor reaches node -> resolve secret -> call provider -> redact output -> save run history
```

Runtime rules:

- Resolve only the secrets needed by the current node.
- Do not attach resolved secrets to the workflow definition object.
- Do not return resolved secrets to handlers, Admin UI, API clients, realtime events, webhooks, or logs.
- Cache secrets only in memory and only for a short process-local duration if needed.
- Clear resolved values after node execution when practical.

Expected error codes:

```txt
SECRET_NOT_FOUND
SECRET_ACCESS_DENIED
SECRET_DECRYPT_FAILED
SECRET_ENV_MISSING
SECRET_REFERENCE_INVALID
SECRET_VALUE_REDACTED
```

## Redaction

Redaction is mandatory anywhere workflow execution can produce logs or history.

Redact from:

- Workflow test results.
- Workflow run history.
- HTTP request node debug output.
- Provider response previews.
- Webhook payload previews.
- Realtime event history.
- Admin audit history.
- Server logs.

Redaction should check:

- Exact resolved secret values.
- Known sensitive headers: `authorization`, `cookie`, `set-cookie`, `x-api-key`, `x-auth-token`.
- Known sensitive fields: `password`, `token`, `secret`, `apiKey`, `clientSecret`, `accessToken`, `refreshToken`, `otp`.
- Secret reference values such as `secret:stripe.secretKey` when a context requires hiding references.

Example:

```json
{
  "requestHeaders": {
    "authorization": "[REDACTED]"
  },
  "requestBody": {
    "phone": "+15551230000",
    "otp": "[REDACTED]"
  }
}
```

Hinglish: history me payload dekhne layak rahega, par token/password/API key hamesha `[REDACTED]` rahega.

## Permission And Audit Model

Secret management belongs to control-plane/admin permissions, not content API roles.

Initial permission:

- `owner` can manage all secrets.
- `admin` can manage secrets if admin permission allows settings/integration access.
- Content API roles such as `reader`, `writer`, `public`, or custom API roles must never manage secrets.

Audit records should store:

- Secret reference.
- Action: create, update metadata, rotate, delete, restore.
- Actor user id/email.
- Timestamp.
- Source type.
- Old/new metadata, with secret values redacted.

Audit must not store:

- Secret value.
- Decrypted value.
- Full masked value if the mask is too revealing.

## Workflow Activation Validation

Before a workflow becomes active:

- Scan definition for `secret:*` references.
- Confirm each reference exists.
- Confirm env-backed references have an env variable name.
- Confirm encrypted references can decrypt using current key.
- Confirm node types are allowed to consume secrets.
- Return clear validation errors without revealing the value.

Example activation failure:

```json
{
  "ok": false,
  "code": "SECRET_NOT_FOUND",
  "message": "Workflow uses secret:twilio.authHeader but that secret reference is not configured."
}
```

## Practical Provider Examples

### SMS HTTP node

```json
{
  "type": "httpRequest",
  "id": "send-sms",
  "config": {
    "method": "POST",
    "url": "https://api.twilio.com/2010-04-01/Accounts/{{env.TWILIO_ACCOUNT_SID}}/Messages.json",
    "headers": {
      "authorization": "secret:twilio.authHeader"
    },
    "body": {
      "To": "{{body.phone}}",
      "From": "{{settings.smsFrom}}",
      "Body": "Your OTP is {{runtime.otp}}"
    }
  }
}
```

### Payment HTTP node

```json
{
  "type": "httpRequest",
  "id": "create-payment-intent",
  "config": {
    "method": "POST",
    "url": "https://api.stripe.com/v1/payment_intents",
    "headers": {
      "authorization": "Bearer secret:stripe.secretKey"
    },
    "body": {
      "amount": "{{body.amount}}",
      "currency": "inr"
    }
  }
}
```

The executor must replace `secret:stripe.secretKey` only at call time and redact the final `authorization` header from all stored output.

## Testing Plan

Minimum tests before implementation is complete:

- Workflow JSON validation rejects plain sensitive fields for known secret locations.
- Workflow JSON accepts `secret:*` references.
- Activation fails when secret reference is missing.
- Env-backed secret resolves from env and never appears in run history.
- Encrypted secret decrypts only with `APIAGEX_SECRET_ENCRYPTION_KEY`.
- Wrong encryption key returns `SECRET_DECRYPT_FAILED`.
- Admin UI write-only field does not repopulate saved secret values.
- Workflow test result redacts sensitive headers and fields.
- Server logs redact sensitive values.
- Export/import keeps references but not values.

## Implementation Order

1. Add secret reference validator and redaction utility.
2. Add secret repository and migrations.
3. Add env-backed secret metadata first.
4. Add encrypted-at-rest secret storage.
5. Add Admin UI Settings > Secrets.
6. Add workflow activation validation for secret references.
7. Add runtime secret resolver.
8. Integrate resolver with HTTP/provider nodes.
9. Add audit/history redaction tests.

This order keeps provider nodes from shipping before their secret safety model exists.
