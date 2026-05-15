# Provider E2E Report - Task 29

Date: 2026-05-14

This report covers a fresh generated Apiagex project created in `project-test/task29-cms` with `create-apiagex@0.8.1` and `@apiagex/server@0.8.1`.

## Scope

- Generated project install and smoke test.
- Admin UI owner setup/login.
- Admin UI schema creation.
- Admin UI entry creation.
- Admin UI route rendering for APIs, Users, Content Roles, Webhooks, and Realtime API settings.
- Content API access through generated API role token.
- API user creation and login with the assigned content role.
- Webhook creation, signed delivery, delivery id header, and delivery history.
- Realtime API enablement, WebSocket live event, client ack, recent history, and reconnect replay with `lastEventId`.
- Cleanup of temporary provider data.

## Result Matrix

| Provider | Port | Storage | Result | Cleanup |
| --- | ---: | --- | --- | --- |
| SQLite | 4211 | `.apiagex/task29-sqlite/apiagex.sqlite` | Pass | SQLite test folder deleted |
| PostgreSQL | 4212 | Docker DB `apiagex_pg_e2e` on `kiosk-postgres` | Pass | DB dropped and upload folder deleted |
| MySQL | 4213 | Docker DB `apiagex_mysql_e2e` on `headless-mysql` | Pass | DB dropped and upload folder deleted |

## Feature Checks

For each provider, the same flow was run with provider-specific slugs:

- SQLite: `task29-sqlite`
- PostgreSQL: `task29-postgres`
- MySQL: `task29-mysql`

Each run verified:

- Owner session became active in Admin UI.
- Schema was created from Admin UI with required `title` field.
- Entry was created from Admin UI and appeared in the content API.
- API role was created with `getAll`, `get`, `create`, `update`, and `delete`.
- API token could call `GET /api/content/:schema`.
- API user could log in through `/api/auth/login-user`.
- Webhook receiver got an `entry.created` delivery.
- Webhook delivery included `x-apiagex-signature` and `x-apiagex-delivery-id`.
- Webhook delivery history showed a successful delivery.
- Realtime settings were enabled for the schema.
- WebSocket client received a live `entry.created` event.
- Client ack returned `ack.ok`.
- Reconnect with `lastEventId` replayed the missed event.
- Admin realtime history contained the provider event.

## Commands Used

Generated project setup:

```bash
cd /home/aditya/projects/apiagex/project-test
npm create apiagex@latest task29-cms -- --yes
cd task29-cms
npm install --no-audit
npm run smoke
```

SQLite server:

```bash
PORT=4211 HOST=127.0.0.1 \
APIAGEX_DATABASE_PROVIDER=sqlite \
APIAGEX_DATABASE_PATH=.apiagex/task29-sqlite/apiagex.sqlite \
APIAGEX_UPLOADS_PATH=.apiagex/task29-sqlite/uploads \
APIAGEX_SECRET=<test-secret> \
npm run dev
```

PostgreSQL database and server:

```bash
docker exec kiosk-postgres psql -U <user> -d postgres \
  -c "DROP DATABASE IF EXISTS apiagex_pg_e2e;" \
  -c "CREATE DATABASE apiagex_pg_e2e;"

PORT=4212 HOST=127.0.0.1 \
APIAGEX_DATABASE_PROVIDER=postgres \
APIAGEX_DATABASE_URL=postgres://<user>:<password>@127.0.0.1:5433/apiagex_pg_e2e \
APIAGEX_UPLOADS_PATH=.apiagex/task29-postgres/uploads \
APIAGEX_SECRET=<test-secret> \
npm run dev
```

MySQL database and server:

```bash
docker exec headless-mysql mysql -uroot -p'<password>' -e "
  DROP DATABASE IF EXISTS apiagex_mysql_e2e;
  CREATE DATABASE apiagex_mysql_e2e;
  GRANT ALL PRIVILEGES ON apiagex_mysql_e2e.* TO '<user>'@'%';
  FLUSH PRIVILEGES;
"

PORT=4213 HOST=127.0.0.1 \
APIAGEX_DATABASE_PROVIDER=mysql \
APIAGEX_DATABASE_URL=mysql://<user>:<password>@127.0.0.1:3307/apiagex_mysql_e2e \
APIAGEX_UPLOADS_PATH=.apiagex/task29-mysql/uploads \
APIAGEX_SECRET=<test-secret> \
npm run dev
```

Admin UI browser verification:

```bash
# Open each provider URL, then run the provider UI flow.
http://127.0.0.1:4211/adminui?task29Provider=sqlite
http://127.0.0.1:4212/adminui?task29Provider=postgres
http://127.0.0.1:4213/adminui?task29Provider=mysql
```

Backend verification:

```bash
TASK29_PROVIDER=sqlite TASK29_BASE_URL=http://127.0.0.1:4211 node task29-backend-check.mjs
TASK29_PROVIDER=postgres TASK29_BASE_URL=http://127.0.0.1:4212 node task29-backend-check.mjs
TASK29_PROVIDER=mysql TASK29_BASE_URL=http://127.0.0.1:4213 node task29-backend-check.mjs
```

## Notes

- The PostgreSQL run printed a `pg` client deprecation warning when the server was stopped. The E2E checks had already passed, and this did not block API behavior.
- The MySQL CLI printed its standard command-line password warning while creating and dropping the temporary database.
- No permanent test DB remains for `apiagex_pg_e2e` or `apiagex_mysql_e2e`.
- The generated test project was removed after the checks.
