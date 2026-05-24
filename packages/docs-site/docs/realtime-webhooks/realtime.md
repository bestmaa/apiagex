# Realtime API

Open:

```text
/adminui/#settings/realtime
```

<div class="screen">
  <img src="/screenshots/realtime/realtime-settings.png" alt="Apiagex realtime settings screen">
</div>

Realtime lets client screens receive WebSocket events when generated content changes.

## What You Enable In Admin UI

1. Open `/adminui/#settings/realtime`.
2. Pick the schema that should send live events, for example `orders`.
3. Enable realtime.
4. Select the events the frontend needs:
   - `entry.created`
   - `entry.updated`
   - `entry.deleted`
5. Save.
6. Give the calling API role either `realtime` permission or `getAll` permission for that schema.

Hinglish: Realtime tab me schema on karo, events select karo, phir jis token role se frontend connect karega us role ko realtime permission do.

## Production Connection Model

Use short-lived realtime session tokens:

```bash
curl -X POST http://127.0.0.1:4000/api/realtime/session \
  -H "authorization: Bearer <TOKEN>" \
  -H "content-type: application/json" \
  -d '{"schema":"orders","ttlSeconds":120}'
```

Response:

```json
{
  "ok": true,
  "token": "<REALTIME_SESSION>",
  "expiresAt": "2026-05-24T10:32:00.000Z",
  "tokenPrefix": "rt_abc123"
}
```

Then connect with the issued session token and the schema slug:

```text
ws://127.0.0.1:4000/api/realtime?schema=orders&session=<REALTIME_SESSION>
```

::: warning Session Tokens Are One-Time
Realtime session tokens are short-lived and consumed by the WebSocket connection. For reconnects, create a fresh session token.
:::

## Event Flow

1. Enable realtime for a schema.
2. Create a short-lived session token.
3. Connect WebSocket client with `schema` and `session`.
4. Create/update/delete content.
5. Receive event.
6. Send ack for each event.
7. Store the last `eventId` on the frontend.
8. Reconnect with a fresh session and `lastEventId` if needed.

Hinglish: Production me long-lived API token WebSocket URL me mat rakho. Short-lived realtime session use karo.

## Frontend Example

This example creates a realtime session using a normal content API token, connects to the WebSocket, handles `ready`, `ping`, and `event`, sends event acks, and stores the last event id for replay.

```ts
const API_BASE_URL = "http://127.0.0.1:4000";
const WS_BASE_URL = "ws://127.0.0.1:4000";
const API_TOKEN = "<TOKEN>";
const SCHEMA = "orders";

let lastEventId = localStorage.getItem(`apiagex:last-event:${SCHEMA}`);

async function createRealtimeSession() {
  const response = await fetch(`${API_BASE_URL}/api/realtime/session`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${API_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      schema: SCHEMA,
      ttlSeconds: 120,
    }),
  });

  if (!response.ok) {
    throw new Error(`Realtime session failed: ${response.status}`);
  }

  const body = await response.json();
  return body.token as string;
}

async function connectRealtime() {
  const session = await createRealtimeSession();
  const url = new URL(`${WS_BASE_URL}/api/realtime`);
  url.searchParams.set("schema", SCHEMA);
  url.searchParams.set("session", session);
  if (lastEventId) url.searchParams.set("lastEventId", lastEventId);

  const socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    console.log("Apiagex realtime connected");
  });

  socket.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);

    if (payload.type === "ready") {
      console.log("Realtime ready", payload.connectionId);
      return;
    }

    if (payload.type === "ping") {
      socket.send(JSON.stringify({ type: "pong" }));
      return;
    }

    if (payload.type === "event") {
      lastEventId = payload.eventId;
      localStorage.setItem(`apiagex:last-event:${SCHEMA}`, payload.eventId);
      applyRealtimeEvent(payload);

      socket.send(JSON.stringify({
        type: "ack",
        messageId: payload.messageId,
      }));
      return;
    }

    if (payload.type === "ack.timeout") {
      console.warn("Event ack timed out", payload.eventId);
      return;
    }
  });

  socket.addEventListener("close", () => {
    setTimeout(() => {
      void connectRealtime();
    }, 1500);
  });

  socket.addEventListener("error", (event) => {
    console.error("Realtime socket error", event);
  });
}

function applyRealtimeEvent(payload: {
  event: "entry.created" | "entry.updated" | "entry.deleted";
  eventId: string;
  messageId: string;
  schema: { id: string; slug: string };
  entry: { id: string; data: Record<string, unknown> };
  replayed?: true;
}) {
  if (payload.event === "entry.created") {
    console.log("Add entry to UI", payload.entry);
  }

  if (payload.event === "entry.updated") {
    console.log("Replace entry in UI", payload.entry);
  }

  if (payload.event === "entry.deleted") {
    console.log("Remove entry from UI", payload.entry.id);
  }
}

void connectRealtime();
```

## Message Shapes

### Ready

```json
{
  "type": "ready",
  "connectionId": "rtc_...",
  "schema": {
    "id": "schema_id",
    "slug": "orders"
  },
  "heartbeatMs": 25000,
  "ackTimeoutMs": 15000
}
```

### Event

```json
{
  "type": "event",
  "event": "entry.updated",
  "eventId": "realtime_event_id",
  "messageId": "message_id",
  "schema": {
    "id": "schema_id",
    "slug": "orders"
  },
  "entry": {
    "id": "entry_id",
    "data": {
      "status": "paid"
    }
  },
  "occurredAt": "2026-05-24T10:30:00.000Z",
  "delivery": {
    "ackRequired": true,
    "ackTimeoutMs": 15000
  }
}
```

### Ack From Client

```json
{
  "type": "ack",
  "messageId": "message_id"
}
```

### Replay

If a frontend disconnects after receiving `eventId`, reconnect with a fresh session and `lastEventId`:

```text
ws://127.0.0.1:4000/api/realtime?schema=orders&session=<NEW_REALTIME_SESSION>&lastEventId=<LAST_EVENT_ID>
```

Replayed events include:

```json
{
  "type": "event",
  "event": "entry.updated",
  "eventId": "next_event_id",
  "messageId": "message_id",
  "replayed": true
}
```

## Development Shortcut

For local development only, the WebSocket can also accept:

```text
ws://127.0.0.1:4000/api/realtime?schema=orders&token=<TOKEN>
```

Production docs should prefer `POST /api/realtime/session` because the token in a WebSocket URL can leak through logs, browser tooling, or shared screenshots.
