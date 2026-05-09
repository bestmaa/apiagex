# Apiagex Task 7 Queue

Task 7 focuses on tightening the Admin Entries workflow after the table rollout: the create entry form should open only from a compact button, and the Entries screen should explain API query parameters for fields, search, and pagination.

Task 7 ka focus Admin Entries workflow ko aur compact banana hai: create entry form sirf chhote button se khule, aur Entries screen fields, search, pagination ke API query parameters clearly bataye.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep files under 250 lines where practical.
- Browser-facing Admin UI tasks must verify desktop and mobile.
- Every visual/content change must support light and dark mode.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

#### T701 - Compact Entries Create And Query Help

- Version: `v7.0.1`
- Status: `completed`
- Goal: Hide the create entry form behind a compact button and show clear API query parameter examples for selected fields, search, and pagination.
- Persona: Admin workflow engineer; keep repeated entry browsing dense and make API usage obvious from the UI.
- Success Criteria: Entries route shows a small Create entry button by default, opens the form only on click or edit, closes after save/cancel, and displays `fields`, `search`, `limit`, and `offset` examples for the selected collection.
- Constraints: Preserve existing CRUD behavior, table filters, field visibility, right collection rail, and backend API behavior.
- Output: Updated Entries UI, docs/context updates, browser QA, and standard verification.
- Strict Rule: Do not change entry persistence or dynamic API response shape beyond existing projection support.
- Verify: Admin UI Entries desktop/mobile light/dark, API query docs visibility, and standard verification.
- Commit: `Compact entries create and query help`
