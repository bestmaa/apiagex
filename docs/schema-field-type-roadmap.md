# Schema Field Type Roadmap

Apiagex schema fields should stay predictable across SQLite, PostgreSQL, and MySQL. The database stores entry data as JSON, so field types define validation, Admin UI controls, OpenAPI output, generated TypeScript, and AI/MCP guidance.

Hinglish: Field type ka matlab sirf DB column nahi hai. Ye validation, Admin UI input, OpenAPI docs, generated TS types, aur AI/MCP ko guide karta hai.

## Current Types

- `text`: short string.
- `longText`: multiline string.
- `number`: finite JavaScript number.
- `integer`: finite whole number; decimals are rejected.
- `decimal`: finite number for ratings, measurements, and prices where exact cents math is not required.
- `currency`: finite number for money-like values; pair with an enum/select currency-code field when the project needs multiple currencies.
- `boolean`: true/false.
- `date`: date string accepted by `Date.parse`; Admin UI uses date input.
- `datetime`: date-time string accepted by `Date.parse`; Admin UI uses `datetime-local`.
- `time`: `HH:mm` or `HH:mm:ss` 24-hour time string.
- `email`: string with basic email-shape validation.
- `url`: absolute `http:` or `https:` URL string.
- `enum`: string that must match one configured option.
- `multiSelect`: string array where every value must match one configured option.
- `password`: hidden string input for password-like workflow data. It is not automatically hashed by schema entry storage.
- `richText`: string editor content. Sanitization/render policy belongs to the consuming app.
- `json`: any valid JSON value.
- `media`: string URL/path with schema-scoped upload support.
- `file`: string URL/path with schema-scoped upload support for images and PDFs.
- `image`: string URL/path with schema-scoped upload support for image MIME types only.
- `relation`: entry id or entry id array, depending on relation type.

## Field Matrix

| Type | Storage | Admin UI | Validation | OpenAPI/Typegen |
| --- | --- | --- | --- | --- |
| `text` | string | text input | string | string |
| `longText` | string | textarea | string | string |
| `richText` | string | larger textarea | string | string |
| `password` | string | password input | string | string/password |
| `email` | string | email input | basic email shape | string/email |
| `url` | string | URL input | absolute HTTP/HTTPS URL | string/uri |
| `number` | number | number input | finite number | number |
| `integer` | number | number input, step 1 | finite integer | integer/number |
| `decimal` | number | number input, step 0.01 | finite number | number |
| `currency` | number | number input, step 0.01 | finite number | number |
| `boolean` | boolean | checkbox | boolean | boolean |
| `date` | string | date input | parseable date | string/date |
| `datetime` | string | datetime-local input | parseable date-time with `T` | string/date-time |
| `time` | string | time input | `HH:mm` or `HH:mm:ss` | string |
| `enum` | string | select | one configured option | string enum |
| `multiSelect` | string[] | multi-select | configured options only | string enum array |
| `json` | JSON value | textarea | valid JSON | unknown/object |
| `media` | string URL/path | URL plus upload | string; uploads allow images/PDF | string |
| `file` | string URL/path | URL plus upload | string; uploads allow images/PDF | string |
| `image` | string URL/path | URL plus upload | string; uploads allow images only | string |
| `relation` | string or string[] | relation picker | target entries exist | string/string[] |

## Notes

- `slug`: keep as `text` until unique/indexed constraints exist.
- `phone`: keep as `text` until country/format expectations are explicit.
- `password` stores the submitted string. Use workflow password nodes or custom code for hashing/verification.
- `currency` is a decimal-style number field, not exact arbitrary-precision accounting math.
- `richText` stores content as a string; the frontend consuming the content should choose rendering and sanitization rules.
- `file` and `image` reuse the central media engine with schema-scoped folders.
