# Workflow

## English

Apiagex work moves through `tasks.md`.

Follow this order:

1. Read `agent.md`, `PROJECT_CONTEXT.md`, and `tasks.md`.
2. Pick the first task with `Status: pending`.
3. Mark that task `in_progress`.
4. Keep the change scoped to that task.
5. Keep every source, docs, test, script, plugin, and skill file below 250 lines.
6. Put TypeScript contracts in matching `*.type.ts` files.
7. Add or update tests for behavior changes.
8. Update English and Hinglish docs for user-facing changes.
9. Update `PROJECT_CONTEXT.md` when status, commands, structure, or direction changes.
10. Run the verification listed in `tasks.md`.
11. Use Browser Use for user-facing screens and docs.
12. Mark the task `completed`.
13. Commit with the task commit message.
14. Start the next pending task unless blocked.

Git rules:

- The default branch is `main`.
- Commit every completed task.
- Do not push after every task.
- Push only on phase release tasks or when the user asks.
- Preserve user changes and unrelated worktree changes.
- Never use destructive Git commands unless the user explicitly asks.

Local data rules:

- Do not delete SQLite data outside a reset task.
- Reset only known local development DB/uploads paths.
- Preview reset targets with `npm run reset:local`.
- Delete them only with `npm run reset:local -- --apply`.
- For local owner login, set `APIAGEX_LOCAL_OWNER=true`.
- Local owner credentials are `owner@apiagex.local` and `OwnerPass123!`.
- Use development credentials only for local verification.
- Never commit real secrets.

## Hinglish

Apiagex ka kaam `tasks.md` ke through chalega.

Order ye rahega:

1. `agent.md`, `PROJECT_CONTEXT.md`, aur `tasks.md` padho.
2. Pehla `Status: pending` task uthao.
3. Us task ko `in_progress` mark karo.
4. Change sirf usi task ke scope me rakho.
5. Har source, docs, test, script, plugin, aur skill file 250 lines se neeche rakho.
6. TypeScript contracts matching `*.type.ts` files me rakho.
7. Behavior change ho to test add ya update karo.
8. User-facing change ho to English aur Hinglish docs update karo.
9. Status, command, structure, ya direction change ho to `PROJECT_CONTEXT.md` update karo.
10. `tasks.md` wali verification run karo.
11. User-facing screen/docs ke liye Browser Use se manual check karo.
12. Task ko `completed` mark karo.
13. Task ke commit message se commit karo.
14. Blocker na ho to next pending task start karo.

Git rules:

- Default branch `main` hai.
- Har completed task ke baad commit mandatory hai.
- Har task ke baad push nahi karna.
- Push sirf phase release task par ya user ke bolne par karna.
- User changes aur unrelated worktree changes preserve karne hain.
- Destructive Git commands tabhi use honge jab user clearly bole.

Local data rules:

- SQLite data reset task ke bahar delete nahi karna.
- Sirf known local development DB/uploads paths reset karne hain.
- Reset targets preview karne ke liye `npm run reset:local` chalao.
- Delete sirf `npm run reset:local -- --apply` se karna.
- Local owner login ke liye `APIAGEX_LOCAL_OWNER=true` set karo.
- Local owner credentials `owner@apiagex.local` aur `OwnerPass123!` hain.
- Development credentials sirf local verification ke liye hain.
- Real secrets kabhi commit nahi karne.
