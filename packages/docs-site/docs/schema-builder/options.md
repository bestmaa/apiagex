# Enum And MultiSelect

Use option fields when the value must come from a fixed list.

## Enum

`enum` stores exactly one selected string.

Schema option example:

```json
{
  "name": "Status",
  "slug": "status",
  "type": "enum",
  "required": true,
  "options": ["draft", "review", "published"]
}
```

Valid POST:

```json
{
  "data": {
    "status": "published"
  }
}
```

Invalid POST:

```json
{
  "data": {
    "status": "archived"
  }
}
```

`archived` fails because it is not in the configured options.

## MultiSelect

`multiSelect` stores an array of selected strings.

```json
{
  "name": "Tags",
  "slug": "tags",
  "type": "multiSelect",
  "options": ["veg", "spicy", "featured"]
}
```

Valid POST:

```json
{
  "data": {
    "tags": ["veg", "featured"]
  }
}
```

Hinglish: `enum` me ek value select hoti hai. `multiSelect` me multiple fixed values array me save hoti hain. Dono me options ke bahar ki value reject hoti hai.
