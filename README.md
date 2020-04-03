Overview
========

l10n-tool is used to create typescript/javascript locale files from localizaion JSON-files under your project source.

Installation
============
`npm i --save l10n-tool`

or

`yarn add l10n-tool`

Command line Usage (if globally installed)
=====

`l10n-tool <source dir> <target dir>`


Source directory is the root directory under which the tool scans for every localization file (by default named by `*.l10n.json`).

Target directory is the directory where the tool generates the localization files (by default named `locale_<lang>.[js, ts]`).

Explanation
========

Example of localization JSON-file structure:
```json
{
    "common.file.save": {
        "en": "Save",
        "fi": "Tallenna"
    },
    "common.file.cancel": {
        "en": "Cancel",
        "fi": "Peruuta"
    },
    "msgCount": {
        "en": "You have ${count} messages.",
        "fi": "Sinulla on ${count} viestiä."
    }
}
```

When you run the l10n-tool it will generate two files under the destination directory.

One for English (en):

```typescript
export default {
  common: {
    file: {
      save: "Save",
      cancel: "Cancel"
    },
    title: "Title"
  },
  msgCount: (i: {count: string}) => `You have ${i.count} messages.`
}
```

and one for Finnish (fi):

```typescript
export default {
  common: {
    file: {
      save: "Tallenna",
      cancel: "Peruuta"
    },
    title: "Otsikko"
  },
  msgCount: (i: {count: string}) => `Sinulla on ${i.count} viestiä.`
}
```

The tool generates functions if the localization string in the JSON contains parameters. For example the string `"Foo ${x} bar"` has one parameter with name `x`. This would be converted to 
```typescript
(i: {x: string}) => `Foo ${i.x} bar
```

If the localization string doesn't contain named paramaters, then the string goes unmodified to the resulting localization file.

You can then import these files from your project code and use the strings. The advantage of using localization strings this way is that you get code completion and type safety (type safety in typescript only). An example:

```typescript
import fi from '../locale/locale_fi';
import en from '../locale/locale_en';

console.log(en.common.msgCount(4)); // => You have 4 messages.
console.log(fi.common.msgCount(3)); // => Sinulla on 3 viestiä.
```

Command Line Options
=======
* `-p prefix` prefix for generated localization files (default `locale_`)
* `-r regex` regexp for determining whether file is a localization JSON-file (default `/\.l10n\.json$/`)
* `-j` generate javascript (default is typescript)

Programmatic use
================

Example
-------

```
import generate from 'l10n-tool'

const opts = {
  srcDir: './src/',
  destDir: './locales'
}

generate(opts)
  .then(() => console.log('success')) 
  .catch(err => console.error(err.message))
```

The above will scan the files from `src`- directory and put the result to the `./locales`- directory.


Options structure
-------

Options interface given to l10n tool function:

```
interface Opts {
  srcDir: string;
  destDir: string;
  isLocaleFile: (path: string) => boolean;
  prefix: string;
  ts: boolean;
}
```

The function will receive partial of the Opts interface. Any field missing will be filled with the default value.