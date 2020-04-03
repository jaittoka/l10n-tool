import { promises as fs } from "fs";
import { join } from "path";
import findFiles from "./findFiles";
import parseFile, { Localizations } from "./parseLocaleFile";
import compileLocale from "./compileLocale";

function isLocaleFile(path: string): boolean {
  return /\.l10n\.json$/.test(path);
}

async function readAndParseFile(path: string, localizations: Localizations) {
  return parseFile(path, await fs.readFile(path, "utf8"), localizations);
}

async function findLocaleStrings(pred: (path: string) => boolean, path: string) {
  const list = await findFiles(pred, path);
  const localizations = {} as Localizations;
  await Promise.all(list.map(path => readAndParseFile(path, localizations)));
  return localizations;
}

export interface Opts {
  srcDir: string;
  destDir: string;
  isLocaleFile: (path: string) => boolean; // default: ends with .l10n.json
  prefix: string; // default "locale_"
  ts: boolean; // default true
}

const defaultOpts: Opts = {
  srcDir: '.',
  destDir: './locale',
  isLocaleFile,
  prefix: 'locale_',
  ts: true
}

export default async function(options?: Partial<Opts>) {
  const opts = { ...defaultOpts, ...options };
  const ext = opts.ts ? '.ts' : '.js';

  const locales = await findLocaleStrings(opts.isLocaleFile, opts.srcDir);
  const languages = Object.keys(locales);
  if (languages.length === 0) return [];

  await fs.mkdir(opts.destDir, { recursive: true });
  
  return Promise.all(
    languages.map(language => {
      const tsContent = compileLocale(locales[language], opts.ts);
      const filename = join(opts.destDir, `${opts.prefix}${language}${ext}`);
      return fs.writeFile(filename, tsContent, "utf8");
    })
  ).then(() => languages);
}
