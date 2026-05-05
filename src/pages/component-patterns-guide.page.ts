import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';


const SNIPPETS: Record<string, string> = {

  lifecycle: `import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';

export class MyComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
    // El estado ya es un Proxy reactivo (this.state = new Proxy({}))
    // Se auto-bindan todos los metodos de la clase
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    // ctx.parent: HTMLElement host (donde esta data-component="app-my")
    // this.props: Record<string,string> (todos los data-* del host)
    // this.children: Node[] (nodos hijos originales del host)
    this.setState({ count: 0, loading: false });
    this.addCleanup(
      APP_CONFIG.i18n.changed(() => this.invalidate())
    );
  }

  render(changedProp?: string): HTMLElement | null {
    // changedProp: nombre de la propiedad del state que cambio (o undefined)
    const template = '<div>{state.count}</div>';
    return buildAndInterpolate(template, this);
  }

  mounted(): void {
    // Llamado tras insertar element en el DOM (y en cada re-render)
    console.log('Componente visible');
  }

  destroy(): void {
    // No hace falta llamar a super.destroy() — se ejecuta automaticamente
    // Todo lo registrado con addCleanup() se limpia aqui
  }
}`,

  functional: `import type { ComponentFactory } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';

const DemoPage: ComponentFactory = () => {
  const context = {
    title: 'Mi Pagina',
    items: ['Alpha', 'Bravo', 'Charlie'],
    element: null as HTMLElement | null,
    bindings: null as any,

    handleClick(_el: HTMLElement, _ev: Event) {
      notificationService.show('Clicked!');
    },

    render() {
      const template = \`
        <div class="p-4">
          <h1 class="text-2xl font-bold">{title | upper}</h1>
          <ul data-each="item in items">
            <li>{item}</li>
          </ul>
          <button on-click="handleClick" class="app-button">
            Click me
          </button>
        </div>
      \`;
      return buildAndInterpolate(template, this);
    }
  };

  return context;
};

export default DemoPage;`,

  reactiveRerender: `import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';
import { APP_CONFIG } from '@/app.config';

export class CounterWidget extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({
      count: 0,
      history: [] as string[],
      isRunning: false
    });

    // Timer con limpieza automatica
    const timerId = setInterval(() => {
      if (this.state.isRunning) this.state.count++;
    }, 1000);

    this.addCleanup([
      () => clearInterval(timerId),
      APP_CONFIG.i18n.changed(() => this.invalidate())
    ]);
  }

  toggle(): void {
    this.state.isRunning = !this.state.isRunning;
  }

  reset(): void {
    this.setState({
      count: 0,
      history: [...this.state.history, 'Reset at ' + this.state.count],
      isRunning: false
    });
  }

  render(): HTMLElement {
    // Cada cambio de state.count dispara render completo
    const template = \`
      <div class="p-4 space-y-3">
        <h2 class="text-xl font-bold">Contador: {state.count}</h2>
        <div class="flex gap-2">
          <button on-click="toggle" class="app-button btn-primary">
            @if(state.isRunning) Pausar @endif
            @if(!state.isRunning) Iniciar @endif
          </button>
          <button on-click="reset" class="app-button btn-secondary">Reset</button>
        </div>
        <ul data-each="entry in state.history">
          <li class="text-sm text-slate-500">{entry}</li>
        </ul>
      </div>
    \`;
    return buildAndInterpolate(template, this);
  }
}`,

  surgical: `import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';

export class FilterPanel extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({
      expanded: false,
      query: '',
      resultCount: 0,
      loading: false
    });
  }

  togglePanel(): void {
    this.state.expanded = !this.state.expanded;
  }

  handleSearch(el: HTMLInputElement): void {
    this.state.query = el.value;
    this.state.loading = true;
    // Simular busqueda
    setTimeout(() => {
      this.state.resultCount = Math.floor(Math.random() * 100);
      this.state.loading = false;
    }, 300);
  }

  render(changedProp?: string): HTMLElement | null {
    // Clave: si ya hay element, solo actualizar bindings
    if (changedProp && this.element) {
      this.updateBindings();
      return this.element;
    }

    const template = \`
      <div class="border rounded-xl p-4">
        <button on-click="togglePanel" class="flex items-center gap-2">
          <span data-bind="show:state.expanded">▼</span>
          <span data-bind="hide:state.expanded">▶</span>
          <span>Filtros</span>
          <span data-bind="text:state.resultCount" class="badge"></span>
        </button>

        <div data-bind="toggle.hidden:state.expanded | not" class="mt-3 space-y-2">
          <input
            type="text"
            on-input="handleSearch"
            data-bind="value:state.query"
            placeholder="Buscar..."
            class="app-input"
          />
          <div data-bind="show:state.loading">
            <span class="animate-pulse">Buscando...</span>
          </div>
          <p data-bind="hide:state.loading">
            Resultados: <span data-bind="text:state.resultCount">0</span>
          </p>
        </div>
      </div>
    \`;
    return buildAndInterpolate(template, this);
  }
}`,

  imperativeHydration: `import type { ComponentBinding, ComponentFactory } from '@/components/component.model';
import { $, buildAndInterpolate } from '@/core/dom';
import { hydrateComponents, resolveBindingValue } from '@/core/hydrate';

interface Card { id: number; title: string; polyline?: string; }

const CardsPage: ComponentFactory = () => {
  const context = {
    cards: [] as Card[],
    loading: true,
    element: null as HTMLElement | null,
    bindings: null as ComponentBinding[] | null,

    render() {
      this.loadCards();
      const template = \`
        <div class="p-4">
          <div data-bind="show:loading">Cargando...</div>
          <div data-ref="cardList" class="grid gap-4"></div>
        </div>
      \`;
      return buildAndInterpolate(template, this);
    },

    async loadCards() {
      const result = await fetch('/api/cards').then(r => r.json());
      this.cards = result;
      this.loading = false;
      this.renderCards();
      this.updateBindings();
    },

    renderCards() {
      if (!this.element) return;
      const list = $('[data-ref="cardList"]', this.element).one();
      if (!list) return;

      list.innerHTML = this.cards.map((card: Card) => \`
        <div class="p-4 border rounded-lg">
          <h3>\${escapeHtml(card.title)}</h3>
          <div
            data-component="app-polyline-viewer"
            data-polyline="\${escapeAttr(card.polyline || '')}"
            class="mt-2">
          </div>
        </div>
      \`).join('');

      // Hidrata subcomponentes declarativos
      hydrateComponents(list, this);
    },

    updateBindings() {
      if (this.bindings) {
        this.bindings.forEach((b: ComponentBinding) => resolveBindingValue(b, this));
      }
    }
  };

  return context;
};`,

  dsl: `import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolateDSL } from '@/core/template-compiler';
import { BaseComponent } from '@/core/types';
import { APP_CONFIG } from '@/app.config';

interface Project { id: number; name: string; active: boolean; tasks: Task[]; }
interface Task { desc: string; done: boolean; tags: string[]; }

export class ProjectBoard extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.addCleanup(APP_CONFIG.i18n.changed(() => this.invalidate()));
    this.setState({
      title: 'Panel de Proyectos',
      isLoading: false,
      projects: [
        {
          id: 1, name: 'Rediseno Web', active: true,
          tasks: [
            { desc: 'Header responsive', done: true, tags: ['UI', 'Urgent'] },
            { desc: 'Migrar CSS', done: false, tags: ['Core'] }
          ]
        }
      ] as Project[]
    });
  }

  render(): HTMLElement {
    const template = \`
      <div class="p-4">
        <h1 class="text-3xl font-bold">{state.title | upper}</h1>

        @if(state.isLoading)
          <p class="animate-pulse">Cargando proyectos...</p>
        @endif

        @each(project in state.projects)
          <section class="mt-4 p-4 border rounded-xl">
            <div class="flex items-center gap-2">
              <h2 class="text-xl font-semibold">{project.name}</h2>
              @if(project.active)
                <span class="badge bg-green-100 text-green-700">Activo</span>
              @else
                <span class="badge bg-slate-100 text-slate-500">Inactivo</span>
              @endif
            </div>

            @each(task in project.tasks)
              <div class="ml-4 mt-2 flex items-center gap-2">
                <input type="checkbox" @if(task.done) checked @endif />
                <span class="@if(task.done) line-through text-slate-400 @endif">
                  {task.desc}
                </span>
              </div>
              <div class="ml-8 flex gap-1">
                @each(tag in task.tags)
                  <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100">
                    #{tag | upper}
                  </span>
                @endeach
              </div>
            @endeach
          </section>
        @endeach
      </div>
    \`;
    return buildAndInterpolateDSL(template, this);
  }
}`,

  useState: `import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { BaseComponent } from '@/core/types';
import { useState, type SubscribeFn } from '@/core/state.utils';

interface SelectedItem { id: number; name: string; }

// PADRE: Crea el store y lo pasa al hijo via output
export class ParentComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  // 1. Crear store compartido
  selectionStore = useState({ selected: null as SelectedItem | null });

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({ items: [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Bravo' }] });
  }

  selectItem(_el: HTMLElement, _ev: Event, item: SelectedItem): void {
    // 2. Actualizar store -> dispara callback en hijo
    this.selectionStore.put('selected', item);
  }

  render(): HTMLElement {
    const template = \`
      <div>
        <div data-each="item in state.items">
          <button on-click="selectItem:item">{item.name}</button>
        </div>
        <!-- 3. Pasar .on como output al hijo -->
        <div data-component="app-detail-panel"
             (data-source)="selectionStore.on">
        </div>
      </div>
    \`;
    return buildAndInterpolate(template, this);
  }
}

// HIJO: Se suscribe al store del padre
export class DetailPanel extends BaseComponent {

  selected: SelectedItem | null = null;
  dataSource?: SubscribeFn<{ selected: SelectedItem | null }>;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    if (this.dataSource) {
      const unsubscribe = this.dataSource('selected', (item) => {
        this.selected = item;
        this.updateBindings();
      });
      this.addCleanup(unsubscribe);
    }
  }

  render(): HTMLElement {
    const template = \`
      <div>
        <div data-bind="show:selected">
          <h3 data-bind="text:selected.name"></h3>
        </div>
        <p data-bind="hide:selected">Selecciona un elemento</p>
      </div>
    \`;
    return buildAndInterpolate(template, this);
  }
}`,

  outputs: `// HOST (padre): Usa (output)="handlerName" en el markup del hijo
const template = \`
  <div
    data-component="app-tab"
    data-selected="overview"
    data-variant="segmented"
    (tabchange)="handleTabChange"
    (tabclose)="handleTabClose"
    class="mt-4">
    <div data-id="tab1" data-title="Perfil" data-icon-name="user">
      Contenido del tab...
    </div>
  </div>
\`;

// El padre define los handlers:
handleTabChange(detail: TabEventDetail): void {
  console.log('Tab activa:', detail.title);
}

handleTabClose(detail: TabEventDetail): void {
  console.log('Tab cerrada:', detail.id);
}

// CHILD (hijo): Declara outputs como propiedades opcionales
export class TabComponent extends BaseComponent {
  public tabChange?: (detail: TabEventDetail) => void;
  public tabClose?: (detail: TabEventDetail) => void;

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  private switchTab(tabId: string): void {
    // Invocar output (si esta conectado, llama al padre)
    this.tabChange?.({ id: tabId, title: '...', index: 0 });
  }

  closeTab(id: string): void {
    this.tabClose?.({ id, title: '...', index: 1 });
  }
}`,

  pubsub: `import type { ComponentContext, ComponentInitValue } from '@/components/component.model';
import { buildAndInterpolate } from '@/core/dom';
import { pubSub } from '@/core/services/pubsub.service';
import { BaseComponent } from '@/core/types';

export class ChatComponent extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
    this.setState({ messages: [] as string[] });

    // Suscripcion global (todos los publicadores)
    this.subscribe('CHAT_MESSAGE', (payload: { text: string }) => {
      this.state.messages = [...this.state.messages, payload.text];
    });
  }

  sendGlobal(): void {
    // Publicar globalmente (cualquier suscriptor lo recibe)
    pubSub.publish('CHAT_MESSAGE', { text: 'Hola mundo (global)' });
  }

  sendLocal(): void {
    // Publicar en scope local (solo suscriptores con este instanceId)
    this.publish('CHAT_MESSAGE', { text: 'Solo yo lo veo (local)' });
  }

  render(): HTMLElement {
    const template = \`
      <div class="p-4">
        <div class="flex gap-2 mb-3">
          <button on-click="sendGlobal" class="app-button">Global</button>
          <button on-click="sendLocal" class="app-button btn-secondary">Local</button>
        </div>
        <ul data-each="msg in state.messages">
          <li class="text-sm">{msg}</li>
        </ul>
      </div>
    \`;
    return buildAndInterpolate(template, this);
  }
}

// En template HTML se puede usar on-publish para escuchar:
// <span on-publish="CHAT_MESSAGE:global:html"></span>
// <button on-click="publish:CHAT_MESSAGE:global">Enviar</button>`,

  registration: `// =============================================
// 1. Auto-descubrimiento (app.components.ts)
// =============================================
// Escanea ./components/**/*.component.ts
// collapsible.component.ts -> <app-collapsible>
// combo-box.component.ts   -> <app-combo-box>
const componentFiles = import.meta.glob('./components/**/*.component.ts');

// =============================================
// 2. Registro manual diferido (lazy)
// =============================================
const components = {
  'app-counter': () => import('./components/test/counter-component'),
  'app-badge': () =>
    import('./features/poc-1/components/github')
      .then(m => ({ default: m.BadgeComponent })),
};

// =============================================
// 3. Registro en tiempo de ejecucion
// =============================================
import { APP_CONFIG } from '@/app.config';

APP_CONFIG.registerComponent('app-polyline-viewer', PolylineViewerComponent);

// Desde un modulo lazy (espera al siguiente microtask)
Promise.resolve().then(() => {
  APP_CONFIG.registerComponent('app-map', MapComponent);
});`,

  bindings: `// Directivas data-bind disponibles (tipo.propiedad:path)
//
// text:path              → el.innerText = value
// html:path              → el.innerHTML = value
// value:path             → (el as HTMLInput).value = value
// checked:path           → (el as HTMLInput).checked = !!value
// attr.nombre:path       → el.setAttribute('nombre', value)
// class:path             → el.className = value
// toggle.clase:path      → el.classList.toggle('clase', !!value)
// style.propiedad:path   → el.style[propiedad] = value
// show:path              → el.style.display = value ? '' : 'none'
// hide:path              → el.style.display = value ? 'none' : ''
// disabled:path          → el.disabled = !!value
// fn:methodName          → context[methodName](el)
//
// Multiples bindings separados por ;
// data-bind="text:state.title;show:state.visible;toggle.active:state.isActive"
//
// Pipes en bindings:
// data-bind="text:state.age | default : Desconocida"
// data-bind="toggle.hidden:state.expanded | not"`
};

