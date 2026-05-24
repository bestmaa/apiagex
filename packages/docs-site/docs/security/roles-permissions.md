# Roles And Permissions

Apiagex separates Admin UI roles from generated API/content roles.

## Admin Roles

Admin roles control access to control-plane pages like schemas, entries, users, roles, and settings.

Open:

```text
/adminui/#settings/admin-roles
```

## API Roles

API roles control generated content API and custom API access.

Open:

```text
/adminui/#settings/content-roles
```

<div class="screen">
  <img src="/screenshots/security/content-roles.png" alt="Apiagex content roles and API permissions">
</div>

Common API role examples:

| Role | Meaning |
| --- | --- |
| `public` | Open API role for public reads if allowed. |
| `reader` | List/read access. |
| `single-reader` | Single entry reads. |
| `writer` | Create access. |
| `editor` | Update/delete style access when granted. |

Permissions are stored per role and schema/custom route. Admin UI shows access counts so you can inspect what each role can do.

Hinglish: Owner/Admin panel role alag hai. API role alag hai. Token hamesha API role se bind hota hai.
