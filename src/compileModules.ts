import { Module, Language, Value, Country } from "./types";
import parseKeys, { Tree, isLeaf, Node, mergeTree } from "./parseKeys";
import { promises as fs } from "fs";
import * as fp from "path";

export interface Opts {
  destDir: string;
  comments: boolean;
  ts: boolean;
}

const re = /\$\{(\w+)\}/g;

const _indent = "  ";

function compileValue(leaf: Value, ctx: Opts): string {
  const variables = [] as string[];
  const rhs = leaf.value.replace(re, (_, name) => {
    variables.push(name);
    return "${i." + name + "}";
  });
  const comment = ctx.comments ? ` /* ${leaf.filePath} */` : "";
  if (variables.length > 0) {
    const t = ctx.ts
      ? `: {${variables.map((n) => `${n}: string`).join(", ")}}`
      : "";
    return `(i${t}) => \`${rhs}\`${comment}`;
  } else {
    return `${JSON.stringify(rhs)}${comment}`;
  }
}

function compileField(
  node: Node,
  name: string,
  ctx: Opts,
  indent: string
): string {
  return `${indent}${name}: ${compileNode(node, ctx, indent)}`;
}

function compileTree(tree: Tree, ctx: Opts, indent: string): string {
  return `{\n${Object.keys(tree.children)
    .map((n) => compileField(tree.children[n], n, ctx, indent + _indent))
    .join(",\n")}\n${indent}}`;
}

function compileNode(node: Node, ctx: Opts, indent: string): string {
  return isLeaf(node)
    ? compileValue(node, ctx)
    : compileTree(node, ctx, indent);
}

async function writeFile(path: string, data: string) {
  await fs.mkdir(fp.dirname(path), { recursive: true });
  return fs.writeFile(path, data, "utf8");
}

function filename(
  moduleName: string,
  language: string,
  country: string | undefined,
  ext: string
): string {
  return (
    [moduleName, language, country?.toUpperCase()]
      .filter(Boolean)
      .join("_") + ext
  );
}

function compileAndWrite(opts: Opts, path: string, tree: Tree): Promise<void> {
  const code = compileNode(tree, opts, "");
  return writeFile(path, `export default ${code};`);
}

function compileCountry(
  opts: Opts,
  moduleName: string,
  language: string,
  common: Tree,
  country: Country
): Promise<void> {
  const countryTree = parseKeys(country.keys);
  const tree = mergeTree(common, countryTree);
  const path = fp.join(
    opts.destDir,
    filename(
      moduleName,
      language,
      country.name,
      opts.ts ? ".ts" : ".js"
    )
  );
  return compileAndWrite(opts, path, tree);
}

function compileLanguage(moduleName: string, opts: Opts) {
  return (language: Language): Promise<void> => {
    const common = parseKeys(language.commonKeys);
    if (language.countries.length > 0) {
      return Promise.all(
        language.countries.map((c) =>
          compileCountry(opts, moduleName, language.name, common, c)
        )
      ).then(() => {});
    } else {
      const path = fp.join(
        opts.destDir,
        filename(
          moduleName,
          language.name,
          undefined,
          opts.ts ? ".ts" : ".js"
        )
      );

      return compileAndWrite(opts, path, common);
    }
  };
}

function compileModule(module: Module, opts: Opts): Promise<void> {
  return Promise.all(
    module.languages.map(compileLanguage(module.name, opts))
  ).then(() => {});
}

function uniq(arr: string[]): boolean {
  const res = {} as Record<string, boolean>;
  for (let i = 0; i < arr.length; i++) {
    if (res[arr[i]]) return false;
    res[arr[i]] = true;
  }
  return true;
}

function validateLanguage(language: Language): void {
  const numCountries = language.countries.length;
  if (numCountries < 2) return;

  const allKeys = {} as Record<
    string,
    { country: string; value: string; path: string }[]
  >;

  language.countries.map((c) => {
    Object.keys(c.keys).forEach((key) => {
      allKeys[key] = (allKeys[key] || []).concat([
        {
          country: c.name,
          value: c.keys[key].value,
          path: c.keys[key].filePath,
        },
      ]);
    });
  });

  Object.keys(allKeys).forEach((key) => {
    const value = allKeys[key];
    if (value.length !== numCountries) {
      throw new Error(
        `Key ${JSON.stringify(
          key
        )} was not defined in all country variations in language '${
          language.name
        }'. Defined in ${value.map((v) => JSON.stringify(v.path)).join(", ")}`
      );
    }

    if (!uniq(value.map((v) => v.value))) {
      throw new Error(
        `Not all values in country variations for language ${JSON.stringify(
          language.name
        )} are unique:\n  ${value
          .map((v) => `${v.country}: ${v.value}`)
          .join("\n  ")}`
      );
    }
  });
}

function validateModule(module: Module): void {
  module.languages.forEach(validateLanguage);
}

export default async function compileModules(
  modules: Module[],
  opts: Opts
): Promise<void> {
  modules.forEach(validateModule);
  await Promise.all(modules.map((m) => compileModule(m, opts))).then(() => {});
}
