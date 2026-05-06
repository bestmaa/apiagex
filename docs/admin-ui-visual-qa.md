# Admin UI Visual QA Checklist

Use this checklist before accepting Admin UI visual changes. Run it in both light and dark mode, then repeat at desktop and 390px mobile width.

## Theme Coverage

- Pass: Theme toggle changes every main surface, text, badge, form control, and status toast without low-contrast text.
- Pass: Focus rings stay visible in light and dark mode.
- Fail: Any label, helper text, disabled button, badge, or warning depends on color alone or becomes hard to read.

## Desktop And Mobile

- Pass: Dashboard, Schemas, Entries, APIs, Roles, Users, and Docs fit without horizontal page overflow.
- Pass: Mobile navigation opens, closes, and keeps all routes reachable.
- Fail: Any action button, code path, ID, or relation value pushes the page wider than the viewport.

## Navigation

- Pass: Skip link appears on first keyboard tab and moves focus to main content.
- Pass: Route changes move focus to the new main content area.
- Fail: Focus disappears after route changes, theme toggle, menu close, or logout.

## Forms

- Pass: Owner login, schema form, entry form, role form, and user form have visible labels, helper text, and copyable error/status text.
- Pass: Required field errors remain inline and understandable.
- Fail: Passwords appear in a status toast, list, log-style text, or browser-visible summary after submit.

## Lists And Tables

- Pass: Schema, entry, API, role, and user list rows wrap long IDs and paths while keeping critical actions visible.
- Pass: Copy buttons, edit buttons, delete buttons, permission controls, and create/update actions are reachable on mobile.
- Fail: Any row hides the only available action or clips critical record identity.

## Dialogs

- Pass: Destructive confirmations use a labeled dialog with Cancel focused first.
- Pass: Escape cancels the dialog and returns focus to the Delete button.
- Fail: Confirm delete can run from a single accidental click or leaves focus on the page body.

## Relation Workflows

- Pass: Relation field type, relation target, relation cardinality, and entry relation pickers are visible and understandable.
- Pass: One-to-one, one-to-many, many-to-one, and many-to-many labels stay readable on mobile.
- Fail: Relation warnings rely only on color or hide the target schema/entry context.

## RBAC Workflows

- Pass: Roles list, permission matrix, summary badges, and user role assignment explain allow/block state.
- Pass: Permission save status is visible and copyable.
- Fail: Role headers, permission actions, or user role IDs are truncated with no way to inspect the full value.
