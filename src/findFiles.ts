import { promises as fs } from "fs";
import { join } from "path";

export type Predicate = (path: string) => boolean;

function joinArrays<T>(arrays: T[][]): T[] {
  const result = [] as T[];
  arrays.forEach(arr => arr.forEach(item => result.push(item)));
  return result;
}

async function processDir(pred: Predicate, path: string): Promise<string[]> {
  const list = await fs.readdir(path);
  return Promise.all(list.map(p => processPath(pred, join(path, p)))).then(
    joinArrays
  );
}

export default async function processPath(
  pred: Predicate,
  path: string
): Promise<string[]> {
  const s = await fs.stat(path);
  if (s.isDirectory()) {
    return processDir(pred, path);
  } else if (s.isFile() && pred(path)) {
    return Promise.resolve([path]);
  } else {
    return Promise.resolve([]);
  }
}
