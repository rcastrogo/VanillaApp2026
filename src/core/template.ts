


// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GLOBAL_FUNCTIONS: Record<string, (...args: any[]) => any> = {
  if: (cond:boolean, cls: string) => (cond === undefined ? undefined : cond ? cls : ''),
  show: (cond:boolean) => (cond === undefined ? undefined : cond ? '' : 'display: none'),
  hide: (cond:boolean) => (cond === undefined ? undefined : cond ? 'display: none' : ''),
  iif: (cond:boolean, t: string, f:string) => (cond === undefined ? undefined : cond ? t : f),
  upper: (val:string) => val?.toUpperCase(),
  lower: (val:string) => val?.toLowerCase(),
  undefined: (val:string) => val ? val : 'valor no definido'
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getValue(key: string | undefined, scope: any): any {
  if (!key || key === 'this') return scope;
  const parts = key.split('|').map(p => p.trim());
  const path = parts.shift();
  const filters = parts;
  const tokens = (path || '').split(/\.|\[|\]/).filter(t => t !== '');
  let target = scope || self;
  for (const propName of tokens) {
    if (target !== null && typeof target === 'object' && propName in target) {
      target = target[propName];
    } else if (target && target['#']) {
      target = getValue(propName, target['#']);
    } else if (propName in self) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      target = (self as any)[propName];
    } else {
      target = undefined;
      break;
    }
  }
  return filters.reduce((value, filterExpr) => {
    const [filterName, ...args] = filterExpr.split(':').map(s => s.trim());
    const fn = getValue(filterName, scope) || GLOBAL_FUNCTIONS[filterName];
    if (typeof fn === 'function') {
      const parsedArgs = args.map(arg =>
        arg.startsWith('@') ? getValue(arg.slice(1), scope) : arg
      );
      return fn(value, ...parsedArgs);
    }
    console.warn(`Filtro "${filterName}" no encontrado.`);
    return value;
  }, target);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function interpolate(template: string, context: any): string {
  const html = preProcessTemplate(template, context);
  return html.replace(/{([^{}]+)}/g, (match, expression: string) => {
    try{
      const result = getValue(expression.trim(), context);
      if (typeof result === 'function') return result.apply(context);
      return result !== undefined && result !== null ? String(result) : match;
    } catch(e) {
      console.log(String(e), match);
      return match;
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveArgs(args: string[], context: any): any[] {
  return args.map(arg => {
    if (arg.startsWith('$')) {
      const statePath = arg.slice(1);
      return context.state ? getValue(statePath, context.state) : undefined;
    }
    if (arg.startsWith('@')) return getValue(arg.slice(1), context);
    const lower = arg.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
    if (lower === 'null') return null;
    if (lower === 'undefined') return undefined;
    const num = Number(arg);
    return (arg.trim() !== '' && !isNaN(num)) ? num : arg;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function evaluateExpression(expression: string, context: any): any {
  try {
    const fn = new Function('ctx', `
      with(ctx) {
        try {
          return ${expression};
        } catch(e) {
          // Si el error es porque la variable no existe, devolvemos un token especial
          if (e instanceof ReferenceError) return "__UNDEFINED__";
          return false;
        }
      }
    `);
    return fn(context);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function preProcessTemplate(template: string, context: any): string {
  if (!template.includes('@if')) return template;
  let i = 0;
  let out = "";

  while (i < template.length) {
    if (template.startsWith("@if(", i)) {
      const openParen = i + 3;
      const closeParen = findClosingBracket(template, openParen, "(", ")");
      
      if (closeParen === -1) { 
        out += template[i]; i++; continue; 
      }

      const expression = template.slice(openParen + 1, closeParen);
      
      // El bloque de contenido empieza justo después del cierre del paréntesis ')'
      const contentStart = closeParen + 1;
      const blockEnd = findClosingBlade(template, contentStart);

      if (blockEnd === -1) {
        out += template[i]; i++; continue;
      }

      const content = template.slice(contentStart, blockEnd);
      const result = evaluateExpression(decodeHTMLEntities(expression), context);

      if (result === "__UNDEFINED__") {
        // IMPORTANTE: Si no está definido, mantenemos el bloque EXACTO
        out += `@if(${expression})${content}@endif`;
      } else if (result) {
        // Si es true, procesamos el contenido (recursivo) y lo añadimos
        out += preProcessTemplate(content, context);
      }

      // El nuevo índice debe ser justo después de "@endif"
      i = blockEnd + 6; // "@endif" tiene exactamente 6 caracteres
    } 
    else {
      out += template[i];
      i++;
    }
  }
  return out;
}

function findClosingBlade(str: string, start: number): number {
  let stack = 1;
  let i = start;
  while (i < str.length) {
    if (str.startsWith("@if(", i)) {
      stack++;
      // Saltamos el @if para no volver a contarlo
      i += 3; 
    } else if (str.startsWith("@endif", i)) {
      stack--;
      if (stack === 0) return i;
      i += 5; 
    }
    i++;
  }
  return -1;
}

function findClosingBracket(str: string, start: number, open: string, close: string): number {
  let count = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === open) count++;
    else if (str[i] === close) count--;
    if (count === 0) return i;
  }
  return -1;
}

export function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  return text.replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (match) => entities[match]);
}