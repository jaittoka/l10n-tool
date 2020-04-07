import { Value } from "./types";

export interface Tree {
  children: Record<string, Node>;
}

export type Node = Value | Tree;

const j2s = JSON.stringify;

export function isTree(node: Node): node is Tree {
  return typeof (node as Tree).children === "object";
}

export function isLeaf(node: Node): node is Value {
  return !isTree(node);
}

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
      Object.keys(node.children).forEach((key) => enter(node.children[key]));
    }
  }
  enter(node);
  return result;
}

function mergeKey(tree: Tree, path: string[], value: Value) {
  let node: Node = tree;
  for (let i = 0; i + 1 < path.length; i++) {
    const name = path[i];
    if (assureIsTree(node, path, value.filePath)) {
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
      `File ${j2s(value.filePath)} redefines the key ${j2s(
        path.join(".")
      )}${def}`
    );
  }

  children[key] = value;
}

export function mergeTree(t1: Tree, t2: Tree): Tree {
  const result = { children: {} };
  function enter(n: Node, path: string[]) {
    if (isLeaf(n)) {
      mergeKey(result, path, n);
    } else {
      Object.keys(n.children).forEach((key) =>
        enter(n.children[key], path.concat([key]))
      );
    }
  }
  enter(t1, []);
  enter(t2, []);
  return result;
}

export default function parseKeys(keys: Record<string, Value>): Tree {
  const tree = { children: {} };
  Object.keys(keys).forEach((key) => mergeKey(tree, key.split("."), keys[key]));
  return tree;
}
