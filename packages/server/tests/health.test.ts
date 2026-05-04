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
    ["/doc", "Apiagex Docs"],
    ["/readme", "Apiagex Readme"],
    ["/adminui", "Apiagex Admin UI"],
  ])("serves %s from the same server", async (url, heading) => {
    const server = createServer();

    const response = await server.inject({ method: "GET", url });

    expect(response.statusCode).toBe(200);
    expect(response.headers["content-type"]).toContain("text/html");
    expect(response.body).toContain(`<h1>${heading}</h1>`);
  });
});
