import { promises as fs } from "fs";
import { join } from "path";

/*
  Return:
    undefined: not a locale file
    '*': A multi language file
    string: A language file with a single value
*/
export type ClassifyFile = (path: string) => string | undefined;

export interface LanguageFile {
  path: string;
  language?: string;
}

function joinArrays<T>(arrays: T[][]): T[] {
  const result = [] as T[];
  arrays.forEach((arr) => arr.forEach((item) => result.push(item)));
  return result;
}

async function processDir(
  classify: ClassifyFile,
  path: string
): Promise<LanguageFile[]> {
  const list = await fs.readdir(path);
  return Promise.all(
    list.map((p) => processPath(classify, join(path, p)))
  ).then(joinArrays);
}

export default async function processPath(
  classify: ClassifyFile,
  path: string
): Promise<LanguageFile[]> {
  const s = await fs.stat(path);
  if (s.isDirectory()) {
    return processDir(classify, path);
  } else if (s.isFile()) {
    const r = classify(path);
    switch (r) {
      case undefined:
        return Promise.resolve([]);
      case "*":
        return Promise.resolve([{ path }]);
      default:
        return Promise.resolve([{ path, language: r }]);
    }
  } else {
    return Promise.resolve([]);
  }
}
