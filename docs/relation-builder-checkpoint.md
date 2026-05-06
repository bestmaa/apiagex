# Relation Builder Checkpoint

T337 verifies the Admin UI relation schema builder before entry relation editing starts.

## Covered

- Relation type picker is visible for relation fields.
- Target schema picker uses existing schema metadata and does not require raw schema id typing.
- Direction hints match backend relation semantics.
- Selected schema details show relation kind and target schema.
- Edit warnings appear when an existing schema has entries.
- Mobile layout keeps relation type, target picker, and helper copy usable.

## Browser Gate

- Desktop browser check verified relation type, target picker, hints, schema details, and edit warnings.
- Mobile browser check verified relation controls at 390px width.
- Admin UI create flow created schemas for `oneToOne`, `oneToMany`, `manyToOne`, and `manyToMany`.

## Result

The schema builder relation workflow is ready for Phase 5 entry UI relation editing.
