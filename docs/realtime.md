# Realtime

## English

Realtime updates are opt-in per content type.

Enable the content type's realtime master setting and then choose which actions can publish:

```json
{
  "realtimeEnabled": true,
  "realtimeActions": {
    "create": true,
    "update": false,
    "delete": false
  }
}
```

`realtimeEnabled` is the master switch. If it is `false`, no realtime event is published for that content type. If it is `true`, the server only broadcasts the actions that are enabled.

Subscribe with Server-Sent Events:

```js
const stream = new EventSource('/realtime/stream?types=articles');

stream.addEventListener('ready', (event) => {
  console.log(JSON.parse(event.data));
});

stream.addEventListener('update', (event) => {
  console.log(JSON.parse(event.data));
});
```

If you omit `types`, the stream receives updates for every realtime-enabled content type.

If `realtimeActions` is missing on an older content type, the server falls back to the legacy `realtimeEnabled` value:

- `true` means create, update, and delete all publish
- `false` means none of the actions publish

The admin UI listens to the same stream and refreshes its panels when matching updates arrive.

## Hindi

Realtime updates har content type ke liye opt-in hain.

Content type ke realtime master setting ko enable karo aur phir decide karo kaunse actions publish honge:

```json
{
  "realtimeEnabled": true,
  "realtimeActions": {
    "create": true,
    "update": false,
    "delete": false
  }
}
```

`realtimeEnabled` master switch hai. Agar ye `false` hai to koi realtime event publish nahi hoga. Agar ye `true` hai, server sirf enabled actions broadcast karega.

Server-Sent Events se subscribe karo:

```js
const stream = new EventSource('/realtime/stream?types=articles');

stream.addEventListener('ready', (event) => {
  console.log(JSON.parse(event.data));
});

stream.addEventListener('update', (event) => {
  console.log(JSON.parse(event.data));
});
```

Older content types me agar `realtimeActions` missing hai to server legacy `realtimeEnabled` value use karta hai:

- `true` ka matlab create, update, aur delete teeno publish honge
- `false` ka matlab koi action publish nahi hoga

`types` omit karoge to stream sab realtime-enabled content types ke updates lega.

Admin UI isi stream ko sunta hai aur matching updates par apne panels refresh karta hai.
