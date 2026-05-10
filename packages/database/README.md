# Database Package

## English

This package owns the database adapter contract for Apiagex. It currently exposes placeholder adapters for SQLite, PostgreSQL, and MySQL, plus a selector that chooses the right adapter from config.

MVP note: the active SQLite repository now stores role metadata with `roleKind`. Admin roles are `owner`, `admin`, `schema-manager`, and `user-manager`; API roles are used for content API permissions. Admin permissions live in `admin_permissions`, content API permissions stay in `permissions`, and content API tokens are stored hashed in `api_tokens`.

```ts
import { selectDatabaseAdapter } from '@apiagex/database';

const adapter = selectDatabaseAdapter({ client: 'sqlite', file: './data/apiagex.db' });
```

## Hindi

Ye package Apiagex ke database adapter contract ka owner hai. Abhi isme SQLite, PostgreSQL, aur MySQL ke placeholder adapters aur config ke basis par adapter select karne wala helper hai.

MVP note: active SQLite repository ab `roleKind` metadata store karta hai. Admin roles `owner`, `admin`, `schema-manager`, aur `user-manager` hain; API roles content API permissions ke liye use hote hain. Admin permissions `admin_permissions` me rehte hain, content API permissions `permissions` me alag rehte hain, aur content API tokens `api_tokens` me hashed form me store hote hain.

```ts
import { selectDatabaseAdapter } from '@apiagex/database';

const adapter = selectDatabaseAdapter({ client: 'sqlite', file: './data/apiagex.db' });
```
