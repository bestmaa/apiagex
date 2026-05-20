# Workflow HTTP Request Node Plan

This document defines the planned HTTP request node for Workflow APIs. The node is intended for provider integrations such as SMS, email, payment, OAuth token exchange, CRM sync, and internal service calls.

Ye plan external API call ke liye hai. HTTP node useful hoga, lekin unrestricted URL call allow nahi hogi.

## Goal

Allow a workflow to call a configured external HTTP endpoint safely and return selected response data to later nodes.

Example use cases:

- Send OTP by SMS.
- Send transactional email.
- Create a payment intent.
- Verify OAuth token or exchange code.
- Notify an internal service.
- Sync order status to another system.

## Non-goals

- No arbitrary JavaScript execution.
- No unrestricted private-network calls.
- No long-running polling.
- No streaming response support in MVP.
- No raw secret values in workflow JSON.
- No full provider SDK execution inside the workflow runtime.

## Node Shape

Planned workflow JSON:

```json
{
  "id": "send-otp-sms",
  "type": "httpRequest",
  "config": {
    "method": "POST",
    "url": "https://api.provider.example/messages",
    "headers": {
      "authorization": "Bearer secret:sms.apiKey",
      "content-type": "application/json"
    },
    "query": {
      "version": "v1"
    },
    "body": {
      "to": "{{body.phone}}",
      "message": "Your OTP is {{runtime.otp}}"
    },
    "timeoutMs": 5000,
    "retry": {
      "attempts": 2,
      "backoffMs": 300
    },
    "successStatus": [200, 201, 202],
    "outputKey": "smsResult",
    "responseBodyMode": "json"
  }
}
```

Output available to later nodes:

```json
{
  "steps": {
    "send-otp-sms": {
      "status": 202,
      "headers": {
        "content-type": "application/json"
      },
      "body": {
        "id": "msg_123"
      }
    }
  },
  "smsResult": {
    "id": "msg_123"
  }
}
```

## Supported Methods

MVP should allow:

```txt
GET
POST
PUT
PATCH
DELETE
```

Rules:

- Method is required.
- Method must be uppercase after normalization.
- `GET` and `DELETE` should ignore body unless explicitly allowed later.
- `HEAD`, `OPTIONS`, and streaming methods are out of scope for MVP.

## URL Safety Model

The node must not call unrestricted URLs. Without a safety model, this becomes SSRF-prone.

Required controls:

- URL must be absolute `https://` by default.
- `http://` should be denied unless an explicit development setting allows it.
- Hostname must match an allowlist.
- Private IP ranges must be blocked after DNS resolution.
- Loopback, link-local, multicast, and metadata service IPs must be blocked.
- Redirects must be disabled by default or revalidated against the same allowlist.
- URL templates may replace path/query values, but not the host unless host is separately allowlisted.

Blocked targets:

```txt
127.0.0.1
localhost
0.0.0.0
::1
169.254.169.254
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
fc00::/7
fe80::/10
```

Admin UI should later manage allowed hosts:

```txt
api.twilio.com
api.sendgrid.com
api.stripe.com
oauth2.googleapis.com
hooks.slack.com
```

Hinglish: admin ko pehle provider host allow karna hoga. Workflow author sirf allowed host par HTTP call bana payega.

## URL Templates

Allowed:

```txt
https://api.example.com/orders/{{body.orderId}}
https://api.example.com/search?q={{query.q}}
```

Not allowed in MVP:

```txt
{{body.url}}
https://{{body.host}}/orders
```

Reason: user-controlled host templates can bypass SSRF protection.

## Headers

Headers support static values, templates, and secret references.

Example:

```json
{
  "authorization": "Bearer secret:stripe.secretKey",
  "idempotency-key": "{{request.id}}",
  "content-type": "application/json"
}
```

Rules:

- Header names must be lowercase normalized in stored config.
- Block hop-by-hop headers such as `connection`, `transfer-encoding`, `upgrade`, `proxy-authorization`.
- Redact sensitive headers in logs/history.
- Secrets must use the secret reference plan from `docs/workflow-secret-store-plan.md`.
- Resolved secret values must never be stored in workflow JSON or history.

## Query And Body Templates

Query and body values can use the existing safe workflow expression syntax.

Allowed sources:

```txt
body.*
query.*
params.*
entry.*
steps.*
runtime.*
settings.*
```

Rules:

