import { promises as fs } from "fs";
import findLocaleFiles from './findLocaleFiles';
import readAndGroupFiles from "./readAndGroupFiles";
import compileModules from './compileModules';

export interface Opts {
  srcDir: string;
  destDir: string;
  comments: boolean;
  ts: boolean; // default true
}

const defaultOpts: Opts = {
  srcDir: ".",
  destDir: "./locale",
  comments: false,
  ts: true,
};

export default async function (options?: Partial<Opts>) {
  const opts = { ...defaultOpts, ...options };
  await fs.mkdir(opts.destDir, { recursive: true });
  const files = await findLocaleFiles(opts.srcDir);
  const modules = await readAndGroupFiles(files);
  compileModules(modules, opts);
}
