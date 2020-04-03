import { Decoders as D, runDecoder, isFailure, GetType } from "typed-decoders";

const KeyDecoder = D.Rec(D.Str);
const KeyFileDecoder = D.Rec(KeyDecoder);
type KeyFile = GetType<typeof KeyFileDecoder>;

export interface Leaf {
  filePath: string;
  value: string;
}

export interface Tree {
  children: Record<string, Node>;
}

export type Node = Leaf | Tree;

export type Localizations = Record<string, Tree>;

export function isTree(node: Node): node is Tree {
  return typeof (node as Tree).children === "object";
}

export function isLeaf(node: Node): node is Leaf {
  return !isTree(node);
}

const j2s = JSON.stringify;

function assureIsTree(
  node: Node,
  path: string[],
  filePath: string
): node is Tree {
  if (isLeaf(node)) {
    throw new Error(
      `File ${j2s(node.filePath)} defined the key '${j2s(
        path.join(".")
      )}' as a value, but file ${j2s(filePath)} defined it as an internal node.`
    );
  }
  return true;
}

function getFiles(node: Node): string[] {
  const result = [] as string[];
  function enter(node: Node): void {
    if (isLeaf(node)) {
      result.push(node.filePath);
    } else {
      Object.keys(node.children).forEach(key => enter(node.children[key]));
    }
  }
  enter(node);
  return result;
}

function merge(tree: Tree, path: string[], filePath: string, value: string) {
  let node: Node = tree;
  for (let i = 0; i + 1 < path.length; i++) {
    const name = path[i];
    if (assureIsTree(node, path, filePath)) {
      let next: Node = node.children[name];
      if (!next) {
        next = { children: {} };
        node.children[name] = next;
      }
      node = next;
    }
  }

  // we know we are at a Tree node, but typescript doesn't
  const children = (node as Tree).children;
  const key = path[path.length - 1];
  const n = children[key];
  if (n) {
    const def = isLeaf(n)
      ? ` defined at ${j2s(n.filePath)}`
      : `, which was already defined as an internal node at following files ${getFiles(
          n
        ).join(", ")}`;
    throw new Error(
      `File ${j2s(filePath)} redefines the key ${j2s(path.join("."))}${def}`
    );
  }

  children[key] = { filePath, value };
}

function readLocaleData(
  path: string,
  data: KeyFile,
  localizations: Localizations
): void {
  Object.keys(data).forEach(key => {
    const parts = key.split(".");
    const localeValues = data[key];
    Object.keys(localeValues).forEach(language => {
      let tree = localizations[language];
      if (!tree) {
        tree = { children: {} };
        localizations[language] = tree;
      }
      merge(tree, parts, path, localeValues[language]);
    });
  }, {});
}

function parseContents(
  path: string,
  json: object,
  localizations: Localizations
) {
  const res = runDecoder(KeyFileDecoder, json);
  if (isFailure(res)) {
    throw new Error(
      `Error decoding locale file ${j2s(path)}. Field ${j2s(res.path)}: ${
        res.error
      }`
    );
  }
  return readLocaleData(path, res.value, localizations);
}

export default function(
  path: string,
  content: string,
  localizations: Localizations
) {
  let json;
  try {
    json = JSON.parse(content);
  } catch (err) {
    throw new Error(`Error parsing locale file ${path}: ${err.message}`);
  }
  return parseContents(path, json, localizations);
}
