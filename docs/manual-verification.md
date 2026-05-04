# Manual Verification

## English

Use this checklist to repeat the admin UI verification by hand.
No automation is required.
### Start the apps

Terminal 1:

```bash
npm run dev -w @apiagex/server
```

Terminal 2:

```bash
APIAGEX_BACKEND_URL=http://127.0.0.1:4000 npm run dev -w @apiagex/admin
```

Terminal 3:

```bash
node scripts/manual-webhook-server.mjs
```

Expected result:

- Backend listens on `http://127.0.0.1:4000`
- Admin UI listens on `http://127.0.0.1:3001`
- Manual webhook listener listens on `http://127.0.0.1:8787/hook`
- Admin UI can talk to the backend

### Login
Open the admin UI and log in with:

- `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your environment, if set
- Otherwise the local defaults from `packages/server/src/config.ts`:
  - email: `admin@example.com`
  - password: `change-me-in-production`

Expected result:

- You land on the admin dashboard
- The sidebar and top bar are visible

### Create a content type
Open `#/schema` and create a simple collection content type.

Suggested values:

- Display name: `Articles`
- Slug: `articles`
- Kind: `collection`
- Field: `title` with type `text`, required `true`

Expected result:

- The content type appears in the schema list
- It is visible in the docs page later

### Create an entry
Open `#/entries`, select `articles`, and create one entry.

Suggested values:

- `title`: `First article`

Expected result:

- The entry saves successfully
- The entry appears in the list

### Open realtime page
Open `#/realtime`.

Expected result:

- The realtime page is visible
- The stream URL example is shown
- The content type list is visible
- The live event preview panel is visible

### Create a role
Open `#/roles` and create a custom role.

Suggested values:

- Name: `Content Editor`
- Description: `Can manage articles`
- Permissions: allow `create`, `read`, and `list` for `articles`

Expected result:

- The role is saved
- The role appears in the role list

### Create a webhook
Open `#/webhooks` and create a webhook.

Suggested values:

- Name: `Article create webhook`
- Target URL: `http://127.0.0.1:8787/hook`
- Filters:
  - content type: `articles`
  - action: `create`

Expected result:

- The webhook is saved
- The delivery list stays empty until a matching event happens

### Open docs
Open `#/docs` and use the `Dynamic API catalog` link.

Expected result:

- The docs page or generated catalog renders
- The created `articles` content type appears in the generated docs
- English and Hindi sections are both present

## Hindi

Is checklist ka use admin UI verification manually repeat karne ke liye karein.
Automation ki zarurat nahi hai.
### Apps start karein

Terminal 1:

```bash
npm run dev -w @apiagex/server
```

Terminal 2:

```bash
APIAGEX_BACKEND_URL=http://127.0.0.1:4000 npm run dev -w @apiagex/admin
```

Terminal 3:

```bash
node scripts/manual-webhook-server.mjs
```

Expected result:

- Backend `http://127.0.0.1:4000` par listen karta hai
- Admin UI `http://127.0.0.1:3001` par listen karti hai
- Manual webhook listener `http://127.0.0.1:8787/hook` par listen karta hai
- Admin UI backend se connect ho pati hai

### Login
Admin UI open karke in credentials se login karein:

- agar environment me set hon to `ADMIN_EMAIL` aur `ADMIN_PASSWORD`
- warna `packages/server/src/config.ts` ke local defaults:
  - email: `admin@example.com`
  - password: `change-me-in-production`

Expected result:

- Admin dashboard open ho jata hai
- Sidebar aur top bar visible hote hain

### Content type create karein
`#/schema` open karke ek simple collection content type banayein.

Suggested values:

- Display name: `Articles`
- Slug: `articles`
- Kind: `collection`
- Field: `title` with type `text`, required `true`

Expected result:

- Content type schema list me dikh jata hai
- Baad me docs page me bhi dikhna chahiye

### Entry create karein
`#/entries` open karke `articles` select karein aur ek entry banayein.

Suggested values:

- `title`: `First article`

Expected result:

- Entry successfully save hoti hai
- Entry list me visible hoti hai

### Realtime page open karein
`#/realtime` open karein.

Expected result:

- Realtime page visible hota hai
- Stream URL example dikhna chahiye
- Content type list visible honi chahiye
- Live event preview panel visible hona chahiye

### Role create karein
`#/roles` open karke ek custom role banayein.

Suggested values:

- Name: `Content Editor`
- Description: `Can manage articles`
- Permissions: `articles` ke liye `create`, `read`, aur `list` allow karein

Expected result:

- Role save ho jata hai
- Role list me dikhai deta hai

### Webhook create karein
`#/webhooks` open karke ek webhook banayein.

Suggested values:

- Name: `Article create webhook`
- Target URL: `http://127.0.0.1:8787/hook`
- Filters:
  - content type: `articles`
  - action: `create`

Expected result:

- Webhook save ho jata hai
- Matching event aane tak delivery list empty rehti hai

### Docs open karein
`#/docs` open karke `Dynamic API catalog` link use karein.

Expected result:

- Docs page ya generated catalog render hota hai
- Generated docs me created `articles` content type dikhna chahiye
- English aur Hindi dono sections present hone chahiye
