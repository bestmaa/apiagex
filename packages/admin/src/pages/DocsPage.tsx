import { useState } from "react";

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

export function DocsPage() {
  const [copied, setCopied] = useState("");

  async function copyExample(title: string, payload: unknown) {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(title);
  }

  return (
    <section>
      <h2>Docs</h2>
      <p>English: Product docs and readable project summary are served by the same API server.</p>
      <p>Hinglish: Product docs aur readable project summary same API server se serve hote hain.</p>
      <div className="action-row">
        <a href="/doc">Open Docs</a>
        <a href="/readme">Open Readme</a>
      </div>
      <h3>Relation Schema Examples</h3>
      {relationSchemaExamples.map((example) => (
        <article className="api-row" key={example.title}>
          <strong>{example.title}</strong>
          <pre><code>{JSON.stringify(example.payload, null, 2)}</code></pre>
          <button type="button" onClick={() => void copyExample(example.title, example.payload)}>
            Copy JSON
          </button>
        </article>
      ))}
      {copied ? <p className="status-line">Copied: {copied}</p> : null}
    </section>
  );
}
