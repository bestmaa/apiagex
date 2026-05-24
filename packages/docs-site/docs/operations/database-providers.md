# Database Providers

Apiagex supports SQLite by default and can run with PostgreSQL or MySQL for production-style deployments.

## Environment

```bash
APIAGEX_DATABASE_PROVIDER=sqlite
APIAGEX_DATABASE_URL=file:./.apiagex/apiagex.sqlite
```

```bash
APIAGEX_DATABASE_PROVIDER=postgres
APIAGEX_DATABASE_URL="<POSTGRES_URL>"
```

```bash
APIAGEX_DATABASE_PROVIDER=mysql
APIAGEX_DATABASE_URL="<MYSQL_URL>"
```

Do not commit real database URLs.

## Fresh Rebuild Strategy

If you only need schema/role/workflow structure and not data, export/import templates are safer than migrating a live database manually.

Hinglish: Agar data fresh rakhna hai to structure export karo, naya DB setup karo, fir import karo. Production data migration alag planned process se karo.
