# Database Package

## English

This package owns the database adapter contract for Apiagex. SQLite is backed by `better-sqlite3` and remains the default local database. PostgreSQL is available through `pg` when `APIAGEX_DATABASE_PROVIDER=postgres` and `APIAGEX_DATABASE_URL` is set. MySQL SQL is prepared for the next adapter task, but MySQL is not a runtime provider until that adapter lands.

MVP note: the active SQLite repository now stores role metadata with `roleKind`. Admin roles are `owner`, `admin`, `schema-manager`, and `user-manager`; API roles are used for content API permissions. Admin permissions live in `admin_permissions`, content API permissions stay in `permissions`, content API tokens are stored hashed in `api_tokens`, and webhooks use `webhooks`, `webhook_events`, and `webhook_deliveries`.

```ts
import { openMigratedSqliteAdapter, openPostgresAdapter } from '@apiagex/database';

const sqlite = openMigratedSqliteAdapter('./data/apiagex.db');
const postgres = await openPostgresAdapter(process.env.APIAGEX_DATABASE_URL);
```

## Hindi

Ye package Apiagex ke database adapter contract ka owner hai. SQLite default hai aur `better-sqlite3` par chalta hai. PostgreSQL ab `pg` driver ke through real runtime provider hai jab `APIAGEX_DATABASE_PROVIDER=postgres` aur `APIAGEX_DATABASE_URL` set ho. MySQL ka SQL ready hai, lekin MySQL runtime provider next adapter task ke baad supported hoga.

MVP note: active SQLite repository ab `roleKind` metadata store karta hai. Admin roles `owner`, `admin`, `schema-manager`, aur `user-manager` hain; API roles content API permissions ke liye use hote hain. Admin permissions `admin_permissions` me rehte hain, content API permissions `permissions` me alag rehte hain, content API tokens `api_tokens` me hashed form me store hote hain, aur webhooks `webhooks`, `webhook_events`, plus `webhook_deliveries` use karte hain.

```ts
import { openMigratedSqliteAdapter, openPostgresAdapter } from '@apiagex/database';

const sqlite = openMigratedSqliteAdapter('./data/apiagex.db');
const postgres = await openPostgresAdapter(process.env.APIAGEX_DATABASE_URL);
```
