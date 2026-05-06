# Relation Schema UI Check

T334 verifies the Admin UI schema builder relation creation flow.

## Browser Flow

- Seeded one target schema through the API so the UI target picker had a valid schema.
- Opened `/adminui#schemas` in a browser and used the schema builder form.
- Created four schemas from the UI, one for each relation type:
  - `oneToOne`
  - `oneToMany`
  - `manyToOne`
  - `manyToMany`
- Verified each created schema through `/api/admin/schemas`.
- Resized the browser to mobile width and verified the created relation schemas remain visible and usable in the schema list.

## Result

- Relation type picker can submit all four backend relation types.
- Relation target picker saves existing target schema metadata.
- Desktop and mobile browser checks passed for the schema builder flow.
