import { promises as fs } from "fs";
import { LocaleFile, Module, Language, Country, Value } from "./types";

function findOrAdd<T>(arr: T[], pred: (v: T) => boolean, create: () => T): T {
  let item = arr.find(pred);
  if (item) {
    return item;
  } else {
    const newItem = create();
    arr.push(newItem);
    return newItem;
  }
}

function getModule(modules: Module[], name: string): Module {
  return findOrAdd(
    modules,
    (m) => m.name === name,
    () => ({ name, languages: [] })
  );
}

function getLanguage(languages: Language[], name: string): Language {
  return findOrAdd(
    languages,
    (m) => m.name === name,
    () => ({ name, commonKeys: {}, countries: [] })
  );
}

function getCountry(countries: Country[], name: string): Country {
  return findOrAdd(
    countries,
    (m) => m.name === name,
    () => ({ name, keys: {} })
  );
}

async function readJSON(path: string): Promise<any> {
  const data = await fs.readFile(path, "utf8");
  return JSON.parse(data);
}

async function readKeys(
  filePath: string,
  keys: Record<string, Value>
): Promise<void> {
  const json = await readJSON(filePath);
  Object.keys(json).forEach((key) => {
    const value = keys[key];
    if (value) {
      throw new Error(
        `Key ${key} is redefined at ${filePath} (already defined at ${value.filePath})`
      );
    }
    keys[key] = { filePath, value: json[key] };
  });
}

export default async function readAndGroupFiles(
  files: LocaleFile[]
): Promise<Module[]> {
  let modules = [] as Module[];
  return Promise.all(
    files.map((file) => {
      const moduleName = file.module || "";
      const module = getModule(modules, moduleName);
      const language = getLanguage(module.languages, file.language);
      const keys = file.country
        ? getCountry(language.countries, file.country).keys
        : language.commonKeys;
      return readKeys(file.path, keys);
    })
  ).then(() => modules);
}
