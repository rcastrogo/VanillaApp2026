# 🚀 VanillaReactive v2026

Un **Micro-Framework declarativo** y ultraligero construido con Vanilla JavaScript y TypeScript. Diseñado para ofrecer reactividad de alto rendimiento, comunicación desacoplada mediante PubSub y un sistema de bindings directamente en el HTML sin necesidad de librerías externas.

## ✨ Características Principales

- **⚡ Reactividad basada en Proxies:** Estado del componente sincronizado automáticamente con la UI.
- **🔗 PubSub Engine:** Sistema de mensajería global y local para comunicación entre componentes sin "prop-drilling".
- **🛠 Declarative Directives:** Atributos personalizados como `on-click="publish:..."` y `on-publish="..."` para manejar eventos y datos sin escribir JS adicional.
- **🧪 Pipes & Filters:** Transformación de datos en tiempo real dentro de los templates (`{ data | uppercase | translate }`).
- **🎨 CSS-First:** Optimizado para trabajar con Tailwind CSS mediante bindings dinámicos de clases y estilos.

---

## 🛠 Arquitectura del Motor

El framework permite que el HTML sea "inteligente" mediante dos pilares fundamentales:

### 1. El Sistema de Publicación (Eventos)
Permite disparar acciones globales o locales con paso de parámetros y contexto del evento original (`event`, `target`, `args`).

```html
<button on-click="publish:THEME_CHANGED:global:dark">
  Modo Oscuro
</button>


# DOM + Hydrate + Template engine (VanillaApp2026)

Este documento resume **qué se puede hacer** con:

- `src/core/dom.ts` (build / buildAndInterpolate)
- `src/core/hydrate.ts` (hydrateIcons / hydrateEventListeners / hydrateComponents / hydrateDirectives)
- `src/core/template.ts` (interpolate / getValue / pipes (filtros) / @if preProcessTemplate)
- `src/core/template-compiler.ts` (DSL: @if/@else/@each + interpolación)

---

## 1) `build()` y `buildAndInterpolate()` (src/core/dom.ts)

### build(tagName, options, returnFirstChild, ctx)

`build()` crea un elemento y, si le pasas `ctx`, ejecuta **hidratación** sobre el HTML resultante en este orden:

1. `hydrateDirectives(el, ctx)`  
   - Traducciones (`data-t`)
   - Repetidores (`data-each`)
2. `hydrateIcons(el)` (reemplaza `[data-icon]` por SVG)
3. `hydrateComponents(el, ctx)` (reemplaza `[data-component]` por el componente real)
4. `hydrateEventListeners(el, ctx)` (convierte atributos `on-*`, `route-to`, `on-publish` en listeners reales)

> Nota: en `dom.ts` el comentario dice “primero directivas… luego iconos… luego componentes… luego listeners”.

#### Ejemplo (sin interpolate)
```ts
import { build } from "@/core/dom";

const el = build("div", {
  className: "p-4 bg-slate-100 rounded",
  innerHTML: `<button class="btn">OK</button>`
}, true);
```

### buildAndInterpolate(template, ctx, returnFirstChild, options)

- Llama a `interpolate(template, ctx)` (de `template.ts`)
- Luego hace `build('div', { innerHTML: html }, returnFirstChild, ctx)`

Es decir: **interpolas** y luego **hidratas**.

#### Ejemplo típico en un componente (patrón LogoComponent)
```ts
import { buildAndInterpolate } from "@/core/dom";
import { BaseComponent } from "@/core/types";

export class HelloComponent extends BaseComponent {
  render() {
    const template = `
      <div class="p-4 rounded border">
        <h2 class="font-bold">Hola {user.name|upper}</h2>
      </div>
    `;
    return buildAndInterpolate(template, this);
  }
}
```

---

## 2) `interpolate()` y `getValue()` (src/core/template.ts)

### interpolate(template, context)

- Antes de reemplazar `{...}`, ejecuta `preProcessTemplate(template, context)` para soportar `@if(...) ... @endif`.
- Luego reemplaza cada `{expr}` haciendo `getValue(expr.trim(), context)`.
- Si el valor resultante es una **función**, la ejecuta con `result.apply(context)`.
- Si el resultado es `undefined` o `null`, **no sustituye** y deja el `{expr}` original (esto es importante para depurar).

**Ejemplo:**
```html
<div>
  Hola {user.name}
  <span>{user.age}</span>
