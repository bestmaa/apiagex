import { useEffect, useState } from "react";
import { listSchemas } from "./api";
import type { SchemaRecord } from "./schema.type";

const actions = ["GET list", "POST create", "GET read", "PUT update", "DELETE remove"];

export function ApiList() {
  const [schemas, setSchemas] = useState<SchemaRecord[]>([]);
  const [status, setStatus] = useState("API list loading");

  useEffect(() => {
    async function load() {
      const result = await listSchemas();
      setSchemas(result.schemas ?? []);
      setStatus(result.ok ? "Dynamic API list ready" : result.error ?? "API list failed");
    }
    void load();
  }, []);

  return (
    <section aria-labelledby="api-list-title">
      <h2 id="api-list-title">Generated APIs</h2>
      <p>{status}</p>
      {schemas.length === 0 ? <p>No generated APIs yet</p> : schemas.map((schema) => (
        <article className="api-row" key={schema.id}>
          <h3>{schema.name}</h3>
          <code>/api/content/{schema.slug}</code>
          <ul>
            {actions.map((action) => <li key={action}>{action}</li>)}
          </ul>
        </article>
      ))}
    </section>
  );
}
