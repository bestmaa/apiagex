import { BookOpen, ClipboardList, Database, GitBranch, KeyRound, Network, ShieldCheck, Table2, UserRound } from "lucide-react";
import { WebhookVerificationDocs } from "./WebhookVerificationDocs";
import { RealtimeClientDocs } from "./RealtimeClientDocs";

const workflowSummaries = [
  {
    icon: UserRound,
    title: "Owner setup",
    route: "#dashboard",
    routeLabel: "Open dashboard",
    summary: "Bootstrap or log in as the owner, then use the same session to manage every protected admin workflow.",
  },
  {
    icon: Database,
    title: "Schema builder",
    route: "#schemas",
    routeLabel: "Build schemas",
    summary: "Create collections with text, number, boolean, date, JSON, and relation fields before adding content.",
  },
  {
    icon: Table2,
    title: "Entries",
    route: "#entries",
    routeLabel: "Manage entries",
    summary: "Select a schema, create entries, edit saved content, and fill relation fields with existing entry IDs.",
  },
  {
    icon: KeyRound,
    title: "Dynamic APIs",
    route: "#apis",
    routeLabel: "Review APIs",
    summary: "Use generated endpoints for each schema and copy request examples from the API route list.",
  },
  {
    icon: Network,
    title: "Relations",
    route: "#schemas",
    routeLabel: "Model relations",
    summary: "Choose one-to-one, one-to-many, many-to-one, or many-to-many when a field points to another schema.",
  },
  {
    icon: ShieldCheck,
    title: "RBAC",
    route: "#settings/content-roles",
    routeLabel: "Configure content roles",
    summary: "Configure API roles in Settings, assign allow/block permissions per schema and API method, then assign users to exactly one API role.",
  },
  {
    icon: Network,
    title: "Webhooks",
    route: "#settings/webhooks",
    routeLabel: "Configure webhooks",
    summary: "Send signed entry create, update, and delete events to external systems.",
  },
  {
    icon: GitBranch,
    title: "Workflow APIs",
    route: "#settings/workflows",
    routeLabel: "Build workflows",
    summary: "Create active workflow routes, then allow public or token access from Custom API Permissions.",
  },
];

const relationSchemaExamples = [
  {
    title: "Author to Articles",
    payload: {
      name: "Author",
      slug: "author",
      fields: [
        { name: "Name", slug: "name", type: "text", required: true },
        {
          name: "Articles",
          slug: "articles",
          type: "relation",
          relationSchemaId: "ARTICLE_SCHEMA_ID",
          relationType: "oneToMany",
        },
      ],
    },
  },
  {
    title: "Article to Category",
    payload: {
      name: "Article",
      slug: "article",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Category",
          slug: "category",
          type: "relation",
          relationSchemaId: "CATEGORY_SCHEMA_ID",
          relationType: "manyToOne",
          required: true,
        },
      ],
    },
  },
  {
    title: "Article to Tags",
    payload: {
      name: "Article",
      slug: "article",
      fields: [
        { name: "Title", slug: "title", type: "text", required: true },
        {
          name: "Tags",
          slug: "tags",
          type: "relation",
          relationSchemaId: "TAG_SCHEMA_ID",
          relationType: "manyToMany",
        },
      ],
    },
  },
  {
    title: "User Profile to User",
    payload: {
      name: "User Profile",
      slug: "user-profile",
      fields: [
        { name: "Bio", slug: "bio", type: "longText" },
        {
          name: "User",
          slug: "user",
          type: "relation",
          relationSchemaId: "USER_SCHEMA_ID",
          relationType: "oneToOne",
          required: true,
        },
      ],
    },
  },
];

const workflowChecklists = [
  {
    title: "First owner setup",
    items: [
      "Open dashboard and submit owner email plus password.",
      "Keep the owner session active before using protected admin pages.",
      "Use Reset session when you need to test owner login again.",
    ],
  },
  {
    title: "Schema creation",
    items: [
      "Create the target schema first when another schema will relate to it.",
      "Add fields with clear slugs and mark only truly required fields as required.",
      "Save the schema before creating entries or reviewing generated APIs.",
    ],
  },
  {
    title: "Relation modeling",
    items: [
      "Use one-to-one for a single paired record.",
      "Use one-to-many or many-to-one when one side owns a list.",
      "Use many-to-many when both sides can connect to multiple entries.",
    ],
  },
  {
    title: "RBAC setup",
    items: [
      "Use Settings > Content Roles for API users; owner/admin roles stay outside this permission matrix.",
      "Set allowed schema/API actions in the permission matrix.",
      "Assign each content API user exactly one API role and test allow/block behavior with headers.",
    ],
  },
];