- Templates must be evaluated before sending the request.
- Missing required template values should fail with `HTTP_TEMPLATE_VALUE_MISSING`.
- Large body output should be size-limited.
- Binary uploads are out of scope for MVP.

## Timeout

Default:

```txt
timeoutMs: 5000
```

Allowed range:

```txt
1000 <= timeoutMs <= 15000
```

Behavior:

- Timeout applies to the full request.
- Timeout returns `HTTP_REQUEST_TIMEOUT`.
- Timed-out request is recorded as failed with redacted config.
- Workflow runtime limit still caps the total execution time.

## Retry

Retry should be explicit and bounded.

Config:

```json
{
  "retry": {
    "attempts": 2,
    "backoffMs": 300
  }
}
```

Rules:

- `attempts` means additional tries after the first call.
- Maximum retry attempts: `2` in MVP.
- Maximum backoff: `2000ms`.
- Retry only network errors, timeouts, and `429`/`5xx` by default.
- Do not retry `400`/`401`/`403`/`404` by default.
- Retrying non-idempotent calls should require idempotency key guidance in docs.

## Response Handling

Config:

```json
{
  "successStatus": [200, 201, 202],
  "responseBodyMode": "json",
  "outputKey": "paymentResult"
}
```

Supported response body modes:

```txt
json
text
none
```

Rules:

- `json` parses JSON and fails with `HTTP_RESPONSE_JSON_INVALID` when parsing fails.
- `text` stores a size-limited string preview.
- `none` stores only status and selected headers.
- Response body stored in history must be redacted and size-limited.
- Default max stored body size: `16KB`.
- Provider response headers should be filtered to safe headers only.

## Error Model

Planned error codes:

```txt
HTTP_URL_NOT_ALLOWED
HTTP_PRIVATE_NETWORK_BLOCKED
HTTP_REDIRECT_NOT_ALLOWED
HTTP_TEMPLATE_VALUE_MISSING
HTTP_SECRET_NOT_FOUND
HTTP_REQUEST_TIMEOUT
HTTP_REQUEST_FAILED
HTTP_STATUS_NOT_ALLOWED
HTTP_RESPONSE_TOO_LARGE
HTTP_RESPONSE_JSON_INVALID
HTTP_RETRY_LIMIT_REACHED
```

Error response shape:

```json
{
  "ok": false,
  "code": "HTTP_STATUS_NOT_ALLOWED",
  "message": "HTTP request returned status 401, which is not in successStatus.",
  "nodeId": "create-payment-intent"
}
```

Do not include request secrets or full provider response bodies in errors.

## Admin UI Requirements

HTTP node form should include:

- Method selector.
- Allowed host URL input.
- Header key/value editor.
- Query key/value editor.
- Body JSON/template editor.
- Timeout field.
- Retry attempts/backoff fields.
- Success status multi-select.
- Output key input.
- Response mode selector.
- Secret reference picker.
- Test run panel with redacted preview.

Validation messages should explain whether the problem is URL safety, template syntax, missing secret reference, or response handling.

## OpenAPI/Swagger Output

Workflow OpenAPI output should document that the route may call external providers, but it must not expose provider secrets.

Example extension:

```json
{
  "x-apiagex-workflow-nodes": [
    {
      "id": "send-otp-sms",
      "type": "httpRequest",
      "method": "POST",
      "host": "api.provider.example",
      "usesSecrets": ["secret:sms.apiKey"]
    }
  ]
}
```

`usesSecrets` is optional and should show references only, not values.

## Testing Plan

Minimum tests before implementation:

- Reject non-allowed hosts.
- Reject private IP and metadata service URLs after DNS resolution.
- Reject host templates.
- Allow path/query templates.
- Resolve secret references at call time.
- Redact authorization headers from run history.
- Enforce timeout.
- Retry only allowed failures.
- Fail on unexpected status.
- Parse JSON response.
- Size-limit response body.
- Browser test validates HTTP node form and redacted test output.

## Implementation Order

1. Add config validator.
2. Add URL allowlist and private-network guard.
3. Add HTTP client wrapper with timeout and redirect policy.
4. Add template rendering for URL path/query, headers, and body.
5. Add secret resolver integration from the secret store plan.
6. Add redaction on request/response history.
7. Add executor node.
8. Add Admin UI form fields.
9. Add OpenAPI output.
10. Add mocked provider tests and browser test.

Do not implement provider calls before URL safety and secret redaction are in place.
