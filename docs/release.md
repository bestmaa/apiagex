# Release

## English

Use these checks before a release:

1. Run `npm run check`
2. Run `npm run smoke`
3. Run `npm audit --audit-level=high`
4. Open the admin UI and verify:
   - sign in works
   - content types can be created
   - entries can be created
   - media uploads work
   - backup export works
   - backup restore works
5. Restart the server and verify previously created data is still there

Recommended release smoke flow:

- install the package
- create one content type
- create one published entry
- upload one media file
- export a backup
- restart the server
- restore the backup into a fresh database
- confirm content types, entries, and media load back correctly

## Hindi

Release se pehle ye checks run karo:

1. `npm run check`
2. `npm run smoke`
3. `npm audit --audit-level=high`
4. Admin UI open karke verify karo:
   - sign in kaam karta hai
   - content types create ho rahe hain
   - entries create ho rahe hain
   - media upload kaam karta hai
   - backup export kaam karta hai
   - backup restore kaam karta hai
5. Server restart karke verify karo ki pehle ka data ab bhi available hai

Recommended release smoke flow:

- package install karo
- ek content type banao
- ek published entry banao
- ek media file upload karo
- backup export karo
- server restart karo
- backup ko fresh database me restore karo
- confirm karo ki content types, entries, aur media sahi se load ho rahe hain
