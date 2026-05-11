const realtimeClientExample = `const socket = new WebSocket(
  "ws://localhost:4000/api/realtime?schema=orders&token=API_TOKEN"
);

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "event") {
    renderOrder(message.entry);
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
        <p>English: Enable a collection in Settings, connect to the WebSocket with that schema slug, render each event, send an ack after your UI processes it, and refetch the list after reconnect or ack timeout.</p>
        <p>Hinglish: Settings me collection enable karo, schema slug ke saath WebSocket connect karo, event milte hi UI update karo, process hone ke baad ack bhejo, aur reconnect ya ack timeout par list dobara fetch karo.</p>
      </div>
      <div className="api-row">
        <strong>Connect</strong>
        <code>ws://HOST/api/realtime?schema=orders</code>
        <code>ws://HOST/api/realtime?schema=orders&amp;token=API_TOKEN</code>
        <code>ws://HOST/api/realtime?schema=orders&amp;roleId=ROLE_ID</code>
      </div>
      <div className="api-row">
        <strong>Event message</strong>
        <code>type: event</code>
        <code>event: entry.created | entry.updated | entry.deleted</code>
        <code>messageId + schema + entry + occurredAt</code>
      </div>
      <pre><code>{realtimeClientExample}</code></pre>
      <p>English: WebSocket delivery only proves the browser connection received a message after it sends ack. Business status should still be saved through normal PATCH calls, like changing an order to preparing, so every screen can recover by refetching current data.</p>
      <p>Hinglish: WebSocket delivery sirf ye prove karta hai ki browser connection ne ack bheja. Business status hamesha normal PATCH se save karo, jaise order ko preparing karna, taaki reconnect ke baad har screen current data refetch karke recover kar sake.</p>
    </section>
  );
}
