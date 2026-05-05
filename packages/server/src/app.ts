import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { migrateMvpDatabase, openSqliteDatabase } from "@apiagex/database";
import type {
  ApiagexServer,
  ApiRootResponse,
  CreateServerOptions,
  HealthResponse,
} from "./app.type.js";
import { bootstrapOwner, loginOwner } from "./owner-bootstrap.js";
import { readAdminIndex, resolveAdminUiAsset } from "./admin-ui.js";
import { registerContentRoutes } from "./content-routes.js";
import { registerSchemaRoutes } from "./schema-routes.js";
import { registerEntryRoutes } from "./entry-routes.js";
import { registerRoleRoutes } from "./role-routes.js";
import { registerUserRoutes } from "./user-routes.js";
import { loginUser } from "./user-auth.js";

export function createServer(options: CreateServerOptions = {}): ApiagexServer {
  const server = Fastify({ logger: false });
  const database = options.database ?? openSqliteDatabase();
  migrateMvpDatabase(database);
  server.register(fastifyStatic, {
    prefix: "/adminui/",
    root: resolveAdminUiAsset().root,
  });
  registerSchemaRoutes(server, database);
  registerEntryRoutes(server, database);
  registerContentRoutes(server, database);
  registerRoleRoutes(server, database);
  registerUserRoutes(server, database);

  server.get("/api", async (): Promise<ApiRootResponse> => ({
    ok: true,
    service: "apiagex",
    paths: ["/api", "/doc", "/readme", "/adminui"],
  }));

  server.get("/api/health", async (): Promise<HealthResponse> => ({
    ok: true,
    service: "apiagex",
    path: "/api/health",
  }));

  server.post("/api/auth/bootstrap-owner", async (request, reply) => {
    try {
      return bootstrapOwner(
        database,
        request.body as { email: string; password: string },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "OWNER_BOOTSTRAP_FAILED";
      const statusCode = message === "OWNER_ALREADY_BOOTSTRAPPED" ? 409 : 400;
      return reply.code(statusCode).send({ ok: false, error: message });
    }
  });

  server.post("/api/auth/login", async (request, reply) => {
    try {
      return loginOwner(
        database,
        request.body as { email: string; password: string },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "OWNER_LOGIN_FAILED";
      return reply.code(401).send({ ok: false, error: message });
    }
  });

  server.post("/api/auth/login-user", async (request, reply) => {
    try {
      return loginUser(
        database,
        request.body as { email: string; password: string },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "USER_LOGIN_FAILED";
      return reply.code(401).send({ ok: false, error: message });
    }
  });

  server.get("/doc", async (_request, reply) => {
    return reply.type("text/html").send(renderDocPage());
  });

  server.get("/readme", async (_request, reply) => {
    return reply.type("text/html").send(renderReadmePage());
  });

  server.get("/adminui", async (_request, reply) => {
    return reply.type("text/html").send(await readAdminIndex());
  });

  return server;
}

function renderPage(title: string, message: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body><main><h1>${title}</h1><p>${message}</p></main></body>
</html>`;
}

function renderDocPage(): string {
  return renderPage(
    "Apiagex Docs",
    [
      "English: Completed MVP base paths are /api, /api/health, /doc, /readme, and /adminui.",
      "Hinglish: Completed MVP base paths /api, /api/health, /doc, /readme, aur /adminui hain.",
      "Owner auth: POST /api/auth/bootstrap-owner creates the first owner, then POST /api/auth/login logs in.",
      "Owner auth: POST /api/auth/bootstrap-owner pehla owner banata hai, phir POST /api/auth/login login karta hai.",
      "v0.2.4 verifies owner bootstrap API, login API, React Admin UI login/logout, and docs.",
      "Schemas: /api/admin/schemas supports create, list, read, update, and delete with field validation.",
      "Schemas: /api/admin/schemas field validation ke saath create, list, read, update, aur delete support karta hai.",
      "Admin UI: owner login reveals a React schema builder form for all MVP field types.",
      "Admin UI: owner login ke baad React schema builder form sab MVP field types ke liye dikhata hai.",
      "Relations: relation fields must pick an existing schema and are validated by the API.",
      "Relations: relation fields existing schema pick karte hain aur API validate karti hai.",
      "Docs: schema builder usage and relation rules are documented in English and Hinglish.",
      "Docs: schema builder usage aur relation rules English aur Hinglish me documented hain.",
      "v0.3.5 verifies schema APIs, React schema builder, relation picker, docs, tests, and audit.",
      "Entries: repository validation checks required fields, value types, unknown fields, and relation targets.",
      "Entries: repository validation required fields, value types, unknown fields, aur relation targets check karta hai.",
      "Entry APIs: /api/admin/schemas/:schemaId/entries supports admin CRUD per schema.",
      "Entry APIs: /api/admin/schemas/:schemaId/entries per schema admin CRUD support karta hai.",
      "Admin UI: Entry Manager renders entry forms from selected schema fields.",
      "Admin UI: Entry Manager selected schema fields se entry forms render karta hai.",
      "Dynamic APIs: /api/content/:schemaSlug exposes schema-based CRUD.",
      "Dynamic APIs: /api/content/:schemaSlug schema-based CRUD expose karta hai.",
      "Admin UI: Generated APIs lists every schema's dynamic content route.",
      "Admin UI: Generated APIs har schema ka dynamic content route list karta hai.",
      "Docs: dynamic API examples show list, create, update, and delete calls.",
      "Docs: dynamic API examples list, create, update, aur delete calls dikhate hain.",
      "v0.4.6 verifies schema, entry, dynamic APIs, Admin UI API list, docs, tests, and audit.",
      "Roles: /api/admin/roles creates, lists, and reads unlimited non-owner roles.",
      "Roles: /api/admin/roles unlimited non-owner roles create, list, aur read karta hai.",
      "Permissions: read, create, update, delete, and manage can be evaluated per role and schema.",
      "Permissions: read, create, update, delete, aur manage role aur schema ke hisab se evaluate hote hain.",
      "Admin UI: Role Permissions saves action checkboxes for generated APIs.",
      "Admin UI: Role Permissions generated APIs ke action checkboxes save karta hai.",
      "Enforcement: dynamic APIs check x-apiagex-role-id and block missing permissions.",
      "Enforcement: dynamic APIs x-apiagex-role-id check karte hain aur missing permissions block karte hain.",
      "Users: /api/admin/users creates, lists, and reads users assigned to one role.",
      "Users: /api/admin/users one-role users create, list, aur read karta hai.",
      "Admin UI: Users screen creates and lists users with role assignment.",
      "Admin UI: Users screen role assignment ke saath users create aur list karta hai.",
      "RBAC flow: /api/auth/login-user returns a role id for permission-checked dynamic APIs.",
      "RBAC flow: /api/auth/login-user permission-checked dynamic APIs ke liye role id return karta hai.",
      "Docs: RBAC allow/block examples are available in English and Hinglish.",
      "Docs: RBAC allow/block examples English aur Hinglish me available hain.",
      "RBAC blocked dynamic API requests return API_PERMISSION_DENIED.",
      "RBAC blocked dynamic API requests API_PERMISSION_DENIED return karte hain.",
      "v0.5.8 verifies full MVP RBAC: roles, permissions, users, login, allow, and block.",
      "Admin UI polish improves layout, controls, empty states, and responsive spacing.",
      "Admin UI polish layout, controls, empty states, aur responsive spacing improve karta hai.",
      "QA checklist: docs/qa-checklist.md covers Browser Use and API request checks.",
      "QA checklist: docs/qa-checklist.md Browser Use aur API request checks cover karta hai.",
      "Smoke: npm run smoke covers owner login, schema, entry, dynamic API, role, user, and permission flow.",
      "Smoke: npm run smoke owner login, schema, entry, dynamic API, role, user, aur permission flow cover karta hai.",
      "Next: task2.md continues docs sync, release gate, Admin UI routing, and product packaging.",
    ].join(" "),
  );
}

function renderReadmePage(): string {
  return renderPage(
    "Apiagex Readme",
    [
      "English: Apiagex is a fresh MVP headless CMS/API platform on one server.",
      "Hinglish: Apiagex ek fresh MVP headless CMS/API platform hai jo ek server par chalega.",
      "Use /adminui for React UI and /api for backend routes.",
      "Owner login starts in /adminui and uses the bootstrap/login APIs.",
      "Schema APIs are now available at /api/admin/schemas for owner/admin workflows.",
      "Schema APIs ab owner/admin workflow ke liye /api/admin/schemas par available hain.",
      "The React Admin UI can create schemas from a form after owner login.",
      "React Admin UI owner login ke baad form se schema create kar sakta hai.",
      "Relation fields use an existing-schema picker before save.",
      "Relation fields save se pehle existing-schema picker use karte hain.",
      "Read /doc for schema examples and relation validation rules.",
      "/doc me schema examples aur relation validation rules padho.",
      "Schema builder checkpoint v0.3.5 is ready.",
      "Schema builder checkpoint v0.3.5 ready hai.",
      "Entry repository validation is ready for admin and dynamic APIs.",
      "Entry repository validation admin aur dynamic APIs ke liye ready hai.",
      "Entry admin APIs are available below each schema.",
      "Entry admin APIs har schema ke below available hain.",
      "The React Admin UI can create entries from generated forms.",
      "React Admin UI generated forms se entries create kar sakta hai.",
      "Dynamic content APIs are ready under /api/content/:schemaSlug.",
      "Dynamic content APIs /api/content/:schemaSlug ke under ready hain.",
      "Admin UI now lists generated dynamic APIs.",
      "Admin UI ab generated dynamic APIs list karta hai.",
      "Read /doc and /readme for dynamic API examples.",
      "Dynamic API examples ke liye /doc aur /readme padho.",
      "Dynamic API checkpoint v0.4.6 is ready.",
      "Dynamic API checkpoint v0.4.6 ready hai.",
      "Role admin APIs are ready for permission assignment.",
      "Role admin APIs permission assignment ke liye ready hain.",
      "Permission evaluator defaults to block, manage allows all, and owner bypasses checks.",
      "Permission evaluator default block karta hai, manage all allow karta hai, aur owner checks bypass karta hai.",
      "Role permission UI is ready for dynamic API enforcement.",
      "Role permission UI dynamic API enforcement ke liye ready hai.",
      "Allowed roles succeed and blocked roles return API_PERMISSION_DENIED.",
      "Allowed roles succeed karte hain aur blocked roles API_PERMISSION_DENIED return karte hain.",
      "User admin APIs are ready for the Admin UI user screen.",
      "User admin APIs Admin UI user screen ke liye ready hain.",
      "User management UI is ready for the RBAC end-to-end flow.",
      "User management UI RBAC end-to-end flow ke liye ready hai.",
      "RBAC end-to-end verifies allowed and blocked user API access.",
      "RBAC end-to-end allowed aur blocked user API access verify karta hai.",
      "Read /doc and /readme for RBAC allow/block examples.",
      "RBAC allow/block examples ke liye /doc aur /readme padho.",
      "Blocked RBAC requests return API_PERMISSION_DENIED.",
      "Blocked RBAC requests API_PERMISSION_DENIED return karte hain.",
      "MVP RBAC checkpoint v0.5.8 is ready.",
      "MVP RBAC checkpoint v0.5.8 ready hai.",
      "Admin UI polish is ready for desktop and mobile checks.",
      "Admin UI polish desktop aur mobile checks ke liye ready hai.",
      "Manual QA checklist is documented in docs/qa-checklist.md.",
      "Manual QA checklist docs/qa-checklist.md me documented hai.",
      "npm run smoke verifies the MVP owner/schema/entry/dynamic API/RBAC flow.",
      "npm run smoke MVP owner/schema/entry/dynamic API/RBAC flow verify karta hai.",
    ].join(" "),
  );
}
