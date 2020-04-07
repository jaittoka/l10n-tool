# Overview

l10n-tool is used to create typescript/javascript locale files from localization JSON-files under your project source. It goes through every locale JSON file and combines them to a single file per language.

# Installation

`npm i --save l10n-tool`

or

`yarn add l10n-tool`

# Command line Usage (if globally installed)

`l10n-tool <source dir> <target dir>`

Source directory is the root directory under which the tool scans for every localization file

Localization file is a JSON file that is named as `[module].<lang>[_<country>].l10n.json` and contains an object of localizations keys.

Target directory is the directory where the tool generates the localization files. (by default named `<module>_<lang>_<country>.[js, ts]`).

## Localization files example

`en.l10n.json`
```json
{
  "common.file.save": "Save",
  "common.file.cancel": "Cancel",
}
```

`en_GB.l10n.json`
```json
{
  "apartments": "You have ${count} flats."
}
```

`en_US.l10n.json`
```json
{
  "apartments": "You have ${count} apartments."
}
```


When you run the l10n-tool it will generate two files under the destination directory.

One for British English (`en_GB.ts`):

```typescript
export default {
  common: {
    file: {
      save: "Save" ,
      cancel: "Cancel"
    }
  },
  apartments: (i: {count: string}) => `You have ${i.count} flats.`
};
```

and one for US English (`en_US.ts`):

```typescript
export default {
  common: {
    file: {
      save: "Save",
      cancel: "Cancel"
    }
  },
  apartments: (i: {count: string}) => `You have ${i.count} apartments.`
};
```

The tool generates functions if the localization string in the JSON contains parameters. For example the string `"Foo ${x} bar"` has one parameter with name `x`. This would be converted to

```typescript
(i: {x: string}) => `Foo ${i.x} bar
```

If the localization string doesn't contain named paramaters, then the string goes unmodified to the resulting localization file.

You can then import these files from your project code and use the strings. The advantage of using localization strings this way is that you get code completion and type safety (type safety in typescript only). An example:

```typescript
import en from "../locale/en_GB";

console.log(en.apartments(4)); // => You have 4 flats.
```

# Command Line Options

- `-j` generate javascript (default is typescript)
- `-c` put comment after each localization string from which file the key originates

# Programmatic use

## Example

```typescript
import generate from "l10n-tool";

const opts = {
  srcDir: "./src/",
  destDir: "./locale",
};

generate(opts)
  .then(() => console.log("success"))
  .catch((err) => console.error(err.message));
```

The above will scan the files from `src`- directory and put the result to the `./locale`- directory.

## Options structure

Options interface given to l10n tool function:

```typescript
interface Opts {
  srcDir: string;
  destDir: string;
  ts: boolean;
  comments: boolean;
}
```

The function will receive partial of the Opts interface. Any field missing will be filled with the default value.
