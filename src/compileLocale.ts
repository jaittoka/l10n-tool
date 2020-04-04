import { Node, Tree, Leaf, isLeaf } from "./parseLocaleFile";

const re = /\$\{(\w+)\}/g;

const _indent = "  ";

function compileValue(leaf: Leaf, ctx: CompileOpts): string {
  const variables = [] as string[];
  const rhs = leaf.value.replace(re, (_, name) => {
    variables.push(name);
    return "${i." + name + "}";
  });
  const comment = ctx.comments ? ` /* ${leaf.filePath} */` : "";  
  if (variables.length > 0) {
    const t = ctx.ts
      ? `: {${variables.map(n => `${n}: string`).join(", ")}}`
      : "";
    return `(i${t}) => \`${rhs}\`${comment}`;
  } else {
    return `${JSON.stringify(rhs)}${comment}`
  }
}

function compileField(
  node: Node,
  name: string,
  ctx: CompileOpts,
  indent: string
): string {
  return `${indent}${name}: ${compileNode(node, ctx, indent)}`;
}

function compileTree(tree: Tree, ctx: CompileOpts, indent: string): string {
  return `{\n${Object.keys(tree.children)
    .map(n => compileField(tree.children[n], n, ctx, indent + _indent))
    .join(",\n")}\n${indent}}`;
}

function compileNode(node: Node, ctx: CompileOpts, indent: string): string {
  return isLeaf(node)
    ? compileValue(node, ctx)
    : compileTree(node, ctx, indent);
}

export interface CompileOpts {
  ts: boolean;
  comments: boolean;
}

export default function compileLocale(locale: Tree, ctx: CompileOpts): string {
  return `export default ${compileTree(locale, ctx, "")}\n`;
}