</div>
```

### getValue(key, scope)

`getValue()` es el corazón del sistema: resuelve rutas tipo `"user.name"`, soporta:
- **pipes** con `|`
- **traducciones** con `t:key` y con literales `'key'`
- **interpolación interna en el path** con `{...}` dentro de la expresión
- **fallback de scope** usando `'#'` (padre) para contextos anidados (muy usado en `data-each`)
- acceso a `self` (global del navegador) si no existe en el scope

#### 2.1) Acceso a propiedades (paths)
```txt
{user.name}
{user.profile.email}
{items[0].title}   // se tokeniza por . y por corchetes
```

#### 2.2) “Interpolación interna” en el path
Esto existe en el código:

```ts
const resolvedKey = (path || '').replace(/{([^{}]+)}/g, (_, innerKey) => {
  return getValue(innerKey.trim(), scope);
});
```

O sea, puedes hacer:
```txt
{language.{lang}}
```

Si `lang = "es"`, entonces se convierte en:
```txt
language.es
```

#### 2.3) Pipes / filtros (`|`)
La expresión se parte por `|`:

```ts
const parts = key.split('|').map(p => p.trim());
const path = parts.shift() || '';
const filters = parts;
```

Ejemplos:
```txt
{user.name|upper}
{user.name|lower}
{user.nickname|undefined}
```

##### Filtros globales disponibles (GLOBAL_FUNCTIONS)
En `template.ts` vienen, entre otros:

- `if(cond, cls)` -> devuelve `cls` si cond true, si no `''`
- `show(cond)` -> devuelve `''` o `'display: none'`
- `hide(cond)` -> devuelve `'display: none'` o `''`
- `iif(cond, t, f)` -> if inline (maneja `'false'` y `'0'`)
- `upper(val)`, `lower(val)`
- `undefined(val)` -> “valor no definido” si falsy
- `t(key, ...extras)` -> traducción con `APP_CONFIG.i18n.t`
- `debug(val)` -> hace console.log del valor y scope

**Ejemplo de clase condicional:**
```html
<div class="p-2 {isActive|if:'bg-green-200'}">
  ...
</div>
```

**Ejemplo de estilo condicional (ojo: show/hide devuelven CSS inline):**
```html
<div style="{isLoading|show}">
  Cargando...
