const realtimeClientExample = `// Trusted backend route, not browser code.
app.post("/realtime/orders/session", async (request, reply) => {
  const response = await fetch("https://apiagex.example.com/api/realtime/session", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + process.env.APIAGEX_API_TOKEN
    },
    body: JSON.stringify({ schema: "orders", ttlSeconds: 300 })
  });
  if (!response.ok) throw new Error("REALTIME_SESSION_FAILED");
  return reply.send(await response.json());
});

// Browser code.
async function createRealtimeSession() {
  const response = await fetch("/realtime/orders/session", { method: "POST" });
  if (!response.ok) throw new Error("REALTIME_SESSION_FAILED");
  return response.json();
}

async function connectRealtime() {
  const session = await createRealtimeSession();
  const last = localStorage.getItem("orders:lastEventId") || "";
  const socket = new WebSocket(
    "ws://localhost:4000/api/realtime?schema=orders&session=" +
      encodeURIComponent(session.token) +
      "&lastEventId=" + encodeURIComponent(last)
  );

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "event") {
      renderOrder(message.entry);
      localStorage.setItem("orders:lastEventId", message.eventId);
      socket.send(JSON.stringify({ type: "ack", messageId: message.messageId }));
    }
    if (message.type === "ack.timeout") refetchOrders();
  });

  socket.addEventListener("close", () => {
    setTimeout(() => {
      connectRealtime().catch(() => setTimeout(connectRealtime, 5000));
      refetchOrders();
    }, 2000);
  });
}`;

export function RealtimeClientDocs({ focused }: { focused: boolean }) {
  return (
    <section
      className={focused ? "admin-doc-webhooks is-focused" : "admin-doc-webhooks"}
      id="docs-realtime"
      aria-labelledby="realtime-client-title"
    >
      <div>
        <span className="section-kicker">Realtime WebSocket API</span>
        <h3 id="realtime-client-title">Production client flow with session tokens</h3>
        <p>English: Keep the long-lived content API token on a trusted backend. The backend calls Apiagex to create a short-lived one-time realtime session token, the browser receives only `rt_...`, connects with `session=rt_...`, stores the latest `eventId`, and reconnects with a fresh session plus `lastEventId` when the socket closes.</p>
        <p>Hinglish: Permanent content API token trusted backend par rakho. Backend Apiagex ko call karke short-lived one-time realtime session token banata hai, browser ko sirf `rt_...` milta hai, browser `session=rt_...` ke saath connect karta hai, latest `eventId` store karta hai, aur socket close hone par fresh session plus `lastEventId` ke saath reconnect karta hai.</p>
      </div>
      <div className="api-row">
        <strong>Create session</strong>
        <code>POST /api/realtime/session</code>
        <code>Authorization: Bearer API_TOKEN</code>
        <code>{`{ "schema": "orders", "ttlSeconds": 300 }`}</code>
        <code>{`{ "token": "rt_...", "expiresAt": "...", "tokenPrefix": "rt_..." }`}</code>
        <code>Call this from a trusted backend, then return only token/expiresAt to the browser.</code>
      </div>
      <div className="api-row">
        <strong>Connect</strong>
        <code>ws://HOST/api/realtime?schema=orders&amp;session=rt_...</code>
        <code>ws://HOST/api/realtime?schema=orders&amp;session=rt_...&amp;lastEventId=rte_...</code>
        <code>token=API_TOKEN and roleId=ROLE_ID remain development-compatible, but session is the production path.</code>
      </div>
      <div className="api-row">
        <strong>Session rules</strong>
        <code>Default TTL: 5 minutes; minimum 30 seconds; maximum 15 minutes.</code>
        <code>One session token can open one WebSocket connection only.</code>
        <code>Expiry is checked when the socket starts; an already connected socket is not closed by session expiry.</code>
        <code>Reconnect always creates a fresh session token before opening the next socket.</code>
      </div>
      <div className="api-row">
        <strong>Event message</strong>
        <code>type: event</code>
        <code>event: entry.created | entry.updated | entry.deleted</code>
        <code>eventId + messageId + schema + entry + occurredAt</code>
        <code>replayed: true when sent after reconnect with lastEventId</code>
      </div>
      <pre><code>{realtimeClientExample}</code></pre>
      <p>English: WebSocket ack only confirms the browser processed that realtime message. Business status, such as kitchen `preparing` or dashboard `done`, must still be saved with normal PATCH calls. Refetch the current list after reconnect, ack timeout, or a long offline period.</p>
      <p>Hinglish: WebSocket ack sirf confirm karta hai ki browser ne realtime message process kiya. Business status, jaise kitchen `preparing` ya dashboard `done`, hamesha normal PATCH se save karo. Reconnect, ack timeout, ya long offline state ke baad current list refetch karo.</p>
    </section>
  );
}
