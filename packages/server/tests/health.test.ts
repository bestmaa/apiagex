import { describe, expect, it } from "vitest";
import { createServer } from "../src/app.js";

describe("api health route", () => {
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
});
