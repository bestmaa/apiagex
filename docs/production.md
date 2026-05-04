# Production Hardening

## English

Use these checks before treating a deployment as production-ready.

### Environment validation

- Set `NODE_ENV=production`
- Set `ADMIN_PASSWORD`
- Set `AUTH_SECRET`
- Keep `PORT` valid and non-empty
- Verify optional accounts are configured in pairs:
  - `OWNER_EMAIL` and `OWNER_PASSWORD`
  - `EDITOR_EMAIL` and `EDITOR_PASSWORD`
  - `VIEWER_EMAIL` and `VIEWER_PASSWORD`

Expected result:

- Startup fails fast if required values are missing or malformed
- The error message names the missing variable

### Startup errors

- Start the server with `npm run dev -w @apiagex/server`
- If configuration is invalid, the process prints one clear startup message

Expected result:

- The message explains what to fix
- The message points to `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `HOST`, and `PORT`

### Health checks

- `GET /health` returns a lightweight status response
- `GET /health/detail` returns request id, storage, scheduler, and readiness checks

Expected result:

- `x-request-id` is present on the response
- The returned `requestId` matches the active request id
- The detail response includes `checks.database`, `checks.docs`, `checks.scheduler`, and `checks.uploads`

### Safe defaults

- Local development keeps placeholder defaults for convenience
- Production should override the auth secret and admin password explicitly

Expected result:

- No production deployment relies on the placeholder defaults

### Docs

- The docs site includes this page and the manual verification checklist

Expected result:

- English and Hindi docs stay in sync

## Hindi

Production deployment ko ready maana jane se pehle ye checks run karein.

### Environment validation

- `NODE_ENV=production` set karein
- `ADMIN_PASSWORD` set karein
- `AUTH_SECRET` set karein
- `PORT` valid aur non-empty ho
- Optional accounts pair me configure hon:
  - `OWNER_EMAIL` aur `OWNER_PASSWORD`
  - `EDITOR_EMAIL` aur `EDITOR_PASSWORD`
  - `VIEWER_EMAIL` aur `VIEWER_PASSWORD`

Expected result:

- Required values missing ya malformed hone par startup fast fail kare
- Error message missing variable ka naam bataye

### Startup errors

- Server ko `npm run dev -w @apiagex/server` se start karein
- Agar config invalid ho to process ek clear startup message print kare

Expected result:

- Message bataye ki kya fix karna hai
- Message `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AUTH_SECRET`, `HOST`, aur `PORT` ko point kare

### Health checks

- `GET /health` lightweight status response return kare
- `GET /health/detail` request id, storage, scheduler, aur readiness checks return kare

Expected result:

- Response par `x-request-id` present ho
- Returned `requestId` active request id se match kare
- Detail response me `checks.database`, `checks.docs`, `checks.scheduler`, aur `checks.uploads` ho

### Safe defaults

- Local development convenience ke liye placeholder defaults rakhta hai
- Production me auth secret aur admin password explicitly override karein

Expected result:

- Koi production deployment placeholder defaults par depend na kare

### Docs

- Docs site me ye page aur manual verification checklist dono honge

Expected result:

- English aur Hindi docs sync me rahen
