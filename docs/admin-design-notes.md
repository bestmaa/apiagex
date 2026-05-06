# Admin UI Design Notes

These notes document the current custom Admin UI direction. They do not include copied template assets, proprietary layouts, screenshots, or third-party design files.

## Direction

Apiagex Admin UI should feel like a compact operational control plane. The first screen is the working dashboard, not a marketing page. The design favors fast scanning, predictable navigation, clear forms, and visible API/RBAC context.

## Inspiration

The direction is inspired by common admin-console patterns: persistent navigation, dense workflow panels, compact metric rows, clear status feedback, and utility-first forms. The implementation is custom to Apiagex and uses the existing React app, local tokens, and product-specific workflows.

## What Was Not Copied

- No Figma/template assets were imported.
- No copyrighted layout, illustration, screenshot, icon set, or brand system was copied.
- No marketing hero, decorative orb background, or template landing page pattern was used.
- No external design dependency was added for layout.

## Tokens

The Admin UI uses CSS custom properties in `packages/admin/src/tokens.css` for color, spacing, radius, type scale, control height, and shadows. Light and dark themes share the same component structure and switch through the `data-theme` attribute.

Token rules:

- Text and muted text must stay readable in both themes.
- Focus color must be visible against the page background.
- Warning and destructive states use text, border, and copy, not color alone.
- Border radius stays at 8px or less for regular controls and cards.

## Layout

The shell uses a left navigation rail on desktop and a collapsible menu on mobile. The top bar keeps breadcrumb, page title, page description, theme toggle, and logout in a consistent location.

Page rules:

- Use full-width working sections instead of marketing hero sections.
- Use cards only for repeated records, framed tools, dialogs, and compact summaries.
- Do not nest cards inside cards.
- Keep route pages focused on the real workflow: schema builder, entry manager, API explorer, roles, users, and docs.

## Themes

Theme behavior is intentionally simple:

- The theme toggle switches light/dark mode.
- The selected mode is saved in local storage.
- Components use tokens instead of hard-coded per-component palettes.
- Desktop and mobile checks must pass in both themes.

## Component Rules

- Use icon buttons with visible labels where the action is not obvious.
- Use status toasts for high-level success/error/loading feedback.
- Keep important validation errors inline and copyable.
- Use a labeled confirm dialog for destructive actions.
- Return focus after canceling destructive dialogs.
- Long IDs, API paths, and role headers must wrap instead of creating horizontal overflow.

## Verification

Use `docs/admin-ui-visual-qa.md` for visual checks. A change is not ready if it breaks keyboard focus, light/dark readability, mobile layout, relation workflows, RBAC workflows, or public path behavior for `/adminui`, `/doc`, and `/readme`.
