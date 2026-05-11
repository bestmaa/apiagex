const realtimeClientExample = `const socket = new WebSocket(
  "ws://localhost:4000/api/realtime?schema=orders&token=API_TOKEN&lastEventId=" + lastEventId
);

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "event") {
    renderOrder(message.entry);
    lastEventId = message.eventId;
    saveLastEventId(lastEventId);
    socket.send(JSON.stringify({ type: "ack", messageId: message.messageId }));
  }
  if (message.type === "ack.timeout") {
    refetchOrders();
  }
});

socket.addEventListener("close", () => {
  setTimeout(connectAgainAndRefetch, 2000);
});`;

export function RealtimeClientDocs({ focused }: { focused: boolean }) {
  return (
    <section
      className={focused ? "admin-doc-webhooks is-focused" : "admin-doc-webhooks"}
      id="docs-realtime"
      aria-labelledby="realtime-client-title"
    >
      <div>
        <span className="section-kicker">Realtime WebSocket API</span>
        <h3 id="realtime-client-title">Build live screens with ack and refetch</h3>
        <p>English: Enable a collection in Settings, connect with the schema slug, save the latest event id, send an ack after your UI processes each event, and reconnect with `lastEventId` to replay missed events.</p>
        <p>Hinglish: Settings me collection enable karo, schema slug ke saath connect karo, latest event id save karo, har event process hone ke baad ack bhejo, aur missed events ke liye `lastEventId` ke saath reconnect karo.</p>
      </div>
      <div className="api-row">
        <strong>Connect</strong>
        <code>ws://HOST/api/realtime?schema=orders</code>
        <code>ws://HOST/api/realtime?schema=orders&amp;token=API_TOKEN</code>
        <code>ws://HOST/api/realtime?schema=orders&amp;roleId=ROLE_ID</code>
        <code>ws://HOST/api/realtime?schema=orders&amp;lastEventId=rte_...</code>
      </div>
      <div className="api-row">
        <strong>Event message</strong>
        <code>type: event</code>
        <code>event: entry.created | entry.updated | entry.deleted</code>
        <code>eventId + messageId + schema + entry + occurredAt</code>
        <code>replayed: true when sent after reconnect</code>
      </div>
      <pre><code>{realtimeClientExample}</code></pre>
      <p>English: WebSocket ack only confirms the browser processed that realtime message. Business status must still be saved with normal PATCH calls, and clients should refetch the current list after reconnect, ack timeout, or a long offline period.</p>
      <p>Hinglish: WebSocket ack sirf confirm karta hai ki browser ne realtime message process kiya. Business status hamesha normal PATCH se save karo, aur reconnect, ack timeout, ya lambi offline state ke baad current list refetch karo.</p>
    </section>
  );
}
