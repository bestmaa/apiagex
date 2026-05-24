import { describe, expect, it } from "vitest";
import { activeNavRoute, isSettingsRoute, readAdminRoute, settingsSubnavItems } from "./app-route";

describe("admin route helpers", () => {
  it("reads settings subroutes from hashes", () => {
    expect(readAdminRoute("#settings/admin-roles")).toBe("settings/admin-roles");
    expect(readAdminRoute("#settings/content-roles")).toBe("settings/content-roles");
    expect(readAdminRoute("#settings/api-permissions")).toBe("settings/api-permissions");
    expect(readAdminRoute("#settings/custom-api-permissions")).toBe("settings/custom-api-permissions");
    expect(readAdminRoute("#settings/api-tokens")).toBe("settings/api-tokens");
    expect(readAdminRoute("#settings/automation-tokens")).toBe("settings/automation-tokens");
    expect(readAdminRoute("#settings/project-template")).toBe("settings/project-template");
    expect(readAdminRoute("#settings/api-docs")).toBe("settings/api-docs");
    expect(readAdminRoute("#settings/webhooks")).toBe("settings/webhooks");
    expect(readAdminRoute("#settings/realtime")).toBe("settings/realtime");
    expect(readAdminRoute("#settings/workflows")).toBe("settings/workflows");
    expect(readAdminRoute("#docs/webhooks")).toBe("docs/webhooks");
    expect(readAdminRoute("#docs/realtime")).toBe("docs/realtime");
    expect(readAdminRoute("#apis/endpoints")).toBe("apis/endpoints");
    expect(readAdminRoute("#apis/logs")).toBe("apis/logs");
    expect(readAdminRoute("#platform")).toBe("platform");
    expect(readAdminRoute("#roles")).toBe("settings/content-roles");
    expect(readAdminRoute("#missing")).toBe("dashboard");
  });

  it("keeps settings subroutes active under the Settings nav item", () => {
    expect(activeNavRoute("settings/admin-roles")).toBe("settings");
    expect(activeNavRoute("settings/content-roles")).toBe("settings");
    expect(activeNavRoute("settings/api-permissions")).toBe("settings");
    expect(activeNavRoute("settings/custom-api-permissions")).toBe("settings");
    expect(activeNavRoute("settings/api-tokens")).toBe("settings");
    expect(activeNavRoute("settings/automation-tokens")).toBe("settings");
    expect(activeNavRoute("settings/project-template")).toBe("settings");
    expect(activeNavRoute("settings/api-docs")).toBe("settings");
    expect(activeNavRoute("settings/webhooks")).toBe("settings");
    expect(activeNavRoute("settings/workflows")).toBe("settings");
    expect(isSettingsRoute("settings/content-roles")).toBe(true);
    expect(settingsSubnavItems.map((item) => item.label)).toEqual([
      "Admin Roles",
      "Content Roles",
      "API Permissions",
      "Custom API Permissions",
      "API Tokens",
      "AI Automation Tokens",
      "Project Template",
      "API Docs",
      "Webhooks",
      "Realtime API",
      "Workflows",
    ]);
  });

  it("keeps focused docs pages active under the Docs nav item", () => {
    expect(activeNavRoute("docs/webhooks")).toBe("docs");
    expect(activeNavRoute("docs/realtime")).toBe("docs");
  });

  it("keeps platform route separate from tenant settings", () => {
    expect(activeNavRoute("platform")).toBe("platform");
    expect(isSettingsRoute("platform")).toBe(false);
  });
});