</div>
```

#### 2.4) Pipes con argumentos (`filter:arg1:arg2`)
Los filtros se parsean así:
```ts
const [filterName, ...args] = filterExpr.split(':').map(s => s.trim());
```

Y los args soportan `@` para resolver desde el scope:
```ts
arg.startsWith('@') ? getValue(arg.slice(1), scope) : arg
```

**Ejemplo conceptual:**
```txt
{user.name|someFilter:@anotherValue}
```

> Ojo: para que funcione, `someFilter` debe existir como función en el scope o en GLOBAL_FUNCTIONS.

---

## 3) Control de flujo con `@if` en `template.ts` (preProcessTemplate)

`preProcessTemplate()` busca tokens `@if(` ... `@endif`, permite anidar, y evalúa la condición con:

```ts
evaluateExpression(expression, context)
```

que hace `with(ctx) { return <expression>; }`

### Comportamiento MUY relevante: variables no definidas
Si dentro del `@if` se referencia algo que **no existe**, `evaluateExpression` devuelve `"__UNDEFINED__"` y entonces **NO elimina el bloque**: lo deja intacto.

Esto está hecho a propósito:
```ts
if (result === "__UNDEFINED__") {
  out += `@if(${expression})${content}@endif`;
}
```

Así, durante desarrollo, puedes ver el bloque y darte cuenta de que falta una variable.

### Ejemplo de `@if`
```html
<div class="p-4 border rounded">
  @if(isAdmin)
    <span class="text-red-600 font-bold">Admin</span>
  @endif

  <span>Hola {user.name}</span>
</div>
```

---

## 4) DSL “compilado” (src/core/template-compiler.ts)

Este fichero implementa un **DSL alternativo** con AST + generación de código, con soporte:

- `{expr}` interpolación (usa `getValue(expr, scope)`)
- `@if(condition) ... @else ... @endif`
- `@each(item in list) ... @endeach`

**Cómo evalúa las condiciones/listas:**
- usa `evalInScope(scope, expr)` que ejecuta una Function con las keys del scope:
  ```ts
  Function(...Object.keys(scope), `return (${expr})`)(...Object.values(scope))
  ```

### Ejemplo DSL con each + if
```html
<div class="p-4">
  <h2 class="font-bold">Usuarios</h2>

  @each(u in users)
    <div class="py-2 border-b">
      <div class="font-medium">{u.name|upper}</div>
      @if(u.active)
        <span class="text-green-600 text-sm">Activo</span>
      @else
        <span class="text-slate-400 text-sm">Inactivo</span>
      @endif
    </div>
  @endeach
</div>
```

> El DSL se ejecuta con `executeDSL(template, ctx)` y luego se puede “buildar” con `buildAndInterpolateDSL`.

---

## 5) Hidratación (src/core/hydrate.ts)

### 5.1) hydrateIcons(root)
Busca:
```css
[data-icon]
```
y reemplaza el placeholder por el SVG real usando `createIcon(name, customClasses)`.

**Ejemplo:**
```html
<i data-icon="zap" class="size-5 text-indigo-600"></i>
```

### 5.2) hydrateEventListeners(container, ctx)

Recorre el DOM con `TreeWalker` y procesa atributos especiales.

#### A) `on-publish="topic:scope:action:...extraArgs"`
Esto es una suscripción reactiva a PubSub:
- `scope === "local"` => suscripción ligada a `ctx.instanceId`
- `action` controla qué hace con el payload

Acciones soportadas:
- `classname` -> `el.className = data`
- `html` / `innerhtml` -> `el.innerHTML = data`
- `json` -> `el.innerHTML = JSON.stringify(getValue(data, ctx), null, 2)`
- `style:<prop>` -> `(el.style as any)[prop] = data`
- `toggleclass:<class>` -> `el.classList.toggle(class)`
- `attr.<name>` -> `el.setAttribute(name, data)`
- si `action` es un método del ctx: `ctx[action].call(ctx, el, payload, ...extraArgs)`
- default: `el.innerHTML = getValue(data, ctx)`

Además:
- elimina el atributo `on-publish`
- si `ctx.component` existe, registra cleanup:
  ```ts
  ctx.component.addCleanup(unsubscribe)
  ```

**Ejemplo:**
```html
<div class="p-2 border" on-publish="user-updated:global:json:@user">
  (se rellenará con JSON)
</div>
```

> Nota: si publicas un objeto interno `{ event, target, args }`, el “data” se toma como `payload.args[0]`.

#### B) `route-to="/ruta"` o `route-to="@some.path"`
Crea un listener click que navega con el router:
- Si empieza por `@`, resuelve con `getValue(attrValue.slice(1), ctx)`
- Si no, usa literal

**Ejemplo:**
```html
<a class="text-indigo-600 underline" route-to="/home">Ir a Home</a>
<a class="text-indigo-600 underline" route-to="@routes.profile">Profile</a>
```

#### C) `on-click`, `on-change`, `on-input`, etc.
Dos modos:

**Modo publish**
Si el valor empieza por `publish`:
```txt
on-click="publish:topic:scope:arg1:arg2"
```

- calcula args con `resolveArgs(extraArgs, ctx)`
- publica:
  ```ts
  pubSub.publish(topic, { event, target: el, args: params }, publisherId)
  ```

**Ejemplo:**
```html
<button
  class="px-3 py-2 rounded bg-indigo-600 text-white"
  on-click="publish:counter-inc:local:1"
>
  +1
</button>
```

**Modo handler**
Si no empieza por publish, interpreta:
```txt
on-click="handlerName:arg1:arg2"
```
- busca handler en `ctx[handlerName]` o `ctx.handlers?.[handlerName]`
- resuelve args con `resolveArgs(eventArgs, ctx)`
- ejecuta `handler.call(ctx, el, event, ...args)`

**Ejemplo:**
```html
<input
  class="border p-2"
  on-input="onSearchChanged:@searchKey"
/>
```

### 5.3) hydrateComponents(root, ctx)

Busca placeholders:
```css
[data-component]
```

Flujo:
1. `const provider = getComponent(componentName)`
2. `const component = await loader.resolve(provider, ctx)`
3. `component.init?.({ parent: el })`  
   - Importante: esto hace que `BaseComponent` lea `dataset` del parent => props
4. `const element = component.render()`
5. `BaseComponent.bind(component, element)`
6. Copia clases del placeholder al componente real (si había)
7. `el.replaceWith(element)`
8. `component.mounted?.()`

**Ejemplo placeholder:**
```html
<div data-component="language-selector" class="w-full"></div>
```

### 5.4) hydrateDirectives(container, ctx)

Soporta dos directivas:

#### A) Traducciones: `[data-t]`
- toma `data-t="t:some.key"` o `data-t="some.key"`
- normaliza a `cleanKey`
- `el.textContent = APP_CONFIG.i18n.t(cleanKey, ctx)`
- set `data-i18n-key`

**Ejemplo:**
```html
<span data-t="home.title"></span>
<span data-t="t:home.subtitle"></span>
```

#### B) Repetición: `[data-each]`
- **solo procesa los loops de primer nivel** (evita anidar accidentalmente):
  ```ts
  .filter(el => !el.parentElement?.closest('[data-each]'))
  ```
- Sintaxis: `"item in tasks"`
- Resuelve lista con `getValue(listName, ctx) || []`
- Hace un “truco”:
  - reemplaza `~` por `|` en el HTML del repeater:
    ```ts
    const templateHTML = repeater.innerHTML.replaceAll('~', '|');
    ```
  - esto permite escribir “pipes” en HTML sin chocar con el parser o con ciertos editores (depende del uso).

- Si la lista está vacía, deja un `Comment` “anchor”:
  ```ts
  document.createComment(`anchor:each-${listName}`)
  ```

- Por cada item:
  - crea `itemCtx = Object.create(ctx)`
  - asigna:
    - `itemCtx[itemName] = item`
    - `itemCtx.index = index`
    - `itemCtx['#'] = ctx`  (para fallback al scope padre en `getValue`)
  - `const instance = buildAndInterpolate(templateHTML, itemCtx, false)`
  - vuelve a llamar `hydrateDirectives(instance, itemCtx)` recursivamente
  - mueve los children al fragment final

**Ejemplo data-each (con ~ como pipe)**
```html
<ul class="space-y-2" data-each="u in users">
  <li class="p-2 border rounded">
    <div class="font-bold">{u.name~upper}</div>
    <div class="text-sm text-slate-500">Index: {index}</div>
    <div class="text-xs text-slate-400">App: {#.appName}</div>
  </li>
</ul>
```

Notas:
- `{#.appName}` funciona porque `getValue()` si no encuentra `propName` en el target, pero existe `target['#']`, intenta resolver en el padre.
- Para pipes dentro de `data-each`, se sugiere usar `~` en el markup, porque `hydrateDirectives` lo convierte a `|`.

---

## 6) `$()` helper y `getQueryParams()` (src/core/dom.ts)

### $(selector, context).one/all/exists
Es un wrapper simple para querySelector/querySelectorAll.

```ts
import { $ } from "@/core/dom";

const btn = $<HTMLButtonElement>("#save").one();
const items = $<HTMLElement>(".item").all();
const hasModal = $("#modal").exists();
```

### getQueryParams()
Devuelve un `Record<string,string>` con los query params actuales.

---

## 7) Mini-cheatsheet de “qué puedo hacer”

### Interpolación básica
```html
<div>{title}</div>
```

### Pipes
```html
<div>{title|upper}</div>
<div>{maybeEmpty|undefined}</div>
```

### Traducciones
**Vía expresión:**
```html
<div>{t:home.title}</div>
<div>{'home.title'}</div> <!-- literal '...' también entra por traducción -->
```

**Vía directiva:**
```html
<span data-t="home.title"></span>
```

### Condicional en template.ts (`@if ... @endif`)
```html
@if(isLogged)
  <span>Bienvenido {user.name}</span>
@endif
```

### Listas (directiva)
```html
<div data-each="c in characters">
  <div>{c.name}</div>
</div>
```

### Eventos
```html
<button on-click="publish:toast:global:'Hola'">Toast</button>
<button on-click="onSave:@userId">Guardar</button>
```

### Suscripción reactiva a PubSub
```html
<pre class="text-xs" on-publish="user-updated:local:json:@user"></pre>
```

### Montar componentes por placeholder
```html
<div data-component="my-component" class="mt-4"></div>
```

---

## 8) Observaciones / “gotchas” útiles

1) **Orden de hidratación** en `build()` importa:  
   - `data-each` y traducciones ocurren antes de hidratar componentes y eventos.

2) `interpolate()` deja `{expr}` sin sustituir si no existe -> muy útil para detectar bindings rotos.

3) En `data-each`, se recomienda `~` en vez de `|` para pipes (porque el código lo traduce a `|`).

4) `on-publish` soporta acciones “rápidas” y también delegar a métodos del ctx.

5) En `route-to`, si quieres resolver una ruta dinámica: usa `@algo`.

---

## Referencias de código (archivos clave)

- `src/core/dom.ts` -> `build`, `buildAndInterpolate`, `$`, `getQueryParams`
- `src/core/hydrate.ts` -> `hydrateIcons`, `hydrateEventListeners`, `hydrateComponents`, `hydrateDirectives`
- `src/core/template.ts` -> `interpolate`, `getValue`, pipes, traducciones, `@if`
- `src/core/template-compiler.ts` -> DSL compilado (`@each`, `@if/@else`)