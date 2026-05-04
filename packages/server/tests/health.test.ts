import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("api health route", () => {
  it("returns the API root path catalog", async () => {
    const server = createServer();

    const response = await server.inject({
      method: "GET",
      url: "/api",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "apiagex",
      paths: ["/api", "/doc", "/readme", "/adminui"],
    });
  });

  it("returns the Apiagex health payload", async () => {
    const server = createServer();

    const response = await server.inject({
      method: "GET",
      url: "/api/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      service: "apiagex",
      path: "/api/health",
    });
  });

  it.each([
    ["/doc", "Apiagex Docs", "Completed MVP base paths"],
    ["/readme", "Apiagex Readme", "fresh MVP headless CMS/API platform"],
    ["/adminui", "Apiagex Admin UI", "id=\"root\""],
  ])("serves %s from the same server", async (url, heading, detail) => {
    const server = createServer();

    const response = await server.inject({ method: "GET", url });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain(heading);
    if (detail) {
      expect(response.body).toContain(detail);
    }
  });

  it("serves the React Admin UI shell", async () => {
    const server = createServer();
    const response = await server.inject({ method: "GET", url: "/adminui" });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('id="root"');
    expect(response.body).toContain("script");
  });
});
