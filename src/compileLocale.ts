import { Node, Tree, isLeaf } from "./parseLocaleFile";

const re = /\$\{(\w+)\}/g;

const _indent = "  ";

function compileValue(str: string, ts: boolean): string {
  const variables = [] as string[];
  const rhs = str.replace(re, (_, name) => {
    variables.push(name);
    return "${i." + name + "}";
  });
  if (variables.length > 0) {
    const t = ts ? `: {${variables.map(n => `${n}: string`).join(", ")}}` : "";
    return `(i${t}) => \`${rhs}\``;
  } else {
    return JSON.stringify(rhs);
  }
}

function compileField(
  node: Node,
  name: string,
  ts: boolean,
  indent: string
): string {
  return `${indent}${name}: ${compileNode(node, ts, indent)}`;
}

function compileTree(tree: Tree, ts: boolean, indent: string): string {
  return `{\n${Object.keys(tree.children)
    .map(n => compileField(tree.children[n], n, ts, indent + _indent))
    .join(",\n")}\n${indent}}`;
}

function compileNode(node: Node, ts: boolean, indent: string): string {
  return isLeaf(node)
    ? compileValue(node.value, ts)
    : compileTree(node, ts, indent);
}

export default function compileLocale(locale: Tree, ts: boolean): string {
  return `export default ${compileTree(locale, ts, "")}\n`;
}
