import { describe, expect, it } from "vitest";
import { activeNavRoute, isSettingsRoute, readAdminRoute, settingsSubnavItems } from "./app-route";

describe("admin route helpers", () => {
  it("reads settings subroutes from hashes", () => {
    expect(readAdminRoute("#settings/admin-roles")).toBe("settings/admin-roles");
    expect(readAdminRoute("#settings/content-roles")).toBe("settings/content-roles");
    expect(readAdminRoute("#roles")).toBe("settings/content-roles");
    expect(readAdminRoute("#missing")).toBe("dashboard");
  });

  it("keeps settings subroutes active under the Settings nav item", () => {
    expect(activeNavRoute("settings/admin-roles")).toBe("settings");
    expect(activeNavRoute("settings/content-roles")).toBe("settings");
    expect(isSettingsRoute("settings/content-roles")).toBe(true);
    expect(settingsSubnavItems.map((item) => item.label)).toEqual([
      "Admin Roles",
      "Content Roles",
    ]);
  });
});
