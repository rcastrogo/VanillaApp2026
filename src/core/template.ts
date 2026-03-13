
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
    const fn = getValue(filterName, scope);
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
  return template.replace(/{([^{}]+)}/g, (match, expression: string) => {
    const result = getValue(expression.trim(), context);
    if (typeof result === 'function') return result.apply(context);
    return result !== undefined && result !== null ? String(result) : match;
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