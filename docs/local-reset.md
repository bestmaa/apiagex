# Local Reset

## English

Use this only for local development.

Preview the reset first:

```bash
npm run reset:local
```

The dry run lists only known local targets:

- `data/content-types.db`
- `data/content-types.db-shm`
- `data/content-types.db-wal`
- `data/uploads`

Apply the reset only when you want to delete local CMS data:

```bash
npm run reset:local -- --apply
```

After reset, start the API with a local owner account:

```bash
APIAGEX_LOCAL_OWNER=true npm run dev
```

Local owner login:

```txt
Email: owner@apiagex.local
Password: OwnerPass123!
```

Recovery checklist:

- Stop any running dev server before reset.
- Run the dry run and read every target.
- Apply reset only if every target is inside `data/`.
- Start the server with `APIAGEX_LOCAL_OWNER=true`.
- Open `/docs` and log in through the admin UI.
- Create one test content type before continuing feature work.

Never enable `APIAGEX_LOCAL_OWNER` in production.

## Hindi

Is flow ko sirf local development ke liye use karo.

Pehle reset preview karo:

```bash
npm run reset:local
```

Dry run sirf known local targets dikhata hai:

- `data/content-types.db`
- `data/content-types.db-shm`
- `data/content-types.db-wal`
- `data/uploads`

Local CMS data delete karna ho tabhi reset apply karo:

```bash
npm run reset:local -- --apply
```

Reset ke baad API ko local owner account ke saath start karo:

```bash
APIAGEX_LOCAL_OWNER=true npm run dev
```

Local owner login:

```txt
Email: owner@apiagex.local
Password: OwnerPass123!
```

Recovery checklist:

- Reset se pehle running dev server stop karo.
- Dry run chalao aur har target read karo.
- Reset apply tabhi karo jab har target `data/` ke andar ho.
- Server `APIAGEX_LOCAL_OWNER=true` ke saath start karo.
- `/docs` open karo aur admin UI me login karo.
- Feature work continue karne se pehle ek test content type create karo.

Production me `APIAGEX_LOCAL_OWNER` kabhi enable mat karo.
