# Database Package

## English

This package owns the database adapter contract for Apiagex. It currently exposes placeholder adapters for SQLite, PostgreSQL, and MySQL, plus a selector that chooses the right adapter from config.

```ts
import { selectDatabaseAdapter } from '@apiagex/database';

const adapter = selectDatabaseAdapter({ client: 'sqlite', file: './data/apiagex.db' });
```

## Hindi

Ye package Apiagex ke database adapter contract ka owner hai. Abhi isme SQLite, PostgreSQL, aur MySQL ke placeholder adapters aur config ke basis par adapter select karne wala helper hai.

```ts
import { selectDatabaseAdapter } from '@apiagex/database';

const adapter = selectDatabaseAdapter({ client: 'sqlite', file: './data/apiagex.db' });
```
