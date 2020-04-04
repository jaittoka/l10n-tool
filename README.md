# Overview

l10n-tool is used to create typescript/javascript locale files from localization JSON-files under your project source. It goes through every locale JSON file and combines them to a single file per language.

# Installation

`npm i --save l10n-tool`

or

`yarn add l10n-tool`

# Command line Usage (if globally installed)

`l10n-tool <source dir> <target dir>`

Source directory is the root directory under which the tool scans for every localization file

Localization is either single language file (name is `*.<lang>.json`) or multi language file (name is `*.l10n.json`)

Target directory is the directory where the tool generates the localization files. (by default named `locale_<lang>.[js, ts]`).

## Single-language file

```json
{
  "common.file.save": "Save",
  "common.file.cancel": "Cancel",
  "msgCount": "You have ${count} messages."
}
```

## Multi-language file

Example of multi language localization JSON-file structure:

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
      cancel: "Cancel",
    },
    title: "Title",
  },
  msgCount: (i: { count: string }) => `You have ${i.count} messages.`,
};
```

and one for Finnish (fi):

```typescript
export default {
  common: {
    file: {
      save: "Tallenna",
      cancel: "Peruuta",
    },
    title: "Otsikko",
  },
  msgCount: (i: { count: string }) => `Sinulla on ${i.count} viestiä.`,
};
```

The tool generates functions if the localization string in the JSON contains parameters. For example the string `"Foo ${x} bar"` has one parameter with name `x`. This would be converted to

```typescript
(i: {x: string}) => `Foo ${i.x} bar
```

If the localization string doesn't contain named paramaters, then the string goes unmodified to the resulting localization file.

You can then import these files from your project code and use the strings. The advantage of using localization strings this way is that you get code completion and type safety (type safety in typescript only). An example:

```typescript
import fi from "../locale/locale_fi";
import en from "../locale/locale_en";

console.log(en.common.msgCount(4)); // => You have 4 messages.
console.log(fi.common.msgCount(3)); // => Sinulla on 3 viestiä.
```

# Command Line Options

- `-p prefix` prefix for generated localization files (default `locale_`)
- `-j` generate javascript (default is typescript)
- `-c` put comment after each localization string from which file the key originates

# Programmatic use

## Example

```typescript
import generate from "l10n-tool";

const opts = {
  srcDir: "./src/",
  destDir: "./locales",
};

generate(opts)
  .then(() => console.log("success"))
  .catch((err) => console.error(err.message));
```

The above will scan the files from `src`- directory and put the result to the `./locales`- directory.

## Options structure

Options interface given to l10n tool function:

```typescript
interface Opts {
  srcDir: string;
  destDir: string;
  classifyFile: (path: string) => string | undefined;
  prefix: string;
  ts: boolean;
}
```

The function will receive partial of the Opts interface. Any field missing will be filled with the default value.

`classifyFile` must return '\*' if file is in multi language format, string if there is a single language (defined by the returned string) or undefined if the file is not a language file.
