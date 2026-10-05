# Checking the translations

Every word a part says by itself (a label, an error, an announcement) has a translation in nine languages
(D94). They were written without a native speaker. These sheets are for one.

**For a reviewer:** open your language's file (`german.csv`, `hindi.csv`…) in Excel, Numbers or Google
Sheets. Each row is one phrase:

- **English**: what the part says in English.
- **Translation now**: what it says in your language today.
- **Where it is used**: the parts that say it, to see it in place at build-components.devstash.me/<part>
  (the editor's Words tab has a Language picker).
- **Note**: anything in curly brackets, such as `{count}` or `{name}`, is filled in on the page. Keep it,
  spelled exactly the same, wherever it belongs in your sentence.

If a translation is wrong, awkward or too formal, write the better one in **Corrected**. Leave Corrected empty
where it is fine. **Comment** is for anything else. Keep the file as CSV (UTF-8) when saving.

**Back in the project:** put the returned file in this folder and run

    node scripts/translation-sheets.mjs import

It copies every Corrected cell into `lib/dictionary.ts`, and refuses one that drops or renames a blank. Then
run `e2e/languages.spec.ts`, and add a version entry (`lib/versions.ts`) for the parts whose words changed.
To make fresh sheets after new phrases are added: `node scripts/translation-sheets.mjs export`.