export function DocsPage({ focus }: { focus?: "webhooks" | "realtime" }) {
  return (
    <section className="admin-docs" aria-labelledby="admin-docs-title">
      <div className="admin-docs-hero">
        <div>
          <span className="section-kicker">Admin docs</span>
          <h2 id="admin-docs-title">Build Apiagex in the right order</h2>
          <p>English: Use this page as the short in-app map for owner, schema, entry, API, relation, role, and user workflows.</p>
          <p>Hinglish: Ye page app ke andar short map hai, jisse setup aur admin flow order me samajh aaye.</p>
        </div>
        <div className="admin-docs-links" aria-label="Public documentation links">
          <a aria-label="Open public docs at /doc" href="/doc">
            <span>
              <BookOpen aria-hidden="true" size={16} />
              Public docs
            </span>
            <code>/doc</code>
          </a>
          <a aria-label="Open readable project summary at /readme" href="/readme">
            <span>
              <ClipboardList aria-hidden="true" size={16} />
              Readme
            </span>
            <code>/readme</code>
          </a>
          <a aria-label="Open Swagger UI" href="/swagger">
            <span>
              <ClipboardList aria-hidden="true" size={16} />
              Swagger UI
            </span>
            <code>enable in Settings / API Docs</code>
          </a>
        </div>
      </div>

      <div className="admin-doc-grid" aria-label="Admin workflow summary">
        {workflowSummaries.map((item) => {
          const Icon = item.icon;
          return (
            <article className="admin-doc-card" key={item.title}>
              <div className="admin-doc-card-header">
                <span className="admin-doc-icon"><Icon aria-hidden="true" size={18} /></span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.summary}</p>
              <a href={item.route}>{item.routeLabel}</a>
            </article>
          );
        })}
      </div>

      <section className="admin-doc-checklists" aria-labelledby="workflow-checklists-title">
        <div>
          <span className="section-kicker">Setup checklists</span>
          <h3 id="workflow-checklists-title">What to finish before testing APIs</h3>
        </div>
        <div className="admin-doc-checklist-grid">
          {workflowChecklists.map((checklist) => (
            <article className="admin-doc-checklist" key={checklist.title}>
              <h4>{checklist.title}</h4>
              <ul>
                {checklist.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-doc-relations" aria-labelledby="workflow-api-examples-title">
        <div>
          <span className="section-kicker">Workflow API calls</span>
          <h3 id="workflow-api-examples-title">Public and token examples</h3>
          <p>Active workflows are mounted under <code>/api/custom</code> and use Settings / Custom API Permissions. Inactive workflows are not callable.</p>
        </div>
        <article className="api-row">
          <strong>Public workflow route</strong>
          <p>Allow the route for <code>public - open/no token</code>, then call without an Authorization header.</p>
          <pre><code>{`curl -X POST http://127.0.0.1:4000/api/custom/orders/status \\
  -H "content-type: application/json" \\
  -d '{"orderId":"ord_123","status":"ready"}'`}</code></pre>
        </article>
        <article className="api-row">
          <strong>Token-protected workflow route</strong>
          <p>Allow the route for a content API role, create a token for that role, then send the token with the request.</p>
          <pre><code>{`curl -X POST http://127.0.0.1:4000/api/custom/orders/status \\
  -H "Authorization: Bearer API_TOKEN" \\
  -H "content-type: application/json" \\
  -d '{"orderId":"ord_123","status":"ready"}'`}</code></pre>
          <p>Blocked routes return <code>CUSTOM_API_PERMISSION_DENIED</code>; wrong or revoked tokens return <code>API_TOKEN_INVALID</code>.</p>
        </article>
        <article className="api-row">
          <strong>Register user template</strong>
          <p><code>Create register template</code> creates an inactive <code>POST /api/custom/auth/register</code> starter. Create a <code>users</code> content schema with <code>email</code>, <code>passwordHash</code>, and <code>status</code> fields before testing it.</p>
          <p>The template validates <code>password</code> but does not store <code>{`{{body.password}}`}</code>. It writes <code>PASSWORD_HASH_PLACEHOLDER_REPLACE_WITH_SERVER_SIDE_HASHING</code> until you add real server-side hashing.</p>
        </article>
        <article className="api-row">
          <strong>OTP template plan</strong>
          <p>OTP login is planning-only. Read <code>docs/otp-workflow-template-plan.md</code> before implementation; it requires hashed OTP storage, expiry, retry limits, provider config, and secure token issuance.</p>
          <p>Raw OTP codes must never be stored, logged, or returned, and verify must consume the challenge before issuing a session/token.</p>
        </article>
        <article className="api-row">
          <strong>Google login plan</strong>
          <p>Google login is planning-only. Read <code>docs/google-login-workflow-template-plan.md</code> before implementation; it requires server-side ID token verification, allowed domains, user lookup/create rules, and session/token handoff.</p>
          <p>Do not trust client profile fields or decode-only JWT payloads. Verify signature, issuer, audience, expiry, subject, verified email, and optional hosted domain.</p>
        </article>
        <article className="api-row">
          <strong>Order status template</strong>
          <p><code>Create order status template</code> creates an inactive <code>POST /api/custom/orders/status</code> starter. It validates <code>orderId</code> and <code>status</code>, updates the order entry, and returns the updated order.</p>
          <p>Allowed transitions are <code>pending -&gt; preparing</code>, <code>pending -&gt; cancelled</code>, <code>preparing -&gt; ready</code>, <code>preparing -&gt; cancelled</code>, and <code>ready -&gt; completed</code>. Invalid transitions return <code>ORDER_STATUS_TRANSITION_INVALID</code>.</p>
        </article>
      </section>

      <WebhookVerificationDocs focused={focus === "webhooks"} />
      <RealtimeClientDocs focused={focus === "realtime"} />

      <section className="admin-doc-relations" aria-labelledby="relation-examples-title">
        <div>
          <span className="section-kicker">Relation examples</span>
          <h3 id="relation-examples-title">Schema payload patterns</h3>
        </div>
        {relationSchemaExamples.map((example) => (
          <article className="api-row" key={example.title}>
            <strong>{example.title}</strong>
            <pre><code>{JSON.stringify(example.payload, null, 2)}</code></pre>
          </article>
        ))}
      </section>
    </section>
  );
}
