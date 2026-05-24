import { defineConfig } from "vitepress";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  title: "Apiagex",
  description: "Practical Apiagex product, Admin UI, API, and AI workflow docs.",
  cleanUrls: true,
  lastUpdated: true,
  vite: {
    publicDir: resolve(configDir, "../../public"),
  },
  themeConfig: {
    logo: "/brand/apiagex-logo.svg",
    nav: [
      { link: "/getting-started/new-project", text: "Start" },
      { link: "/admin-ui/", text: "Admin UI" },
      { link: "/apis/generated", text: "APIs" },
      { link: "/ai-codex/", text: "AI/Codex" },
    ],
    search: {
      provider: "local",
    },
    sidebar: [
      {
        text: "Getting Started",
        items: [
          { link: "/getting-started/new-project", text: "Create a Project" },
          { link: "/getting-started/package-runtime", text: "Package Runtime" },
        ],
      },
      {
        text: "Admin UI",
        items: [
          { link: "/admin-ui/", text: "Owner Login And Shell" },
          { link: "/schema-builder/", text: "Schema Builder" },
          { link: "/schema-builder/field-types", text: "Field Types" },
          { link: "/schema-builder/options", text: "Enum And MultiSelect" },
          { link: "/entries/", text: "Entries" },
          { link: "/entries/media", text: "Media, File, Image" },
          { link: "/entries/relations", text: "Relations And Populate" },
        ],
      },
      {
        text: "APIs And Security",
        items: [
          { link: "/apis/generated", text: "Generated Content API" },
          { link: "/apis/management", text: "API Management UI" },
          { link: "/security/roles-permissions", text: "Roles And Permissions" },
          { link: "/security/tokens", text: "Tokens" },
          { link: "/realtime-webhooks/webhooks", text: "Webhooks" },
          { link: "/realtime-webhooks/realtime", text: "Realtime" },
        ],
      },
      {
        text: "Custom And AI",
        items: [
          { link: "/custom-code/custom-apis", text: "Custom API Code" },
          { link: "/custom-code/workflows", text: "Workflow APIs" },
          { link: "/ai-codex/", text: "AI Project Workflow" },
          { link: "/ai-codex/mcp-tools", text: "MCP Tools" },
        ],
      },
      {
        text: "Operations",
        items: [
          { link: "/operations/database-providers", text: "Database Providers" },
          { link: "/operations/export-import", text: "Export And Import" },
          { link: "/operations/multi-tenant", text: "Multi Tenant Preview" },
          { link: "/operations/troubleshooting", text: "Troubleshooting" },
        ],
      },
      {
        text: "Contributing",
        items: [
          { link: "/contributing/screenshots", text: "Screenshot Checklist" },
          { link: "/contributing/examples", text: "Example Standards" },
          { link: "/release/overview", text: "Release Notes" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/bestmaa/apiagex" },
    ],
  },
});
