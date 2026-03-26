/* eslint-disable @typescript-eslint/no-explicit-any */
import { build } from "./dom";
import { getValue } from "./template";

type Node =
  | { type: "text"; content: string }
  | { type: "interp"; expr: string }
  | { type: "if"; condition: string; then: Node[]; else?: Node[] }
  | { type: "each"; item: string; list: string; body: Node[] };

type GetValueFn = (key: string | undefined, scope: any) => any;
type EvaluateExpFn = (scope: any, expr: string) => any;

let loopCounter = 0;
const cache = new Map<string, (ctx: any, getValue: GetValueFn, evaluateExp: EvaluateExpFn) => string>();

function parseDSL(template: string): Node[] {
  let i = 0;
  const root: Node[] = [];
  const stack: any[] = [{ children: root }];

  function current() {
    return stack[stack.length - 1];
  }

  while (i < template.length) {
    // INTERPOLATION { ... }
    if (template[i] === "{") {
      const end = template.indexOf("}", i);
      const expr = template.slice(i + 1, end).trim();
      current().children.push({ type: "interp", expr });
      i = end + 1;
      continue;
    }
    // DIRECTIVES
    if (template[i] === "@") {
      // @if
      if (template.startsWith("@if(", i)) {
        const end = template.indexOf(")", i);
        const condition = template.slice(i + 4, end);
        const node = { type: "if", condition, then: [] as Node[] };
        current().children.push(node);

        stack.push({ type: "if", node, children: node.then });
        i = end + 1;
        continue;
      }
      // @else
      if (template.startsWith("@else", i)) {
        const ctx = stack[stack.length - 1];
        if (ctx.type === "if") {
          ctx.node.else = [];
          ctx.children = ctx.node.else;
        }
        i += 5;
        continue;
      }
      // @endif
      if (template.startsWith("@endif", i)) {
        stack.pop();
        i += 6;
        continue;
      }
      // @each
      if (template.startsWith("@each(", i)) {
        const end = template.indexOf(")", i);
        const exp = template.slice(i + 6, end);
        const [item, list] = exp.split(" in ").map(s => s.trim());

        const node = { type: "each", item, list, body: [] as Node[] };
        current().children.push(node);

        stack.push({ type: "each", node, children: node.body });
        i = end + 1;
        continue;
      }
      // @endeach
      if (template.startsWith("@endeach", i)) {
        stack.pop();
        i += 8;
        continue;
      }
    }
    // TEXT
    let nextSpecial = template.slice(i).search(/[@{]/);
    if (nextSpecial === -1) nextSpecial = template.length - i;

    const text = template.slice(i, i + nextSpecial);
    current().children.push({ type: "text", content: text });

    i += nextSpecial;
  }

  return root;
}

function generateCode(nodes: Node[]): string {
  let code = "";

  for (const node of nodes) {
    switch (node.type) {
      case "text":
        code += `html += \`${escape(node.content)}\`;\n`;
        break;
      case "interp":
        code += `html += (getValue(${JSON.stringify(node.expr)}, scope) ?? "");\n`;
        break;
      case "if":
        // code += `if (getValue(${JSON.stringify(node.condition)}, scope)) {\n`;
        code += `if (evalInScope(scope, ${JSON.stringify(node.condition)})) {\n`;
        code += generateCode(node.then);
        code += `}\n`;

        if (node.else) {
          code += `else {\n`;
          code += generateCode(node.else);
          code += `}\n`;
        }
        break;

      case "each":
      {
        const loopVar = `__item${loopCounter++}`;
        code += `
        const __list = evalInScope(scope, ${JSON.stringify(node.list)}) || [];
        for (const ${loopVar} of __list) {
          const prevScope = scope;
          scope = Object.create(scope);
          scope[${JSON.stringify(node.item)}] = ${loopVar};
        `;
        code += generateCode(node.body);
        code += `
          scope = prevScope;
        }
        `;
      }
      break;
    }
  }
  // console.log(code);
  return code;
}

function evalInScope(scope: any, expr: string) {
  // console.log(scope);
  try {
    return Function(...Object.keys(scope), `return (${expr})`)(...Object.values(scope));
  } catch (e) {
    console.warn("DSL eval error:", expr, e);
    return false;
  }
}

function escape(str: string) {
  return str.replace(/`/g, "\\`");
}

function compile(template: string): (ctx: any, getValue: any, evalInScope: any) => string {
  if (cache.has(template)) return cache.get(template)!;
  const ast = parseDSL(template);
  const body = generateCode(ast);
  const fn = new Function(
    "ctx",
    "getValue",
    "evalInScope",
    `
    let html = "";
    let scope = ctx;
    ${body}
    return html;
    `
  ) as (ctx: any, getValue: any) => string;

  cache.set(template, fn);

  return fn;
}

export function executeDSL(template: string, ctx: any): string {
  const renderFn = compile(template);
  return renderFn(ctx, getValue, evalInScope);
}

export function buildAndInterpolateDSL(template: string, ctx: any) {
  return build("div", executeDSL(template, ctx), true, ctx);
}