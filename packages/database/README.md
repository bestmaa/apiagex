# Database Package

## English

This package owns the database adapter contract for Apiagex. SQLite is backed by `better-sqlite3` and remains the default local database. PostgreSQL is available through `pg` when `APIAGEX_DATABASE_PROVIDER=postgres` and `APIAGEX_DATABASE_URL` is set. MySQL is available through `mysql2` when `APIAGEX_DATABASE_PROVIDER=mysql` and `APIAGEX_DATABASE_URL` is set.

MVP note: the active SQLite repository now stores role metadata with `roleKind`. Admin roles are `owner`, `admin`, `schema-manager`, and `user-manager`; API roles are used for content API permissions. Admin permissions live in `admin_permissions`, content API permissions stay in `permissions`, content API tokens are stored hashed in `api_tokens`, and webhooks use `webhooks`, `webhook_events`, and `webhook_deliveries`.

```ts
import { openMigratedSqliteAdapter, openMySqlAdapter, openPostgresAdapter } from '@apiagex/database';

const sqlite = openMigratedSqliteAdapter('./data/apiagex.db');
const postgres = await openPostgresAdapter(process.env.APIAGEX_DATABASE_URL);
const mysql = await openMySqlAdapter(process.env.APIAGEX_DATABASE_URL);
```

## Hindi

Ye package Apiagex ke database adapter contract ka owner hai. SQLite default hai aur `better-sqlite3` par chalta hai. PostgreSQL `pg` driver ke through real runtime provider hai jab `APIAGEX_DATABASE_PROVIDER=postgres` aur `APIAGEX_DATABASE_URL` set ho. MySQL `mysql2` driver ke through real runtime provider hai jab `APIAGEX_DATABASE_PROVIDER=mysql` aur `APIAGEX_DATABASE_URL` set ho.

MVP note: active SQLite repository ab `roleKind` metadata store karta hai. Admin roles `owner`, `admin`, `schema-manager`, aur `user-manager` hain; API roles content API permissions ke liye use hote hain. Admin permissions `admin_permissions` me rehte hain, content API permissions `permissions` me alag rehte hain, content API tokens `api_tokens` me hashed form me store hote hain, aur webhooks `webhooks`, `webhook_events`, plus `webhook_deliveries` use karte hain.

```ts
import { openMigratedSqliteAdapter, openMySqlAdapter, openPostgresAdapter } from '@apiagex/database';

const sqlite = openMigratedSqliteAdapter('./data/apiagex.db');
const postgres = await openPostgresAdapter(process.env.APIAGEX_DATABASE_URL);
const mysql = await openMySqlAdapter(process.env.APIAGEX_DATABASE_URL);
```
