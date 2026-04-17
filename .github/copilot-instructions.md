# VanillaApp2026 Copilot Instructions

## Project Overview

VanillaApp2026 is a lightweight declarative micro-framework built with vanilla TypeScript.
Core principles:
- Proxy-based reactive state.
- Surgical DOM updates through data bindings.
- PubSub-based decoupled communication.
- Declarative HTML directives.
- No external UI frameworks.

See [CODEBASE_DOCUMENTATION.md](../CODEBASE_DOCUMENTATION.md) for deeper architecture details.

---

## Quick Setup

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # TypeScript + production build
npm run preview  # Preview production build
```

Environment notes:
- Build tool: Vite 7.3.1
- TypeScript: strict mode
- Alias: `@/*` -> `src/*`
- CSS: Tailwind CSS 4.x + PostCSS

---

## Non-Negotiable Rules

1. Always use `buildAndInterpolate()` for template rendering.
2. Do not write arbitrary JS inside `{...}` interpolation. Use property paths + pipes.
3. Use `@if(...)` for conditional blocks in templates.
4. Prefer `setState({...})` for grouped updates.
5. Clean up all listeners/timers in `destroy()` via `this.addCleanup(...)`.
6. Prefer `$(selector, this.element)` over raw query selectors.
7. Use `@/` imports for files under `src/`.
8. If you use a Lucide icon name in templates (`data-icon="..."`), ensure it is registered in `src/app.icons.ts`; if missing, add it before using the icon.

---

## Component Pattern

All components must extend `BaseComponent` and follow this lifecycle:
- `init(ctx: ComponentInitValue)`
- `render(changedProp?: string)`
- `mounted()`
- `destroy()`

Recommended render pattern:

```typescript
render(changedProp?: string): HTMLElement {
  if (changedProp && this.element) {
    this.updateBindings();
    return this.element;
  }

  const template = `...`;
  return buildAndInterpolate(template, this);
}
```

Why:
- Initial render builds DOM.
- Subsequent updates re-bind only changed parts.
- Keeps component element reference stable.

---

## Data-Binding (Surgical Updates)

Directive format:
- `data-bind="type.prop:path"`
- `prop` is optional depending on resolver.

Main resolvers:
- `text:path`
- `html:path`
- `value:path`
- `checked:path`
- `attr.src:path`
- `class:path`
- `toggle.active:path`
- `style.color:path`
- `show:path`
- `hide:path`
- `disabled:path`
- `fn:methodName`

Use this mechanism to avoid full re-renders.

---

## Templates, Directives, and Interpolation

Use template features in this style:
- Interpolation: `{user.name}`
- Pipes: `{name | upper}`
- Loops: `<div data-each="item in items"></div>`
- Conditionals: `@if(condition) ... @endif`
- Events: `on-click="methodName"`
- PubSub events: `on-click="publish:EVENT:scope"`
- Routing: `route-to="/path"`

Important:
- `interpolate()` does not evaluate arbitrary JS expressions in braces.
- Condition expressions are allowed in `@if(...)`.

### Component Output Handlers (Child -> Parent)

You can bind handlers in the host markup using output syntax:

```html
<div
  data-component="app-tab-component"
  (tabchange)="handleTabChange"
  (tabclose)="handleTabClose"
></div>
```

How it works:
- Output attributes are detected from the host element: `(event-name)="handlerName"`.
- Event name is converted from kebab-case to camelCase before assignment.
  - Example: `(tab-change)` -> `tabChange`.
- If `handlerName` exists in parent context and is a function, it is bound to parent context and assigned in the child instance.
- Cleanup removes the bound callback automatically on `destroy()`.

In child components, expose/invoke outputs as optional callbacks:

```typescript
public tabChange?: (detail: TabEventDetail) => void;

private raiseTabChange(detail: TabEventDetail) {
  this.tabChange?.(detail);
}
```

Use outputs for child-origin UI events (selection, close, toggle, custom notifications) when parent orchestration is needed.

---

## Global Pipes

Important:
- Pipes are resolved in `getValue()` (`src/core/template.ts`), not only in interpolation.
- They can be used declaratively in templates and imperatively in TS.

Declarative example:

```html
<div>{value | pipeName : arg1 : arg2}</div>
```

Imperative example:

```typescript
import { getValue } from "@/core/template";

const output = getValue("user.name | upper", this);
```

Current pipes:
- `if`
- `show`
- `hide`
- `iif`
- `toString`
- `toJSON`
- `toNumber`
- `equal`
- `join`
- `upper`
- `lower`
- `undefined`
- `not`
- `includes`
- `length`
- `default`
- `replace`
- `truncate`
- `t`
- `debug`
- `safeHTML`

Pipe usage notes:
- Pipes can be chained: `{description | upper | t}`
- Use `@` for scoped args: `{isActive | if : @primaryColor}`
- To include `:` inside args, wrap in single quotes:
  - `{value | replace : 'https://': 'http://'}`

---

## DOM Querying Standard

Always prefer `$()` helper from `@/core/dom`:

```typescript
import { $ } from "@/core/dom";

const btn = $("[data-submit]", this.element).one();
const items = $("[data-item]", this.element).all();
const hasHeader = $("[data-header]", this.element).exists();
```

Avoid in components:
- `document.querySelector(...)`
- Unscoped DOM reads that leak outside the component root.

---

## Naming and Registration

Conventions:
- Components: `name.component.ts` -> `<app-name>`
- Pages: `name.page.ts`
- Services: singleton style under `src/core/services/`

Registration:
- Core registry in `src/app.components.ts`
- Components can also be auto-discovered via registry scanning.

---

## Routing and Messaging

Routing:
- Define routes in `src/app.routes.ts`
- Navigate with `route-to="/path"` or router APIs
- Use `keepAlive: true` when page state preservation is required

PubSub:
- Global: `publish:EVENT:global`
- Local (parent scope): `publish:EVENT:local`
- Listen via `this.pubsub.subscribe("EVENT", handler)`

---

## Common Mistakes to Avoid

1. Mutating DOM directly instead of using state + bindings.
2. Forgetting cleanup in `destroy()`.
3. Using arbitrary JS inside interpolation braces.
4. Calling unscoped global selectors inside components.
5. Mixing import styles instead of `@/` alias.
6. Calling `setState` after component destruction.

---

## Project Structure (Quick Map)

```text
src/
  main.ts
  app.components.ts
  app.routes.ts
  app.config.ts
  app.messages.ts
  components/
  core/
    dom.ts
    template.ts
    template-compiler.ts
    types.ts
    floating-portal.ts
    services/
  pages/
  services/
  i18n/
  reports/
```

---

## References

- [CODEBASE_DOCUMENTATION.md](../CODEBASE_DOCUMENTATION.md)
- [README.md](../README.md)
- `src/core/types.ts`
- `src/core/dom.ts`
- `src/core/template.ts`
