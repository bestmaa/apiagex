const webhookVerifierExample = `import crypto from "node:crypto";

function verifyApiagexWebhook(req, rawBody) {
  const secret = process.env.APIAGEX_WEBHOOK_SECRET;
  const deliveryId = req.headers["x-apiagex-delivery-id"];
  const timestamp = req.headers["x-apiagex-timestamp"];
  const signature = req.headers["x-apiagex-signature"];
  const ageMs = Math.abs(Date.now() - Date.parse(timestamp));
  if (!deliveryId || !timestamp || !signature || ageMs > 5 * 60 * 1000) return false;
  if (alreadyProcessed(deliveryId)) return false;
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(timestamp + "." + deliveryId + "." + rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}`;

export function WebhookVerificationDocs({ focused }: { focused: boolean }) {
  return (
    <section
      className={focused ? "admin-doc-webhooks is-focused" : "admin-doc-webhooks"}
      id="docs-webhooks"
      aria-labelledby="webhook-verification-title"
    >
      <div>
        <span className="section-kicker">Webhook verification</span>
        <h3 id="webhook-verification-title">Reject fake and replayed requests</h3>
        <p>English: Store the same signing secret in your receiver, keep the raw request body, reject timestamps older than five minutes, store every delivery id you process, and compare the HMAC signature with a timing-safe check.</p>
        <p>Hinglish: Receiver me wahi signing secret store karo, raw request body preserve karo, five minutes se old timestamp reject karo, har processed delivery id store karo, aur HMAC signature ko timing-safe check se compare karo.</p>
      </div>
      <div className="api-row">
        <strong>Headers to verify</strong>
        <code>x-apiagex-delivery-id</code>
        <code>x-apiagex-timestamp</code>
        <code>x-apiagex-signature</code>
      </div>
      <pre><code>{webhookVerifierExample}</code></pre>
    </section>
  );
}