export default class ComponentPatternsGuidePage extends BaseComponent {

  constructor(ctx: ComponentContext) {
    super(ctx);
  }

  init(ctx: ComponentInitValue): void {
    super.init(ctx);
  }

  render(): HTMLElement {
    const template = `
      <section class="max-w-6xl mx-auto p-6 md:p-8 pb-20">
        <header class="mb-10">
          <h1 class="text-3xl md:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Guia de Patrones de Componentes — VanillaApp2026
          </h1>
          <p class="mt-3 text-slate-600 dark:text-slate-300 max-w-4xl">
            Referencia exhaustiva de los patrones de composicion, actualizacion y comunicacion
            encontrados en la aplicacion. Cada seccion incluye ejemplos completos con ciclo de vida,
            constructor y parametros reales de BaseComponent.
          </p>
          <nav class="mt-4 flex flex-wrap gap-2 text-xs">
            <a href="#lifecycle" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">Ciclo de vida</a>
            <a href="#functional" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">Factory</a>
            <a href="#reactive" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">Reactivo</a>
            <a href="#surgical" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">Quirurgico</a>
            <a href="#hydration" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">Hydration</a>
            <a href="#dsl" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">DSL</a>
            <a href="#usestate" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">useState</a>
            <a href="#outputs" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">Outputs</a>
            <a href="#pubsub" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">PubSub</a>
            <a href="#bindings" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">Bindings</a>
            <a href="#registration" class="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900">Registro</a>
          </nav>
        </header>

        <div class="grid gap-8">

          <!-- 0. CICLO DE VIDA -->
          <article id="lifecycle" class="rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-indigo-700 dark:text-indigo-400">0. Ciclo de vida de BaseComponent</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Orden: constructor(ctx) → init(ctx) → render() → mounted() → [updates] → destroy().
              El estado es un Proxy: al asignar this.state.prop se dispara render(changedProp).
              setState agrupa cambios sin disparar renders intermedios.
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Metodos utiles: addCleanup(fn), invalidate(), publish(topic), subscribe(topic, cb),
              updateBindings(), whenChildrenReady(), bind(el).
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[32rem]" data-bind="text:snippets.lifecycle"></pre>
          </article>

          <!-- 1. FACTORY -->
          <article id="functional" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">1. Componente funcional (ComponentFactory)</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Funcion que retorna un objeto literal con render(). Sin herencia de clase. Ideal para paginas
              sencillas, prototipos o componentes de un solo uso. El framework lo trata igual que una clase
              pero sin ciclo de vida completo.
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ejemplos: home.page.ts, template.page.ts, keep-alive.page.ts, strava-login.page.ts, strava-activities.page.ts.
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[28rem]" data-bind="text:snippets.functional"></pre>
            <p class="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Caso ideal: vistas estaticas, paginas de contenido, prototipado rapido.
            </p>
          </article>

          <!-- 2. REACTIVE RERENDER -->
          <article id="reactive" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">2. BaseComponent reactivo (rerender completo)</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              El patron mas comun. Cada cambio en state dispara render() que reconstruye el DOM completo.
              Sencillo de razonar. Usa setState() para agrupar cambios y evitar renders parciales.
              Usa invalidate() para forzar re-render sin cambio de estado.
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ejemplos: table-basic.page.ts, landing.page.ts, the-simpsons-component.ts, splash-screen.page.ts.
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[32rem]" data-bind="text:snippets.reactiveRerender"></pre>
            <p class="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Caso ideal: UI de negocio con estado complejo, paginas con datos remotos y eventos de usuario.
            </p>
          </article>

          <!-- 3. SURGICAL -->
          <article id="surgical" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">3. Actualizacion quirurgica con data-bind</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              En render(changedProp), si ya existe this.element se llama updateBindings() y se retorna
              el mismo elemento. Solo los nodos con data-bind se actualizan. Mantiene referencias DOM,
              foco de inputs y scroll. Ideal para alta frecuencia de actualizacion.
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ejemplos: collapsible.component.ts, combo-box.component.ts, menu-trigger.component.ts,
              overflow-toolbar.page.ts, pipe-tester.component.ts.
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[36rem]" data-bind="text:snippets.surgical"></pre>
            <p class="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Caso ideal: paneles interactivos, filtros, dropdowns, controles con actualizaciones frecuentes.
            </p>
          </article>

          <!-- 4. HYDRATION -->
          <article id="hydration" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">4. Render imperativo + hydrateComponents</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Se genera HTML con innerHTML (rapido para listas grandes) y despues se hidratan subcomponentes
              declarativos con hydrateComponents(). Combina velocidad de string templating con la capacidad
              de montar componentes hijos completos.
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ejemplo principal: strava-activities.page.ts.
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[32rem]" data-bind="text:snippets.imperativeHydration"></pre>
            <p class="mt-3 text-sm text-amber-700 dark:text-amber-400 font-medium">
              Caso ideal: listas paginadas, colecciones remotas con subcomponentes reutilizables.
            </p>
          </article>

          <!-- 5. DSL -->
          <article id="dsl" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">5. DSL template compiler (@if / @each / @else)</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              buildAndInterpolateDSL soporta directivas de control de flujo en el template:
              @if(cond), @else, @endif, @each(item in array), @endeach. Permite condiciones
              dentro de atributos de clase y bucles anidados. Usa pipes con | en interpolaciones.
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ejemplos: the-simpsons-component.ts, terms.page.ts, template-demo.component.ts, pubsub-demo.component.ts.
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[36rem]" data-bind="text:snippets.dsl"></pre>
            <p class="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Caso ideal: plantillas con logica visual compleja, condiciones en clases CSS, bucles anidados.
            </p>
          </article>

          <!-- 6. USESTATE -->
          <article id="usestate" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">6. useState: estado compartido entre componentes</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              useState() crea un store observable con .put(prop, value) y .on(prop, callback).
              El padre crea el store y pasa .on via output handler al hijo. El hijo se suscribe
              y reacciona a cambios. Permite comunicacion reactiva sin acoplamiento.
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ejemplo: the-simpsons-component.ts (characterStore entre parent y CharacterInfoComponent).
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[36rem]" data-bind="text:snippets.useState"></pre>
            <p class="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Caso ideal: compartir seleccion, filtros o datos en tiempo real entre componentes hermanos o padre-hijo.
            </p>
          </article>

          <!-- 7. OUTPUTS -->
          <article id="outputs" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">7. Output handlers (hijo → padre)</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Sintaxis (output-name)="parentHandler" en el host del hijo. Se convierte
              kebab-case → camelCase. El hijo declara la propiedad como opcional y la invoca
              con ?.(). El framework conecta automaticamente en setupOutputs().
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ejemplos: home.page.ts (tabchange, tabclose, selected, custom-render).
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[28rem]" data-bind="text:snippets.outputs"></pre>
            <p class="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Caso ideal: componentes reutilizables que notifican eventos al contenedor (tabs, selects, modales).
            </p>
          </article>

          <!-- 8. PUBSUB -->
          <article id="pubsub" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">8. PubSub: comunicacion desacoplada</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Sistema de mensajes global/local. this.publish() y this.subscribe() usan el instanceId
              para scope local. pubSub.publish() sin instanceId es global. En templates: on-click="publish:TOPIC:scope"
              y on-publish="TOPIC:scope:action".
            </p>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ejemplos: pubsub-demo.component.ts, the-simpsons-component.ts, header.component.ts.
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[28rem]" data-bind="text:snippets.pubsub"></pre>
            <p class="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              Caso ideal: comunicacion entre componentes sin relacion directa padre-hijo, eventos de app globales.
            </p>
          </article>

          <!-- 9. BINDINGS REFERENCE -->
          <article id="bindings" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">9. Referencia de directivas data-bind</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Formato: data-bind="tipo.propiedad:path". Se pueden encadenar con ;.
              El path soporta pipes: data-bind="text:value | upper". El resolver fn ejecuta
              un metodo del contexto recibiendo el elemento como argumento.
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[24rem]" data-bind="text:snippets.bindings"></pre>
          </article>

          <!-- 10. REGISTRATION -->
          <article id="registration" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">10. Registro de componentes</h2>
            <p class="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Tres formas: auto-descubrimiento (glob en app.components.ts), registro manual diferido
              con import() dinamico, o registro en runtime con APP_CONFIG.registerComponent().
              La hidratacion busca [data-component] y resuelve del registro.
            </p>
            <pre class="mt-3 p-4 rounded-xl bg-slate-950 text-slate-100 text-[11px] leading-relaxed overflow-auto max-h-[24rem]" data-bind="text:snippets.registration"></pre>
          </article>

        </div>

        <!-- RESUMEN -->
        <section class="mt-10 rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/20 p-6">
          <h2 class="text-xl font-bold text-indigo-800 dark:text-indigo-300">Resumen: que patron usar segun el caso</h2>
          <div class="mt-4 overflow-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs uppercase text-slate-500 border-b dark:border-slate-700">
                <tr>
                  <th class="py-2 pr-4">Caso de uso</th>
                  <th class="py-2 pr-4">Patron recomendado</th>
                  <th class="py-2">Render</th>
                </tr>
              </thead>
              <tbody class="text-slate-700 dark:text-slate-300">
                <tr class="border-b dark:border-slate-800">
                  <td class="py-2 pr-4">Pagina estatica / prototipo</td>
                  <td class="py-2 pr-4 font-medium">ComponentFactory</td>
                  <td class="py-2">buildAndInterpolate</td>
                </tr>
                <tr class="border-b dark:border-slate-800">
                  <td class="py-2 pr-4">Pagina de negocio con estado</td>
                  <td class="py-2 pr-4 font-medium">BaseComponent reactivo</td>
                  <td class="py-2">buildAndInterpolate</td>
                </tr>
                <tr class="border-b dark:border-slate-800">
                  <td class="py-2 pr-4">Componente de alta frecuencia</td>
                  <td class="py-2 pr-4 font-medium">Quirurgico (data-bind)</td>
                  <td class="py-2">updateBindings()</td>
                </tr>
                <tr class="border-b dark:border-slate-800">
                  <td class="py-2 pr-4">Lista paginada con subcomponentes</td>
                  <td class="py-2 pr-4 font-medium">Imperativo + hydrateComponents</td>
                  <td class="py-2">innerHTML + hydrate</td>
                </tr>
                <tr class="border-b dark:border-slate-800">
                  <td class="py-2 pr-4">Plantilla con logica visual compleja</td>
                  <td class="py-2 pr-4 font-medium">DSL compiler</td>
                  <td class="py-2">buildAndInterpolateDSL</td>
                </tr>
                <tr class="border-b dark:border-slate-800">
                  <td class="py-2 pr-4">Estado compartido padre-hijo</td>
                  <td class="py-2 pr-4 font-medium">useState + outputs</td>
                  <td class="py-2">updateBindings()</td>
                </tr>
                <tr class="border-b dark:border-slate-800">
                  <td class="py-2 pr-4">Eventos hijo → padre</td>
                  <td class="py-2 pr-4 font-medium">Output handlers</td>
                  <td class="py-2">callback?.(...)</td>
                </tr>
                <tr>
                  <td class="py-2 pr-4">Comunicacion desacoplada global</td>
                  <td class="py-2 pr-4 font-medium">PubSub</td>
                  <td class="py-2">publish/subscribe</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    `;

    return buildAndInterpolate(template, { snippets: SNIPPETS });
  }
}
