import { promises as fs } from "fs";
import { join } from "path";
import findFiles, { ClassifyFile, LanguageFile } from "./findFiles";
import parseFile, { Localizations } from "./parseLocaleFile";
import compileLocale from "./compileLocale";

function classifyFile(path: string): string | undefined {
  if (/\.l10n\.json$/.test(path)) {
    return '*';
  }
  const re = /\.(\w+)\.json$/ 
  const m = re.exec(path);
  if (m) {
    return m[1];
  }
}

async function readAndParseFile(file: LanguageFile, localizations: Localizations) {
  return parseFile(file.path, file.language, await fs.readFile(file.path, "utf8"), localizations);
}

async function findLocaleStrings(
  classifyFile: ClassifyFile,
  path: string
) {
  const list = await findFiles(classifyFile, path);
  const localizations = {} as Localizations;
  await Promise.all(list.map(path => readAndParseFile(path, localizations)));
  return localizations;
}

export interface Opts {
  srcDir: string;
  destDir: string;
  classifyFile: ClassifyFile;
  prefix: string; // default "locale_"
  comments: boolean;
  ts: boolean; // default true
}

const defaultOpts: Opts = {
  srcDir: ".",
  destDir: "./locale",
  prefix: "locale_",
  classifyFile,
  comments: false,
  ts: true
};

export default async function(options?: Partial<Opts>) {
  const opts = { ...defaultOpts, ...options };
  const ext = opts.ts ? ".ts" : ".js";

  const locales = await findLocaleStrings(opts.classifyFile, opts.srcDir);
  const languages = Object.keys(locales);
  if (languages.length === 0) return [];

  await fs.mkdir(opts.destDir, { recursive: true });

  return Promise.all(
    languages.map(language => {
      const tsContent = compileLocale(locales[language], {
        ts: opts.ts,
        comments: opts.comments
      });
      const filename = join(opts.destDir, `${opts.prefix}${language}${ext}`);
      return fs.writeFile(filename, tsContent, "utf8");
    })
  ).then(() => languages);
}
