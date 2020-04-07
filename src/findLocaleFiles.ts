import { promises as fs } from "fs";
import { join } from "path";
import { LocaleFile } from "./types";
import joinArrays from './joinArrays';

const localeFileRE = /(?:(\w+)\.|^|\/)(\w{2})(?:_(\w{2}))?\.l10n\.json$/;

function parsePath(path: string): LocaleFile | undefined {
  const m = localeFileRE.exec(path);
  if (!m) return;
  return {
    path,
    module: m[1],
    language: m[2]!,
    country: m[3],
  };
}


async function processPath(path: string): Promise<LocaleFile[]> {
  const s = await fs.stat(path);
  if (s.isDirectory()) {
    return processDir(path);
  } else if (s.isFile()) {
    const f = parsePath(path);
    return Promise.resolve(f ? [f] : []);
  } else {
    return Promise.resolve([]);
  }
}

export default async function processDir(path: string): Promise<LocaleFile[]> {
  const list = await fs.readdir(path);
  return Promise.all(list.map((p) => processPath(join(path, p)))).then(
    joinArrays
  );
}
