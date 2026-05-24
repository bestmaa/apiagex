import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openMigratedSqliteAdapter } from "@apiagex/database";
import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

const tempPaths: string[] = [];

afterEach(async () => {
  await Promise.all(tempPaths.splice(0).map((path) => rm(path, { force: true, recursive: true })));
});

describe("api request JSONL logs", () => {
  it("writes runtime API requests to rotating JSONL files outside the database", async () => {
    const root = await mkdtemp(join(tmpdir(), "apiagex-api-logs-"));
    tempPaths.push(root);
    const logsPath = join(root, "logs");
    const server = createServer({
      adminAuth: "disabled",
      apiLogMaxBytes: 1,
      apiLogsPath: logsPath,
      database: openMigratedSqliteAdapter(),
    });
    const schemaId = await createSchema(server);
    await allowPublic(server, schemaId);
    await createEntry(server, schemaId);

    await server.inject({ method: "GET", url: "/api/content/article?limit=1" });
    await server.inject({ method: "GET", url: "/api/content/article?limit=1" });
    await server.inject({ method: "GET", url: "/api/content/article?limit=1" });
    await waitForLogFlush();

    const logs = await server.inject({ method: "GET", url: "/api/admin/api-logs?limit=10" });
    expect(logs.statusCode).toBe(200);
    expect(logs.json().files.length).toBeGreaterThan(1);
    expect(logs.json().logs[0]).toMatchObject({
      kind: "content",
      method: "GET",
      path: "/api/content/article",
      statusCode: 200,
    });
    expect(JSON.stringify(logs.json().logs)).not.toContain("authorization");
    await server.close();
  });
});

async function createSchema(server: ReturnType<typeof createServer>): Promise<string> {
  const response = await server.inject({
    method: "POST",
    url: "/api/admin/schemas",
    payload: {
      name: "Article",
      slug: "article",
      fields: [{ name: "Title", slug: "title", type: "text", required: true }],
    },
  });
  expect(response.statusCode).toBe(200);
  return response.json().schema.id as string;
}

async function waitForLogFlush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 30));
}

async function createEntry(server: ReturnType<typeof createServer>, schemaId: string): Promise<void> {
  const response = await server.inject({
    method: "POST",
    url: `/api/admin/schemas/${schemaId}/entries`,
    payload: { data: { title: "Logged" } },
  });
  expect(response.statusCode).toBe(200);
}

async function allowPublic(server: ReturnType<typeof createServer>, schemaId: string): Promise<void> {
  const role = await server.inject({ method: "POST", url: "/api/admin/roles", payload: { name: "public" } });
  expect(role.statusCode).toBe(200);
  const response = await server.inject({
    method: "PUT",
    url: `/api/admin/roles/${role.json().role.id}/permissions`,
    payload: { permissions: [{ schemaId, action: "getAll", allowed: true }] },
  });
  expect(response.statusCode).toBe(200);
}
