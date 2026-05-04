# Agent Instructions

These rules are mandatory for every future change in this repository.

Ye rules is repository ke har future change ke liye mandatory hain.

## Start Here

- Read `PROJECT_CONTEXT.md` before starting work, especially after a model switch.
- Kaam start karne se pehle `PROJECT_CONTEXT.md` padho, especially model switch ke baad.
- Keep `PROJECT_CONTEXT.md` updated when project direction, structure, or next steps change.
- Project direction, structure, ya next steps change ho to `PROJECT_CONTEXT.md` update karo.

## Code Quality

- Keep code clean, readable, and modular.
- Har code clean, readable, aur modular hona chahiye.
- Keep source files under 250 lines.
- Source code files 250 lines se upar nahi hone chahiye.
- Prefer small modules with clear boundaries.
- Chhote modules banao jinki responsibility clear ho.
- Do not add unrelated refactors during a feature change.
- Feature change ke time unrelated refactor mat karo.

## File Organization

- Keep types in separate matching type files; do not mix them into implementation files.
- Types ko alag matching type files me rakho; implementation files me mix mat karo.
- Example: `realtime.routes.ts` route logic ke liye hoga, aur uske types `realtime.routes.type.ts` me honge.
- Har feature file ka type file same naming pattern follow karega, jaise `*.service.ts` ke liye `*.service.type.ts`.

## Documentation

- Every module must have documentation in English and Hindi.
- Har module ki documentation English aur Hindi dono me honi chahiye.
- Update docs after every module change, even if the change is small.
- Chhote change ke baad bhi module docs update karna mandatory hai.
- Public examples should show how to configure and use the feature.
- Public examples me feature ko configure aur use karne ka tarika dikhna chahiye.

## Testing

- Add or update tests for every behavior change.
- Har behavior change ke liye test add ya update karo.
- Run tests yourself before reporting completion.
- Completion batane se pehle khud test run karo.
- Build must pass before a change is considered done.
- Change tabhi done maana jayega jab build pass ho.

## Product Direction

- Apiagex is an open-source, dynamic, multi-tenant headless CMS platform.
- Apiagex ek open-source, dynamic, multi-tenant headless CMS platform hai.
- Users should be able to create APIs from the admin UI.
- Users admin UI se dynamic APIs bana sakein.
- Realtime must be opt-in per dynamic API.
- Realtime har dynamic API ke liye opt-in hona chahiye.
- Multi-tenant mode must support isolated tenant APIs and shared API templates.
- Multi-tenant mode me tenant-specific APIs aur shared API templates dono support hone chahiye.
- Database support must go through adapters so SQL engines can change later.
- Database support adapter layer se hona chahiye taaki SQL engine baad me change ho sake.
