# Apiagex Task 10.0.7 Queue

Task 10.0.7 compacts Admin UI page sections and removes bilingual helper labels outside docs.

Task 10.0.7 Admin UI page sections compact karta hai aur docs ke bahar bilingual helper labels hatata hai.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task's verification plus standard verification.
- Mark the task `completed` only after tests/docs/browser checks pass.
- Commit with the exact task commit message.
- Keep one server: `/api`, `/adminui`, `/doc`, `/readme`.
- Keep strict TypeScript and put shared types in `*.type.ts`.
- Keep files under 250 lines where practical.
- Every behavior change must include tests and docs.
- Browser-facing Admin UI tasks must verify desktop and mobile.

## Standard Verification

```bash
npm run check
npm run smoke
npm audit --audit-level=high
git diff --check
```

## Queue

#### T1007 - Compact Admin UI English Copy

- Version: `v10.0.7`
- Status: `completed`
- Goal: Make Admin UI content cards normal-height and remove English/Hinglish duplicate helper text outside documentation screens.
- Persona: Admin operator who wants compact, readable control-plane screens without duplicate language labels.
- Success Criteria: Users page section no longer stretches content vertically; Admin UI screens outside Docs do not render `English:` or `Hinglish:` helper labels; helper copy remains clear in English.
- Constraints: Keep `/doc` and `/readme` bilingual documentation behavior unchanged.
- Output: Compact section CSS, English-only Admin UI copy, docs/context notes, focused tests, browser QA.
- Strict Rule: Keep version numbering as `v10.0.x`.
- Verify: Users desktop/mobile visual check, no non-doc Admin UI bilingual labels, standard verification.
- Commit: `Compact admin UI English copy`
