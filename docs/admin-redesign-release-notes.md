# Admin Redesign Release Notes

## Scope

Task 4 refreshed the Apiagex Admin UI without changing the core server paths. `/adminui` remains the React Admin UI, `/doc` remains public product/API docs, and `/readme` remains the readable public summary.

## Highlights

- Added a custom Admin shell with desktop sidebar, mobile menu, breadcrumb, page descriptions, and consistent header actions.
- Added light/dark theme tokens with persisted theme selection.
- Redesigned Dashboard, Schemas, Entries, APIs, Roles, Users, and Admin Docs surfaces.
- Improved schema field builder, relation controls, entry relation pickers, API examples, permission matrix, and user management.
- Added accessible keyboard navigation, skip link, focus handling, and destructive confirm dialogs.
- Added consistent status toasts for create/update/delete/copy feedback.
- Tightened responsive layout so list rows, IDs, paths, role headers, and relation summaries wrap on mobile.

## Verification

- Desktop end-to-end Admin UI flow passed at 1366x900.
- Mobile end-to-end Admin UI flow passed at 390x844.
- Light/dark coverage passed across Dashboard, Schemas, Entries, APIs, Roles, Users, and Docs.
- Relation regression passed for one-to-one, one-to-many, many-to-one, and many-to-many controls.
- RBAC regression passed for permission UI visibility, allowed read, blocked create, and user role assignment.
- `npm run check`, `npm run smoke`, and `npm audit --audit-level=high` passed through release-gate tasks.

## Notes For Next Work

- Keep `docs/admin-ui-visual-qa.md` as the visual QA checklist for future Admin UI changes.
- Keep `docs/admin-design-notes.md` as the design direction source before changing layout or tokens.
- Do not move `/doc` or `/readme` into Admin UI routing unless a future task explicitly migrates docs architecture.
